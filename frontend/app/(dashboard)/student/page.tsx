"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import AssistantChat from "@/components/AssistantChat";

interface Course { id: string; code: string; title: string; teacherName: string }
interface Enrollment { id: string; courseId: string; code: string; title: string }
interface GradeRow { courseId: string; code: string; title: string; grade: string | null }

export default function StudentDashboard() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [mine, setMine] = useState<Enrollment[]>([]);
  const [grades, setGrades] = useState<GradeRow[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    const me = await api("/auth/me");
    if (me.status === 401) return router.push("/login");
    const meData = (await me.json()).data;
    if (meData.role !== "student") return router.push(`/${meData.role}`);
    setName(meData.fullName);
    const [c, e, g] = await Promise.all([
      api("/courses").then((r) => r.json()),
      api("/enrollments").then((r) => r.json()),
      api("/grades").then((r) => r.json()),
    ]);
    setCourses(c.data ?? []);
    setMine(e.data ?? []);
    setGrades(g.data ?? []);
  }, [router]);

  useEffect(() => { load(); }, [load]);

  async function enroll(courseId: string) {
    setMsg(null);
    const res = await api("/enrollments", { method: "POST", body: JSON.stringify({ courseId }) });
    if (!res.ok) setMsg((await res.json()).error?.message ?? "Enrol failed.");
    await load();
  }

  async function drop(id: string) {
    await api(`/enrollments/${id}`, { method: "DELETE" });
    await load();
  }

  const enrolledIds = new Set(mine.map((m) => m.courseId));

  return (
    <main style={{ maxWidth: 800, margin: "24px auto", padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h1>Student — {name}</h1>
        <button onClick={async () => { await api("/auth/logout", { method: "POST" }); window.location.href = "/login"; }}>Sign out</button>
      </div>
      {msg && <p style={{ color: "crimson" }}>{msg}</p>}

      <h2>Available courses</h2>
      <ul>
        {courses.map((c) => (
          <li key={c.id} style={{ marginBottom: 6 }}>
            <b>{c.code}</b> — {c.title} <i>({c.teacherName})</i>{" "}
            {enrolledIds.has(c.id) ? (
              <span style={{ color: "green" }}>enrolled</span>
            ) : (
              <button onClick={() => enroll(c.id)}>Enrol</button>
            )}
          </li>
        ))}
      </ul>

      <h2>My courses</h2>
      <ul>
        {mine.map((m) => (
          <li key={m.id}><b>{m.code}</b> — {m.title} <button onClick={() => drop(m.id)}>Drop</button></li>
        ))}
      </ul>

      <h2>My grades</h2>
      <ul>
        {grades.map((g) => (
          <li key={g.courseId}><b>{g.code}</b> — {g.title}: {g.grade ?? <i>not yet graded</i>}</li>
        ))}
      </ul>

      <AssistantChat />
    </main>
  );
}
