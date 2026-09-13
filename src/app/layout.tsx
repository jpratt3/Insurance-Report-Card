import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ABC Insurance Report Card",
  description: "Internal portfolio insurance grading",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
