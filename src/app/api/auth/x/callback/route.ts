// Next.js App Router에서 사용하는 Request / Response 객체
import { NextRequest, NextResponse } from "next/server";

// X OAuth 로그인 후 redirect 되는 콜백 라우트 (GET 요청 처리)
export async function GET(req: NextRequest) {
  // 현재 요청 URL 객체 생성
  const url = new URL(req.url);

  // X가 redirect 하면서 붙여준 인증 코드
  const code = url.searchParams.get("code");

  // CSRF 방지용 state 값
  const state = url.searchParams.get("state");

  // 로그인 요청 보낼 때 우리가 쿠키에 저장해둔 state 값
  const savedState = req.cookies.get("oauth_state")?.value;

  // PKCE 검증용 code_verifier (초기 로그인 요청 시 생성해서 저장해둔 값)
  const codeVerifier = req.cookies.get("pkce_code_verifier")?.value;

  // 필수 값들 하나라도 없으면 에러 처리
  if (!code || !state || !savedState || !codeVerifier) {
    return NextResponse.json(
      { error: "missing code/state/verifier" },
      { status: 400 },
    );
  }

  // CSRF 방지: 돌아온 state와 저장된 state가 다르면 거부
  if (state !== savedState) {
    return NextResponse.json({ error: "state mismatch" }, { status: 400 });
  }

  // 환경변수에서 클라이언트 ID와 redirect URI 불러오기
  const clientId = process.env.X_CLIENT_ID!;
  const redirectUri = process.env.X_REDIRECT_URI!;

  // 🔥 핵심 부분: authorization code → access token 교환 요청
  const tokenRes = await fetch("https://api.x.com/2/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code", // OAuth 표준
      client_id: clientId,
      code, // X가 준 인증 코드
      redirect_uri: redirectUri,
      code_verifier: codeVerifier, // PKCE 검증용
    }),
  });

  // 토큰 응답 JSON 파싱
  const data = await tokenRes.json();

  // 토큰 발급 실패 시 에러 반환
  if (!tokenRes.ok) {
    return NextResponse.json(
      { error: "token exchange failed", details: data },
      { status: 400 },
    );
  }

  // 로그인 성공 후 메인 페이지로 redirect 응답 생성
  const res = NextResponse.redirect(new URL("http://127.0.0.1:3000/", req.url));

  // 발급받은 access token을 httpOnly 쿠키에 저장
  res.cookies.set("x_access_token", data.access_token, {
    httpOnly: true, // JS에서 접근 불가 (XSS 방지)
    secure: false, // ⚠️ 배포 환경에서는 true로 해야 함 (HTTPS 전용)
    sameSite: "lax", // CSRF 방어에 도움
    path: "/",
    maxAge: 2 * 60 * 60, // 2시간 유효
  });

  // 보안상 더 이상 필요 없는 값들 삭제
  res.cookies.delete("pkce_code_verifier");
  res.cookies.delete("oauth_state");

  return res;
}
