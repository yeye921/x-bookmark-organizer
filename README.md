# 📌 X Bookmark Manager

X(Twitter) 북마크를 폴더별로 정리하고 관리할 수 있는 웹 애플리케이션입니다.

## 💡 왜 만들었나요?

X(Twitter)의 북마크 기능에는 불편한 점이 있습니다:

| 문제 | 설명 |
|------|------|
| **끝없는 스크롤** | 북마크가 시간순으로만 나열되어, 원하는 글을 찾으려면 끝없이 스크롤해야 합니다. 검색이나 정렬 기능이 없습니다. |
| **폴더 = 유료** | 북마크를 폴더별로 분류하려면 X Premium(유료 구독)이 필요합니다. |
| **정렬 불가** | 최신순/오래된순 등 원하는 기준으로 정렬할 수 없습니다. |

**X Bookmark Manager**는 이 모든 문제를 **무료**로 해결합니다:

- 🔍 **키워드 검색** — 저장한 북마크를 즉시 검색
- 📂 **무료 폴더 분류** — 구독 없이 폴더별 정리
- ↕️ **정렬** — 최신순 / 오래된순으로 자유롭게 정렬
- 🌙 **다크/라이트 모드** — 테마 전환 지원
- 📱 **반응형 디자인** — 모바일·데스크탑 모두 지원

## ✨ 주요 기능

- **X(Twitter) 로그인** — OAuth 2.0 PKCE 기반 안전한 인증
- **북마크 동기화** — X 북마크를 자동으로 가져와 저장
- **폴더 정리** — 북마크를 원하는 폴더로 분류·관리
- **검색** — 키워드로 북마크 검색
- **정렬** — 북마크 시간 기준 최신순/오래된순 정렬
- **다크/라이트 모드** — 테마 전환 지원
- **반응형 디자인** — 모바일·데스크탑 모두 지원

## 🛠 기술 스택

| 영역 | 기술 |
|------|------|
| 프론트엔드 | React 18, TypeScript, Vite, Tailwind CSS |
| UI 컴포넌트 | shadcn/ui |
| 백엔드 | Supabase (PostgreSQL, Auth, Edge Functions) |
| 인증 | Twitter OAuth 2.0 PKCE |
| 호스팅 | Lovable |

## 🚀 시작하기

### 사전 요구사항

- Node.js 18+ & npm
- [Twitter Developer](https://developer.twitter.com/) 앱 (OAuth 2.0 설정 필요)
- Supabase 프로젝트

### 설치 및 실행

```bash
# 1. 저장소 클론
git clone <YOUR_GIT_URL>
cd x-bookmark-manager

# 2. 의존성 설치
npm install

# 3. 환경변수 설정 (.env)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key

# 4. 개발 서버 실행
npm run dev
```

### Edge Function 시크릿 설정

Edge Function이 동작하려면 다음 시크릿이 필요합니다:

| 시크릿 | 설명 |
|--------|------|
| `TWITTER_CLIENT_ID` | Twitter OAuth 클라이언트 ID |
| `TWITTER_CLIENT_SECRET` | Twitter OAuth 클라이언트 시크릿 |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 관리자 키 |

## 📂 프로젝트 구조

```
src/
├── pages/
│   ├── LoginPage.tsx          # X 로그인 화면
│   ├── TwitterCallback.tsx    # OAuth 콜백 처리
│   ├── Index.tsx              # 메인 대시보드
│   └── NotFound.tsx
├── components/
│   ├── FolderSidebar.tsx      # 폴더 사이드바
│   ├── BookmarkCard.tsx       # 북마크 카드
│   ├── ImageGrid.tsx          # 이미지 그리드
│   └── ui/                    # shadcn/ui 컴포넌트
├── hooks/
│   ├── useAuth.ts             # 인증 상태 관리
│   ├── useTwitterAuth.ts      # Twitter OAuth 플로우
│   ├── useBookmarks.ts        # 북마크/폴더 CRUD
│   └── useTheme.ts            # 다크/라이트 모드
└── integrations/supabase/     # Supabase 클라이언트 (자동 생성)

supabase/functions/
├── twitter-auth/              # Twitter 인증 처리
└── sync-bookmarks/            # 북마크 동기화
```

## 🗄 데이터베이스

| 테이블 | 설명 |
|--------|------|
| `profiles` | 유저 정보 및 Twitter 토큰 |
| `bookmarks` | 동기화된 북마크 데이터 |
| `folders` | 유저 정의 폴더 |

모든 테이블에 RLS(Row Level Security)가 적용되어 본인 데이터만 접근 가능합니다.

## 🔒 보안

- 모든 테이블에 Row Level Security 적용
- OAuth 2.0 PKCE (S256) 인증
- CSRF 방지를 위한 state 파라미터 검증
- Twitter 토큰은 서버 측에만 저장 (클라이언트 노출 없음)
- `.env` 파일은 `.gitignore`에 포함

## 📖 상세 문서

아키텍처 및 기술 상세는 [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)를 참고하세요.

## 📄 License

MIT
