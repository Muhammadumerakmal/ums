"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      const payload = await res.json();
      if (!res.ok) {
        setError(payload?.error?.message ?? "Sign-in failed.");
        return;
      }
      const role = payload.data.role as "admin" | "teacher" | "student";
      router.push(`/${role}`);
    } catch {
      setError("Network error. Is the backend running on port 4000?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 360, margin: "10vh auto", padding: 24 }}>
      <h1>Core UMS — Sign in</h1>
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
        <label style={{ display: "grid", gap: 4 }}>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ padding: 8 }} />
        </label>
        <label style={{ display: "grid", gap: 4 }}>
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ padding: 8 }} />
        </label>
        {error && <p style={{ color: "crimson", margin: 0 }}>{error}</p>}
        <button type="submit" disabled={loading} style={{ padding: 10 }}>
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <p style={{ marginTop: 16, fontSize: 13, color: "#666" }}>
        Seed logins — admin@uni.edu / admin1234 · teacher@uni.edu / teacher1234 · jane@uni.edu /
        student1234
      </p>
    </main>
  );
}
