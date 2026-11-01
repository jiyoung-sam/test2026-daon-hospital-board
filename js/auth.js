import { supabase, showMessage } from "./supabaseClient.js";

const message = document.querySelector("#authMessage");
const loginForm = document.querySelector("#loginForm");
const signupForm = document.querySelector("#signupForm");

document.querySelectorAll("[data-auth-tab]").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll("[data-auth-tab]").forEach(item => item.classList.remove("active"));
    button.classList.add("active");
    const isLogin = button.dataset.authTab === "login";
    loginForm.hidden = !isLogin;
    signupForm.hidden = isLogin;
    showMessage(message, "");
  });
});

loginForm.addEventListener("submit", async event => {
  event.preventDefault();
  const email = document.querySelector("#loginEmail").value.trim();
  const password = document.querySelector("#loginPassword").value;
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return showMessage(message, error.message, "error");
  showMessage(message, "로그인되었습니다. 게시판으로 이동합니다.", "success");
  setTimeout(() => location.href = "index.html", 600);
});

signupForm.addEventListener("submit", async event => {
  event.preventDefault();
  const display_name = document.querySelector("#signupName").value.trim();
  const email = document.querySelector("#signupEmail").value.trim();
  const password = document.querySelector("#signupPassword").value;
  const { data, error } = await supabase.auth.signUp({
    email, password, options: { data: { display_name } }
  });
  if (error) return showMessage(message, error.message, "error");
  if (data.session) {
    showMessage(message, "회원가입이 완료되었습니다. 게시판으로 이동합니다.", "success");
    setTimeout(() => location.href = "index.html", 700);
  } else {
    showMessage(message, "가입 요청이 완료되었습니다. 이메일 인증을 마친 뒤 로그인해 주세요.", "success");
  }
});
