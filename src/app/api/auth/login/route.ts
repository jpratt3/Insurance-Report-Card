import { NextResponse } from "next/server";
import { resolveLogin, sessionCookie } from "@/lib/auth";
import { COOKIE_NAME } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const session = resolveLogin(String(body.username || ""), String(body.password || ""));
  if (!session) {
    return NextResponse.json(
      { error: "Wrong username or password." },
      { status: 401 },
    );
  }
  const cookie = sessionCookie(session);
  const res = NextResponse.json({ ok: true, role: session.role, companyId: session.companyId });
  res.cookies.set(cookie);
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, "", { path: "/", maxAge: 0 });
  return res;
}
