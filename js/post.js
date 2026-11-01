import { supabase, getCurrentProfile, formatDate, showMessage } from "./supabaseClient.js";
import { setupHeader } from "./common.js";

const params = new URLSearchParams(location.search);
const postId = params.get("id");
const isEdit = params.get("edit") === "1";
const postForm = document.querySelector("#postForm");
const detail = document.querySelector("#postDetail");
const message = document.querySelector("#postMessage");
const { user, profile } = await setupHeader();
let currentPost = null;
let existingImageUrl = null;

if (!user) {
  // 비회원은 읽기만 가능하며 글쓰기와 댓글 작성 시 로그인 페이지로 안내합니다.
  if (!postId || isEdit) {
    showMessage(message, "게시글 작성 또는 수정은 로그인 후 이용할 수 있습니다.", "error");
    postForm.querySelector("button[type=submit]").disabled = true;
  }
}
if (profile?.role === "admin") document.querySelector("#noticeOption").hidden = false;

if (postId && !isEdit) {
  postForm.hidden = true;
  detail.hidden = false;
  await loadDetail();
} else if (postId && isEdit) {
  document.querySelector("#editorHeading").textContent = "게시글 수정";
  await loadForEdit();
}

async function loadDetail() {
  const { data, error } = await supabase.from("posts")
    .select("*, profiles(display_name)").eq("id", postId).single();
  if (error) return showMessage(message, "게시글을 찾을 수 없습니다.", "error");
  currentPost = data;
  const content = document.querySelector("#detailContent");
  content.innerHTML = "";
  const badge = document.createElement("span");
  badge.className = data.is_notice ? "category-badge notice" : "category-badge";
  badge.textContent = data.is_notice ? "공지사항" : "일반 게시글";
  const title = document.createElement("h1");
  title.textContent = data.title;
  const meta = document.createElement("p");
  meta.className = "detail-meta";
  meta.textContent = `${data.profiles?.display_name || "회원"} · ${formatDate(data.created_at)}`;
  const body = document.createElement("div");
  body.className = "detail-body";
  body.textContent = data.content;
  content.append(badge, title, meta, body);
  if (data.image_url) {
    const image = document.createElement("img");
    image.className = "detail-image";
    image.src = data.image_url;
    image.alt = "게시글 첨부 이미지";
    content.append(image);
  }

  const canManage = user && (user.id === data.author_id || profile?.role === "admin");
  document.querySelector("#ownerActions").hidden = !canManage;
  document.querySelector("#editPost").href = `post.html?id=${postId}&edit=1`;
  document.querySelector("#deletePost").addEventListener("click", deletePost, { once: true });
  await loadComments();
}

async function loadForEdit() {
  const { data, error } = await supabase.from("posts").select("*").eq("id", postId).single();
  if (error) return showMessage(message, "게시글을 불러오지 못했습니다.", "error");
  if (!user || (user.id !== data.author_id && profile?.role !== "admin")) {
    showMessage(message, "이 게시글을 수정할 권한이 없습니다.", "error");
    postForm.querySelector("button[type=submit]").disabled = true;
    return;
  }
  currentPost = data;
  existingImageUrl = data.image_url;
  document.querySelector("#postTitle").value = data.title;
  document.querySelector("#postContent").value = data.content;
  document.querySelector("#isNotice").checked = data.is_notice;
  if (existingImageUrl) document.querySelector("#existingImage").textContent = "기존 이미지가 등록되어 있습니다. 새 이미지를 선택하면 교체됩니다.";
}

postForm.addEventListener("submit", async event => {
  event.preventDefault();
  if (!user) return showMessage(message, "로그인이 필요합니다.", "error");
  const title = document.querySelector("#postTitle").value.trim();
  const content = document.querySelector("#postContent").value.trim();
  const file = document.querySelector("#postImage").files[0];
  if (!title || !content) return showMessage(message, "제목과 내용을 입력해 주세요.", "error");
  if (file && (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024)) {
    return showMessage(message, "이미지는 JPG, PNG, WEBP 형식으로 5MB 이하만 업로드할 수 있습니다.", "error");
  }

  let image_url = existingImageUrl;
  if (file) {
    const extension = file.name.split(".").pop().toLowerCase();
    const path = `${user.id}/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage.from("post-images").upload(path, file, { upsert: false });
    if (uploadError) return showMessage(message, `이미지 업로드 실패: ${uploadError.message}`, "error");
    const { data: publicData } = supabase.storage.from("post-images").getPublicUrl(path);
    image_url = publicData.publicUrl;
  }

  const payload = {
    title, content, image_url,
    author_id: user.id,
    is_notice: profile?.role === "admin" && document.querySelector("#isNotice").checked
  };

  let result;
  if (isEdit && currentPost) {
    delete payload.author_id;
    result = await supabase.from("posts").update(payload).eq("id", postId);
  } else {
    result = await supabase.from("posts").insert(payload);
  }
  if (result.error) return showMessage(message, result.error.message, "error");
  showMessage(message, "저장되었습니다.", "success");
  setTimeout(() => location.href = "index.html", 500);
});

async function deletePost() {
  if (!confirm("이 게시글을 삭제할까요?")) return;
  const { error } = await supabase.from("posts").delete().eq("id", postId);
  if (error) return alert(`삭제하지 못했습니다: ${error.message}`);
  location.href = "index.html";
}

async function loadComments() {
  const { data, error } = await supabase.from("comments")
    .select("id, content, created_at, author_id, profiles(display_name)")
    .eq("post_id", postId).order("created_at", { ascending: true });
  const list = document.querySelector("#commentList");
  list.innerHTML = "";
  if (error) {
    list.textContent = "댓글을 불러오지 못했습니다.";
    return;
  }
  document.querySelector("#commentCount").textContent = data.length;
  data.forEach(comment => {
    const item = document.createElement("article");
    item.className = "comment-item";
    const head = document.createElement("div");
    head.className = "comment-head";
    const author = document.createElement("strong");
    author.textContent = comment.profiles?.display_name || "회원";
    const date = document.createElement("time");
    date.textContent = formatDate(comment.created_at);
    head.append(author, date);
    const body = document.createElement("p");
    body.textContent = comment.content;
    item.append(head, body);
    if (user && (user.id === comment.author_id || profile?.role === "admin")) {
      const remove = document.createElement("button");
      remove.className = "text-button";
      remove.textContent = "삭제";
      remove.addEventListener("click", async () => {
        if (!confirm("댓글을 삭제할까요?")) return;
        const { error: deleteError } = await supabase.from("comments").delete().eq("id", comment.id);
        if (deleteError) alert(deleteError.message);
        else loadComments();
      });
      item.append(remove);
    }
    list.append(item);
  });
}

document.querySelector("#commentForm").addEventListener("submit", async event => {
  event.preventDefault();
  if (!user) return location.href = "login.html";
  const input = document.querySelector("#commentInput");
  const content = input.value.trim();
  if (!content) return;
  const { error } = await supabase.from("comments").insert({ post_id: Number(postId), author_id: user.id, content });
  if (error) return alert(error.message);
  input.value = "";
  await loadComments();
});
