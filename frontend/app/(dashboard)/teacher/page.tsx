"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

interface Course { id: string; code: string; title: string; teacherId: string }
interface RosterRow { enrollmentId: string; studentId: string; fullName: string; studentNumber: string; grade: string | null }

const LETTERS = ["A", "B", "C", "D", "F"] as const;

export default function TeacherDashboard() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [rosters, setRosters] = useState<Record<string, RosterRow[]>>({});
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    const me = await api("/auth/me");
    if (me.status === 401) return router.push("/login");
    const meData = (await me.json()).data;
    if (meData.role !== "teacher") return router.push(`/${meData.role}`);
    setName(meData.fullName);
    const all = (await api("/courses").then((r) => r.json())).data ?? [];
    const own = all.filter((c: Course) => c.teacherId === meData.profileId);
    setCourses(own);
    const entries = await Promise.all(
      own.map(async (c: Course) => {
        const r = await api(`/courses/${c.id}/roster`).then((x) => x.json());
        return [c.id, r.data ?? []] as const;
      })
    );
    setRosters(Object.fromEntries(entries));
  }, [router]);

  useEffect(() => { load(); }, [load]);

  async function setGrade(enrollmentId: string, letter: string) {
    setMsg(null);
    const res = await api("/grades", { method: "POST", body: JSON.stringify({ enrollmentId, letter }) });
    if (!res.ok) setMsg((await res.json()).error?.message ?? "Grading failed.");
    await load();
  }

  return (
    <main style={{ maxWidth: 800, margin: "24px auto", padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h1>Teacher — {name}</h1>
        <button onClick={async () => { await api("/auth/logout", { method: "POST" }); window.location.href = "/login"; }}>Sign out</button>
      </div>
      {msg && <p style={{ color: "crimson" }}>{msg}</p>}
      {courses.length === 0 && <p>You do not own any courses yet.</p>}
      {courses.map((c) => (
        <section key={c.id} style={{ marginBottom: 24 }}>
          <h2>{c.code} — {c.title}</h2>
          <table style={{ borderCollapse: "collapse", width: "100%" }}>
            <thead>
              <tr><th align="left">Student</th><th align="left">No.</th><th align="left">Grade</th></tr>
            </thead>
            <tbody>
              {(rosters[c.id] ?? []).map((r) => (
                <tr key={r.enrollmentId}>
                  <td>{r.fullName}</td>
                  <td>{r.studentNumber}</td>
                  <td>
                    <select value={r.grade ?? ""} onChange={(e) => setGrade(r.enrollmentId, e.target.value)}>
                      <option value="" disabled>—</option>
                      {LETTERS.map((l) => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
    </main>
  );
}
