"use client";

import { AbcMark } from "../components/AbcMark";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const REMEMBER_KEY = "abc-remember-username";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(REMEMBER_KEY);
    if (saved) {
      setUsername(saved);
      setRemember(true);
    }
  }, []);

  async function submit() {
    setBusy(true);
    setError("");
    if (remember) localStorage.setItem(REMEMBER_KEY, username.trim());
    else localStorage.removeItem(REMEMBER_KEY);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const json = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(json.error || "Could not sign in");
      return;
    }
    router.push(json.role === "pm" ? "/pm" : "/cfo");
    router.refresh();
  }

  return (
    <div className="login-screen">
      <header className="login-header">
        <AbcMark />
      </header>
      <main className="login-main">
        <div className="login-hero">
          <h1>Insurance Report Card</h1>
          <p className="login-subhead">Sign in to continue</p>
        </div>
        <div className="login-card">
          <h2>Log in</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <div className="login-field">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                autoFocus={!username}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
              />
            </div>
            <label className="login-remember">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              Remember my username
            </label>
            <div className="login-field">
              <label htmlFor="password">Password</label>
              <div className="login-password">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="login-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.8" />
                      <path d="M10.6 10.6a2.5 2.5 0 0 0 3.5 3.5" stroke="currentColor" strokeWidth="1.8" />
                      <path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c5.2 0 9.3 3.4 10.5 7-.4 1.2-1.1 2.3-2 3.3M6.1 6.1C4.1 7.5 2.6 9.4 1.5 12c1.2 3.6 5.3 7 10.5 7 1.4 0 2.7-.2 4-.7" stroke="currentColor" strokeWidth="1.8" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" stroke="currentColor" strokeWidth="1.8" />
                      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <button className="btn login-submit" disabled={busy} type="submit">
              {busy ? "Signing in…" : "Log in"}
            </button>
            {error ? <p className="miss">{error}</p> : null}
          </form>
        </div>
      </main>
    </div>
  );
}
