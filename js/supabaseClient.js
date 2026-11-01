// Supabase 연결을 한 곳에서 관리합니다.
// 모든 페이지가 이 파일을 가져와 같은 방식으로 데이터베이스에 접속합니다.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const config = window.APP_CONFIG || {};
if (!config.SUPABASE_URL || !config.SUPABASE_ANON_KEY ||
    config.SUPABASE_URL.includes("YOUR-PROJECT") ||
    config.SUPABASE_ANON_KEY.includes("YOUR_SUPABASE")) {
  console.error("config.js에 Supabase URL과 공개 키를 입력해 주세요.");
}

export const supabase = createClient(
  config.SUPABASE_URL,
  config.SUPABASE_ANON_KEY
);

// 화면에 표시할 문자열을 안전하게 처리할 때 사용할 함수입니다.
export function formatDate(value) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric", month: "2-digit", day: "2-digit"
  }).format(new Date(value));
}

export async function getCurrentProfile() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, profile: null };
  const { data: profile } = await supabase
    .from("profiles").select("id, display_name, role").eq("id", user.id).maybeSingle();
  return { user, profile };
}

export function showMessage(element, message, type = "info") {
  if (!element) return;
  element.textContent = message;
  element.className = `message ${type}`;
}
