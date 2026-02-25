// Next.js App Router에서 사용하는 Request / Response 객체
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  // 로그인 콜백에서 저장한 access token을 쿠키에서 가져옴
  const token = req.cookies.get("x_access_token")?.value;

  // 토큰이 없으면 인증 안 된 상태 → 401 Unauthorized
  if (!token) {
    return NextResponse.json(
      { error: "missing x_access_token cookie" },
      { status: 401 },
    );
  }

  // 🔥 X API에 사용자 정보 요청
  const r = await fetch(
    // 현재 로그인된 사용자 정보 조회 endpoint
    "https://api.x.com/2/users/me?user.fields=username,name",
    {
      headers: {
        // Bearer 토큰 방식으로 인증
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store", // 캐싱 방지 (항상 최신 데이터)
    },
  );

  // 응답 JSON 파싱
  const data = await r.json();

  // X API 요청 실패 시 그대로 에러 반환
  if (!r.ok) {
    return NextResponse.json(
      { error: "x api failed", details: data },
      { status: r.status },
    );
  }

  // 성공 시 사용자 정보 그대로 반환
  return NextResponse.json(data);
}
