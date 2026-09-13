"use client";

export function SignOut({ label = "Sign out" }: { label?: string }) {
  return (
    <button
      className="btn secondary"
      type="button"
      onClick={async () => {
        await fetch("/api/auth/login", { method: "DELETE" });
        window.location.href = "/login";
      }}
    >
      {label}
    </button>
  );
}
