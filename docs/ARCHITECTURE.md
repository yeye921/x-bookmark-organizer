# X 북마크 매니저 — 서비스 아키텍처

## 1. 개요

X(Twitter) 북마크를 폴더로 정리·관리하는 웹 애플리케이션입니다.

| 구분 | 기술 스택 |
|------|-----------|
| **프론트엔드** | React 18 + TypeScript + Vite + Tailwind CSS |
| **백엔드** | Lovable Cloud (Supabase) — PostgreSQL, Auth, Edge Functions |
| **인증** | Twitter OAuth 2.0 PKCE → Supabase Magic Link 세션 |
| **호스팅** | Lovable (lovable.app) |

---

## 2. 전체 아키텍처

```
┌─────────────────────────────────────────────────┐
│                   클라이언트 (React SPA)           │
│                                                   │
│  LoginPage ──→ TwitterCallback ──→ Index(Home)    │
│                                                   │
│  Hooks: useAuth, useTwitterAuth, useBookmarks     │
└──────────┬──────────────┬─────────────────────────┘
           │              │
           ▼              ▼
┌──────────────┐  ┌───────────────────┐
│  Supabase    │  │  Edge Functions   │
│  Auth        │  │                   │
│  (세션 관리)  │  │  twitter-auth     │
│              │  │  sync-bookmarks   │
└──────┬───────┘  └────────┬──────────┘
       │                   │
       ▼                   ▼
┌──────────────────────────────────────┐
│        PostgreSQL (Supabase DB)       │
│                                      │
│  profiles  │  bookmarks  │  folders   │
│  (RLS 적용)                           │
└──────────────────────────────────────┘
```

---

## 3. 인증 플로우

```
사용자 ──→ "X로 로그인" 클릭
  │
  ▼
[프론트] PKCE code_verifier 생성 → localStorage 저장
  │
  ▼
[Edge Function: twitter-auth?action=auth-url]
  - code_challenge 생성 (SHA-256)
  - Twitter OAuth 인증 URL 반환
  │
  ▼
사용자 ──→ Twitter 로그인 & 권한 승인
  │
  ▼
Twitter ──→ /twitter-callback 으로 리다이렉트 (code, state)
  │
  ▼
[Edge Function: twitter-auth?action=callback]
  - code → access_token 교환 (Twitter API)
  - GET /2/users/me → 유저 정보 조회
  - Supabase 유저 생성 또는 조회
  - profiles 테이블에 Twitter 토큰 저장
  - Magic Link 토큰 생성 → 클라이언트에 반환
  │
  ▼
[프론트] supabase.auth.verifyOtp(token_hash) → 세션 생성
  │
  ▼
로그인 완료 → /home 이동
```

### Twitter API 호출 시점
- **로그인 시**: 토큰 교환 1회 + 유저 정보 조회 1회 = **2회**
- **북마크 동기화 시**: 페이지당 1회 (20개씩)
- **세션 유지 중**: Twitter API 호출 없음 (Supabase 세션 사용)

---

## 4. 데이터베이스 스키마

### profiles
| 컬럼 | 타입 | 설명 |
|------|------|------|
| user_id | uuid (PK) | Supabase Auth 유저 ID |
| twitter_user_id | text | Twitter 유저 ID |
| twitter_username | text | Twitter @handle |
| twitter_display_name | text | 표시 이름 |
| twitter_avatar_url | text | 프로필 이미지 URL |
| twitter_access_token | text | Twitter API 액세스 토큰 |
| twitter_refresh_token | text | Twitter API 리프레시 토큰 |
| twitter_token_expires_at | timestamptz | 토큰 만료 시각 |

### bookmarks
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid (PK) | 내부 ID |
| user_id | uuid | 소유 유저 |
| tweet_id | text | 트윗 ID (user_id와 함께 UNIQUE) |
| folder_id | uuid (FK → folders) | 폴더 분류 |
| content | text | 트윗 내용 |
| author_name/handle/avatar | text | 작성자 정보 |
| likes/retweets/replies/views | integer | 반응 수치 |
| images | text[] | 미디어 URL 배열 |
| tweet_timestamp | timestamptz | 트윗 작성 시각 |
| synced_at | timestamptz | 마지막 동기화 시각 |

### folders
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid (PK) | 폴더 ID |
| user_id | uuid | 소유 유저 |
| name | text | 폴더 이름 |
| icon | text | 아이콘 키 (e.g. "code", "heart") |
| position | integer | 정렬 순서 |

### RLS (Row Level Security)
모든 테이블에 RLS가 적용되어 있으며, `auth.uid() = user_id` 조건으로 본인 데이터만 CRUD 가능합니다.

---

## 5. Edge Functions

### twitter-auth
| Action | 메서드 | 인증 | 설명 |
|--------|--------|------|------|
| `auth-url` | POST | 불필요 | OAuth 인증 URL 생성 |
| `callback` | POST | 불필요 | 토큰 교환 + 유저 생성 + 세션 발급 |
| `refresh-token` | POST | Bearer 토큰 | Twitter 토큰 갱신 |

### sync-bookmarks
| 메서드 | 인증 | 설명 |
|--------|------|------|
| GET/POST | Bearer 토큰 | Twitter Bookmarks API 호출 → DB upsert |

- 토큰 만료 시 자동 갱신
- `pagination_token`으로 페이지네이션 지원
- 20개씩 가져와서 `bookmarks` 테이블에 upsert

---

## 6. 프론트엔드 구조

```
src/
├── pages/
│   ├── LoginPage.tsx        # X 로그인 화면
│   ├── TwitterCallback.tsx  # OAuth 콜백 처리
│   ├── Index.tsx            # 메인 대시보드
│   └── NotFound.tsx
├── components/
│   ├── FolderSidebar.tsx    # 폴더 사이드바 (데스크탑 + 모바일 Sheet)
│   ├── BookmarkCard.tsx     # 북마크 카드 (메뉴, 폴더 이동, 삭제)
│   ├── ImageGrid.tsx        # 이미지 그리드
│   └── ui/                  # shadcn/ui 컴포넌트
├── hooks/
│   ├── useAuth.ts           # 인증 상태 관리
│   ├── useTwitterAuth.ts    # Twitter OAuth 플로우
│   ├── useBookmarks.ts      # 북마크/폴더 CRUD + 동기화
│   └── useTheme.ts          # 다크/라이트 모드
└── integrations/
    └── supabase/
        ├── client.ts        # Supabase 클라이언트 (자동 생성)
        └── types.ts         # DB 타입 (자동 생성)
```

---

## 7. 환경 변수 & 시크릿

| 변수 | 위치 | 설명 |
|------|------|------|
| `VITE_SUPABASE_URL` | .env (자동) | Supabase 프로젝트 URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | .env (자동) | Supabase anon key |
| `TWITTER_CLIENT_ID` | Edge Function 시크릿 | Twitter OAuth 클라이언트 ID |
| `TWITTER_CLIENT_SECRET` | Edge Function 시크릿 | Twitter OAuth 클라이언트 시크릿 |
| `SUPABASE_SERVICE_ROLE_KEY` | Edge Function 시크릿 | 관리자 권한 키 |

---

## 8. 보안

- **RLS**: 모든 테이블에 Row Level Security 적용
- **PKCE**: OAuth 2.0 Authorization Code + PKCE (S256) 사용
- **State 검증**: CSRF 방지를 위한 state 파라미터 검증
- **토큰 저장**: Twitter 토큰은 서버 측(profiles 테이블)에만 저장
- **Service Role Key**: Edge Function 내부에서만 사용, 클라이언트 노출 없음
