// Next.js 응답 객체
import { NextResponse } from "next/server";

// PKCE용 난수 생성 및 해시 계산을 위한 Node crypto 모듈
import crypto from "crypto";

// base64를 URL-safe 형식으로 변환하는 함수
// OAuth PKCE는 base64url 인코딩을 요구함
function base64url(input: Buffer) {
  return input
    .toString("base64") // 일반 base64 인코딩
    .replace(/\+/g, "-") // + → -
    .replace(/\//g, "_") // / → _
    .replace(/=+$/g, ""); // 끝의 = 제거
}

// 로그인 시작 엔드포인트 (예: /api/auth/x/login)
export async function GET() {
  // 환경변수에서 클라이언트 ID와 redirect URI 가져오기
  const clientId = process.env.X_CLIENT_ID!;
  const redirectUri = process.env.X_REDIRECT_URI!;

  // 🔐 PKCE용 code_verifier 생성 (랜덤 문자열)
  const codeVerifier = base64url(crypto.randomBytes(32));

  // 🔐 PKCE용 code_challenge 생성
  // = SHA256(codeVerifier) 후 base64url 인코딩
  const codeChallenge = base64url(
    crypto.createHash("sha256").update(codeVerifier).digest(),
  );

  // 🔐 CSRF 방지용 state 값 생성
  const state = base64url(crypto.randomBytes(16));

  // 요청할 권한 범위 (X API에서 허용한 scope)
  const scope = encodeURIComponent("users.read tweet.read bookmark.read");

  // 🔥 X 로그인 페이지로 보낼 authorization URL 생성
  const authorizeUrl =
    `https://twitter.com/i/oauth2/authorize` + // X OAuth 인증 주소
    `?response_type=code` + // Authorization Code Flow 사용
    `&client_id=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${scope}` +
    `&state=${encodeURIComponent(state)}` + // CSRF 방지값
    `&code_challenge=${encodeURIComponent(codeChallenge)}` + // PKCE 해시값
    `&code_challenge_method=S256`; // SHA256 방식 사용

  // 사용자를 X 로그인 페이지로 redirect
  const res = NextResponse.redirect(authorizeUrl);

  // 🔐 PKCE 검증용 code_verifier를 쿠키에 저장
  // 콜백 단계에서 code와 함께 검증할 때 사용됨
  res.cookies.set("pkce_code_verifier", codeVerifier, {
    httpOnly: true, // JS 접근 불가 (보안)
    secure: false, // ⚠️ 배포 환경에서는 true 필수
    sameSite: "lax",
    path: "/",
    maxAge: 10 * 60, // 10분 유효
  });

  // 🔐 state 값도 쿠키에 저장 (콜백에서 비교용)
  res.cookies.set("oauth_state", state, {
    httpOnly: true,
    secure: false, // ⚠️ 배포 시 true
    sameSite: "lax",
    path: "/",
    maxAge: 10 * 60,
  });

  return res;
}
