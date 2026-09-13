import { cookies } from "next/headers";
import { listCompanies } from "./db";
import { decodeSession, sessionCookie, type Session } from "./session";

export type { Session };
export { sessionCookie } from "./session";

export async function getSession(): Promise<Session | null> {
  const jar = await cookies();
  return decodeSession(jar.get("abc_session")?.value);
}

export const PM_USERNAME = "PortfolioManager";
const PM_PASSWORD = "ABCcapital123";

export function resolveLogin(username: string, password: string): Session | null {
  const u = username.trim().toLowerCase();
  if (!u) return null;
  if (u === PM_USERNAME.toLowerCase()) {
    if (password !== PM_PASSWORD) return null;
    return { role: "pm", name: "Portfolio manager", companyId: null };
  }
  for (const company of listCompanies()) {
    // Companies set up with their own credentials accept only those.
    if (company.login?.username) {
      if (company.login.username.toLowerCase() !== u) continue;
      if (password !== company.login.password) return null;
      return { role: "cfo", name: `${company.name} finance`, companyId: company.id };
    }
    // Legacy rows created before PM-set credentials: company id, no password.
    if (company.id === u || company.name.toLowerCase() === u) {
      return { role: "cfo", name: `${company.name} finance`, companyId: company.id };
    }
  }
  return null;
}

/** Usernames already taken across the desk, for intake validation. */
export function usernameTaken(username: string, exceptCompanyId?: string): boolean {
  const u = username.trim().toLowerCase();
  if (!u) return false;
  if (u === PM_USERNAME.toLowerCase()) return true;
  return listCompanies().some(
    (c) =>
      c.id !== exceptCompanyId &&
      (c.id.toLowerCase() === u || c.login?.username.toLowerCase() === u),
  );
}
