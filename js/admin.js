import { supabase, getCurrentProfile, formatDate, showMessage } from "./supabaseClient.js";

const notice = document.querySelector("#adminNotice");
const panel = document.querySelector("#adminPanel");
const { user, profile } = await getCurrentProfile();

if (!user) {
  showMessage(notice, "관리자 페이지입니다. 먼저 로그인해 주세요.", "error");
} else if (profile?.role !== "admin") {
  showMessage(notice, "관리자 권한이 없습니다. 병원 관리자에게 문의해 주세요.", "error");
} else {
  notice.hidden = true;
  panel.hidden = false;
  await loadAdminData();
}

async function loadAdminData() {
  const [{ data: posts, error: postError }, { count: commentCount, error: commentError }] = await Promise.all([
    supabase.from("posts").select("id, title, is_notice, created_at, profiles(display_name)").order("created_at", { ascending: false }),
    supabase.from("comments").select("*", { count: "exact", head: true })
  ]);
  if (postError || commentError) return showMessage(notice, "관리자 데이터를 불러오지 못했습니다.", "error");
  document.querySelector("#totalPosts").textContent = posts.length;
  document.querySelector("#totalNotices").textContent = posts.filter(post => post.is_notice).length;
  document.querySelector("#totalComments").textContent = commentCount ?? 0;

  const tbody = document.querySelector("#adminPostRows");
  tbody.innerHTML = "";
  posts.forEach(post => {
    const row = document.createElement("tr");
    const kind = document.createElement("td");
    kind.textContent = post.is_notice ? "공지" : "일반";
    const title = document.createElement("td");
    const link = document.createElement("a");
    link.href = `post.html?id=${post.id}`;
    link.textContent = post.title;
    title.append(link);
    const date = document.createElement("td");
    date.textContent = formatDate(post.created_at);
    const actions = document.createElement("td");
    actions.className = "admin-actions";
    const toggle = document.createElement("button");
    toggle.className = "text-button";
    toggle.textContent = post.is_notice ? "공지 해제" : "공지 지정";
    toggle.addEventListener("click", () => toggleNotice(post.id, !post.is_notice));
    const remove = document.createElement("button");
    remove.className = "text-button danger-text";
    remove.textContent = "삭제";
    remove.addEventListener("click", () => removePost(post.id));
    actions.append(toggle, remove);
    row.append(kind, title, date, actions);
    tbody.append(row);
  });
}

async function toggleNotice(id, value) {
  const { error } = await supabase.from("posts").update({ is_notice: value }).eq("id", id);
  if (error) alert(error.message);
  else loadAdminData();
}
async function removePost(id) {
  if (!confirm("게시글을 삭제할까요? 연결된 댓글도 함께 삭제됩니다.")) return;
  const { error } = await supabase.from("posts").delete().eq("id", id);
  if (error) alert(error.message);
  else loadAdminData();
}
