import Link from "next/link";

export function AbcMark({ href }: { href?: string }) {
  const mark = (
    <div className="abc-mark" aria-label="ABC Capital">
      <span className="abc-mark-abc">ABC</span>
      <span className="abc-mark-capital">Capital</span>
    </div>
  );
  if (!href) return mark;
  return (
    <Link href={href} className="abc-mark-link">
      {mark}
    </Link>
  );
}
