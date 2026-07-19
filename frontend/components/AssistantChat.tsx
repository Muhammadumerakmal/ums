"use client";

import { useState } from "react";
import { api } from "@/lib/api";

interface Msg {
  role: "you" | "assistant";
  text: string;
}

export default function AssistantChat() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const q = input.trim();
    if (!q || loading) return;
    setInput("");
    setMsgs((m) => [...m, { role: "you", text: q }]);
    setLoading(true);
    try {
      const res = await api("/assistant", { method: "POST", body: JSON.stringify({ message: q }) });
      const body = await res.json();
      const text = res.ok ? body.data.reply : body.error?.message ?? "Something went wrong.";
      setMsgs((m) => [...m, { role: "assistant", text }]);
    } catch {
      setMsgs((m) => [...m, { role: "assistant", text: "Network error. Is the backend running?" }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section style={{ marginTop: 32, border: "1px solid #ddd", borderRadius: 8, padding: 16 }}>
      <h2 style={{ marginTop: 0 }}>🤖 Ask the assistant</h2>
      <div style={{ minHeight: 60, display: "grid", gap: 8, marginBottom: 12 }}>
        {msgs.length === 0 && (
          <p style={{ color: "#888", margin: 0 }}>
            Try: “What am I enrolled in?”, “What are my grades?”, “Enrol me in CS101”.
          </p>
        )}
        {msgs.map((m, i) => (
          <div key={i} style={{ textAlign: m.role === "you" ? "right" : "left" }}>
            <span
              style={{
                display: "inline-block",
                background: m.role === "you" ? "#e6f0ff" : "#f2f2f2",
                padding: "6px 10px",
                borderRadius: 8,
                maxWidth: "80%",
                whiteSpace: "pre-wrap",
              }}
            >
              {m.text}
            </span>
          </div>
        ))}
        {loading && <p style={{ color: "#888", margin: 0 }}>Assistant is thinking…</p>}
      </div>
      <form onSubmit={send} style={{ display: "flex", gap: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your courses or grades…"
          style={{ flex: 1, padding: 8 }}
        />
        <button type="submit" disabled={loading}>
          Send
        </button>
      </form>
    </section>
  );
}
