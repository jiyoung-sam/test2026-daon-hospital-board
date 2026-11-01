# 다온한방병원 게시판 (HTML / CSS / JavaScript + Supabase)

실제 데이터가 저장되는 회원제 게시판 예제입니다. 정적 웹사이트는 Vercel에 배포하고, 회원·게시글·댓글·이미지는 Supabase에서 관리합니다.

## 폴더 구조

```text
daon-hospital-board/
├── index.html              # 게시글 목록
├── login.html              # 로그인 / 회원가입
├── post.html               # 게시글 보기 / 작성 / 수정
├── admin.html              # 관리자 페이지
├── config.example.js       # Supabase 설정 예시
├── config.js               # 직접 생성할 설정 파일 (Git 제외 권장)
├── css/
│   └── style.css           # 전체 디자인
├── js/
│   ├── supabaseClient.js   # Supabase 연결 및 공통 함수
│   ├── common.js           # 공통 헤더
│   ├── board.js            # 게시글 목록 / 검색
│   ├── auth.js             # 회원가입 / 로그인
│   ├── post.js             # 게시글 / 댓글 / 이미지
│   └── admin.js            # 관리자 기능
└── sql/
    └── schema.sql          # 테이블 / RLS / Storage 정책
```

## 1. Supabase 프로젝트 만들기

1. https://supabase.com 에 접속해 로그인합니다.
2. 새 프로젝트를 생성합니다.
3. 프로젝트가 준비되면 **SQL Editor** 메뉴로 이동합니다.
4. `sql/schema.sql` 파일의 전체 SQL을 복사해 실행합니다.
5. **Project Settings > API**에서 Project URL과 Publishable key(또는 anon public key)를 확인합니다.

## 2. 브라우저 설정 파일 만들기

프로젝트 최상위 폴더에 `config.js` 파일을 새로 만듭니다. `config.example.js`를 복사해 이름만 바꿔도 됩니다.

```js
window.APP_CONFIG = {
  SUPABASE_URL: "https://프로젝트ID.supabase.co",
  SUPABASE_ANON_KEY: "Supabase에서_복사한_Publishable_또는_anon_키"
};
```

주의:
- `service_role` 또는 `secret` 키는 절대 브라우저 코드에 넣지 마세요.
- 브라우저 공개 키는 공개되어도 되는 키입니다. 데이터 보호는 SQL의 RLS 정책이 담당합니다.
- 실제 운영 전에는 이메일 인증, 비밀번호 정책, 도메인 제한, 개인정보 처리방침을 점검하세요.

## 3. 관리자 계정 지정

1. 웹사이트의 회원가입 화면에서 관리자 이메일로 먼저 가입합니다.
2. Supabase Dashboard > SQL Editor에서 아래 SQL을 실행합니다. 이메일을 실제 관리자 이메일로 바꿉니다.

```sql
update public.profiles
set role = 'admin'
where id = (
  select id from auth.users
  where email = '관리자이메일@example.com'
);
```

3. 관리자 계정으로 다시 로그인합니다.
4. `admin.html`에 접속해 공지 지정/해제와 게시글 삭제를 관리합니다.

중요: 회원가입 화면에서는 관리자 권한을 선택할 수 없습니다. 관리자 권한은 신뢰할 수 있는 운영자가 Supabase에서 직접 부여해야 합니다.

## 4. 로컬에서 테스트

ES 모듈을 사용하므로 HTML 파일을 더블 클릭(file://)하지 말고 로컬 서버로 실행하세요.

VS Code에서 Live Server 확장 기능을 설치한 후 `index.html`을 열고 **Open with Live Server**를 선택합니다.

또는 Python이 설치되어 있다면 프로젝트 폴더에서 다음 명령을 실행할 수 있습니다.

```bash
python -m http.server 5500
```

브라우저에서 `http://localhost:5500`으로 접속합니다.

## 5. GitHub 업로드

1. GitHub에서 새 저장소(repository)를 만듭니다.
2. 이 폴더 안의 파일과 폴더를 저장소에 업로드합니다.
3. `config.js`에는 Supabase URL과 브라우저 공개 키(publishable/anon)만 입력합니다. 이 파일은 정적 웹사이트가 접속할 때 필요하므로 저장소에 함께 업로드합니다.
4. `service_role` 또는 `secret` 키는 절대 저장소에 올리지 않습니다.

`.gitignore`에는 운영체제가 생성하는 불필요한 파일만 제외합니다.

```gitignore
.DS_Store
```

## 6. Vercel 배포

정적 HTML 프로젝트이므로 별도 빌드 명령이 필요하지 않습니다.

1. Vercel에 로그인하고 **Add New > Project**를 선택합니다.
2. GitHub 저장소를 연결합니다.
3. Framework Preset은 **Other** 또는 **Other Static**을 선택합니다.
4. Build Command는 비워 두고 Output Directory는 `.`로 설정합니다.
5. 배포 전에 `config.js`를 프로젝트 루트에 제공해야 합니다.

### 권장: Vercel 환경변수로 설정값 관리하기

정적 HTML은 서버에서 환경변수를 자동으로 브라우저 JS에 주입하지 않습니다. 이 예제는 단순화를 위해 `config.js` 파일 방식을 사용합니다. Vercel에 배포할 때는 `config.js`를 저장소에 포함하거나, 빌드 단계에서 환경변수로 생성하도록 별도 빌드 구성을 추가해야 합니다.

이 예제는 별도 빌드 과정이 없는 정적 HTML 프로젝트이므로 `config.js`를 저장소에 포함하는 방식으로 구성했습니다. Supabase URL과 publishable/anon 공개 키는 브라우저에 노출되는 것을 전제로 한 키입니다. 데이터 보호는 RLS 정책이 담당합니다. `service_role` 또는 `secret` 키는 절대 넣지 마세요.

## 7. Supabase 인증 설정

Supabase Dashboard > Authentication > URL Configuration에서 다음을 설정합니다.

- Site URL: 배포한 Vercel 주소
- Redirect URLs: 배포 도메인 및 로컬 테스트 주소

이메일 인증을 사용하는 경우 Authentication > Email의 인증 설정과 이메일 템플릿도 확인합니다.

## 8. 기능 및 권한

| 기능 | 비회원 | 일반 회원 | 관리자 |
|---|---:|---:|---:|
| 게시글 읽기 | O | O | O |
| 일반 글 작성 | X | O | O |
| 본인 글 수정/삭제 | X | O | O |
| 공지 작성/지정 | X | X | O |
| 댓글 작성 | X | O | O |
| 본인 댓글 삭제 | X | O | O |
| 관리자 페이지 | X | X | O |

## 9. 실제 운영 전 확인 사항

이 프로젝트는 작동 가능한 기본 게시판이지만 병원에서 공개 운영하기 전 아래 항목을 추가 점검해야 합니다.

- 개인정보 처리방침 및 이용약관
- 이메일 인증 및 스팸 방지(예: CAPTCHA / Rate Limit)
- 이미지 업로드 파일 검사와 악성 파일 방지
- 정기 백업 및 복구 절차
- 관리자 계정 다중 인증
- 게시글·댓글 신고 및 개인정보 노출 대응 절차
- 진료기록, 주민등록번호, 연락처 등 민감정보 입력 금지 안내
- 병원 개인정보 보호 담당자와 법률·보안 검토

특히 의료기관 게시판에서는 환자의 진료 내용이나 건강정보가 공개 게시글에 노출되지 않도록 안내하고 관리해야 합니다.
