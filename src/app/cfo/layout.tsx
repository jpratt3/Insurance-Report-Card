import { SignOut } from "../components/SignOut";
import { AbcMark } from "../components/AbcMark";
import { getSession } from "@/lib/auth";
import { getCompany } from "@/lib/db";
import { redirect } from "next/navigation";

export default async function CfoLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (session?.role !== "cfo" || !session.companyId) redirect("/login");
  const company = getCompany(session.companyId);
  return (
    <div className="shell cfo-shell">
      <header className="topbar">
        <div className="topbar-brand">
          <AbcMark />
          <div>
            <div className="eyebrow">Company portal</div>
            <h1>{company?.name ?? "Intake"}</h1>
          </div>
        </div>
        <nav className="nav">
          <span className="small">{session.name}</span>
          <SignOut />
        </nav>
      </header>
      {children}
    </div>
  );
}
