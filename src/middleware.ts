import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { COOKIE_NAME, decodeSession } from "@/lib/session";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const session = decodeSession(req.cookies.get(COOKIE_NAME)?.value);

  const publicPath =
    pathname === "/login" ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico";

  if (publicPath) return NextResponse.next();

  if (!session) {
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/pm") && session.role !== "pm") {
    const url = req.nextUrl.clone();
    url.pathname = "/cfo";
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/cfo") && session.role !== "cfo") {
    const url = req.nextUrl.clone();
    url.pathname = "/pm";
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/intake")) {
    const url = req.nextUrl.clone();
    url.pathname = session.role === "cfo" ? "/cfo" : "/pm";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
