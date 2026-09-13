import Link from "next/link";
import { SignOut } from "../components/SignOut";
import { AbcMark } from "../components/AbcMark";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function PmLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (session?.role !== "pm") redirect("/login");
  return (
    <div className="shell">
      <header className="topbar">
        <div className="topbar-brand">
          <AbcMark href="/pm" />
          <div>
            <div className="eyebrow">PM desk · {session.name}</div>
            <Link href="/pm">
              <h1>Insurance Report Card</h1>
            </Link>
          </div>
        </div>
        <nav className="nav">
          <Link href="/pm">Book</Link>
          <Link href="/pm/setup">Setup / invite</Link>
          <Link href="/pm/rubric">Rubric</Link>
          <SignOut />
        </nav>
      </header>
      {children}
    </div>
  );
}
