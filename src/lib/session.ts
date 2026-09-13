export type Session =
  | { role: "pm"; name: string; companyId: null }
  | { role: "cfo"; name: string; companyId: string };

export const COOKIE_NAME = "abc_session";

export function encodeSession(s: Session): string {
  return Buffer.from(JSON.stringify(s), "utf8").toString("base64url");
}

export function decodeSession(raw: string | undefined): Session | null {
  if (!raw) return null;
  try {
    const s = JSON.parse(Buffer.from(raw, "base64url").toString("utf8")) as Session;
    if (s.role === "pm") return { role: "pm", name: s.name || "Portfolio manager", companyId: null };
    if (s.role === "cfo" && s.companyId) return { role: "cfo", name: s.name, companyId: s.companyId };
    return null;
  } catch {
    return null;
  }
}

export function sessionCookie(s: Session) {
  return {
    name: COOKIE_NAME,
    value: encodeSession(s),
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  };
}
