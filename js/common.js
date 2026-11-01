import { supabase, getCurrentProfile } from "./supabaseClient.js";

// 공통 헤더의 로그인 상태와 로그아웃 버튼을 설정합니다.
export async function setupHeader() {
  const status = document.querySelector("#userStatus");
  const loginLink = document.querySelector("#loginLink");
  const logoutButton = document.querySelector("#logoutButton");
  const adminNav = document.querySelector("#adminNav");
  const { user, profile } = await getCurrentProfile();

  if (status) status.textContent = user ? `${profile?.display_name || user.email}님` : "로그인이 필요합니다.";
  if (loginLink) loginLink.hidden = !!user;
  if (logoutButton) logoutButton.hidden = !user;
  if (adminNav) adminNav.hidden = profile?.role !== "admin";

  logoutButton?.addEventListener("click", async () => {
    await supabase.auth.signOut();
    location.href = "index.html";
  });
  return { user, profile };
}
