import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const savedState = req.cookies.get("oauth_state")?.value;
  const codeVerifier = req.cookies.get("pkce_code_verifier")?.value;

  if (!code || !state || !savedState || !codeVerifier) {
    return NextResponse.json(
      { error: "missing code/state/verifier" },
      { status: 400 },
    );
  }
  if (state !== savedState) {
    return NextResponse.json({ error: "state mismatch" }, { status: 400 });
  }

  const clientId = process.env.X_CLIENT_ID!;
  const redirectUri = process.env.X_REDIRECT_URI!;

  const tokenRes = await fetch("https://api.x.com/2/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: clientId,
      code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    }),
  });

  const data = await tokenRes.json();

  if (!tokenRes.ok) {
    return NextResponse.json(
      { error: "token exchange failed", details: data },
      { status: 400 },
    );
  }

  const res = NextResponse.redirect(new URL("/", req.url));
  res.cookies.set("x_access_token", data.access_token, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
    maxAge: 2 * 60 * 60,
  });

  res.cookies.delete("pkce_code_verifier");
  res.cookies.delete("oauth_state");

  return res;
}
