import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("x_access_token")?.value;

  if (!token) {
    return NextResponse.json(
      { error: "missing x_access_token cookie" },
      { status: 401 },
    );
  }

  const r = await fetch(
    "https://api.x.com/2/users/me?user.fields=username,name",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    },
  );

  const data = await r.json();
  if (!r.ok) {
    return NextResponse.json(
      { error: "x api failed", details: data },
      { status: r.status },
    );
  }

  return NextResponse.json(data);
}
