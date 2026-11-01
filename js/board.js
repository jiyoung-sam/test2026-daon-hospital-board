import { supabase, formatDate, showMessage } from "./supabaseClient.js";
import { setupHeader } from "./common.js";

const list = document.querySelector("#postList");
const empty = document.querySelector("#emptyState");
const count = document.querySelector("#postCount");
const message = document.querySelector("#boardMessage");
let allPosts = [];
let currentFilter = "all";
let currentSearch = "";

await setupHeader();
await loadPosts();

async function loadPosts() {
  const { data, error } = await supabase
    .from("posts")
    .select("id, title, content, is_notice, created_at, profiles(display_name)")
    .order("is_notice", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    list.innerHTML = "";
    showMessage(message, "게시글을 불러오지 못했습니다. Supabase 설정과 SQL 실행 여부를 확인해 주세요.", "error");
    count.textContent = "연결 확인 필요";
    return;
  }
  allPosts = data || [];
  renderPosts();
}

function renderPosts() {
  const filtered = allPosts.filter(post => {
    const typeMatch = currentFilter === "all" ||
      (currentFilter === "notice" ? post.is_notice : !post.is_notice);
    const keyword = currentSearch.toLocaleLowerCase();
    const textMatch = !keyword || `${post.title} ${post.content}`.toLocaleLowerCase().includes(keyword);
    return typeMatch && textMatch;
  });

  list.innerHTML = "";
  count.textContent = `총 ${filtered.length}개의 게시글`;
  empty.hidden = filtered.length !== 0;

  filtered.forEach(post => {
    const item = document.createElement("a");
    item.className = `post-row ${post.is_notice ? "notice-row" : ""}`;
    item.href = `post.html?id=${post.id}`;
    const category = document.createElement("span");
    category.className = post.is_notice ? "category-badge notice" : "category-badge";
    category.textContent = post.is_notice ? "공지" : "일반";
    const title = document.createElement("strong");
    title.className = "post-row-title";
    title.textContent = post.title;
    const author = document.createElement("span");
    author.className = "post-author";
    author.textContent = post.profiles?.display_name || "회원";
    const date = document.createElement("time");
    date.textContent = formatDate(post.created_at);
    item.append(category, title, author, date);
    list.append(item);
  });
}

document.querySelectorAll("[data-filter]").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll("[data-filter]").forEach(item => item.classList.remove("active"));
    button.classList.add("active");
    currentFilter = button.dataset.filter;
    renderPosts();
  });
});

document.querySelector("#searchForm").addEventListener("submit", event => {
  event.preventDefault();
  currentSearch = document.querySelector("#searchInput").value.trim();
  renderPosts();
});

supabase.auth.onAuthStateChange(() => setupHeader());
