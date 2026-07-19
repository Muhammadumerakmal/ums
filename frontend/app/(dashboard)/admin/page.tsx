"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

interface Student { id: string; fullName: string; email: string; studentNumber: string }
interface Course { id: string; code: string; title: string; teacherName: string }
interface Teacher { id: string; fullName: string }

export default function AdminDashboard() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  const [s, setS] = useState({ fullName: "", email: "", password: "", studentNumber: "" });
  const [c, setC] = useState({ code: "", title: "", teacherId: "" });

  const load = useCallback(async () => {
    const me = await api("/auth/me");
    if (me.status === 401) return router.push("/login");
    const meData = (await me.json()).data;
    if (meData.role !== "admin") return router.push(`/${meData.role}`);
    setName(meData.fullName);
    const [st, co, te] = await Promise.all([
      api("/students").then((r) => r.json()),
      api("/courses").then((r) => r.json()),
      api("/teachers").then((r) => r.json()),
    ]);
    setStudents(st.data ?? []);
    setCourses(co.data ?? []);
    setTeachers(te.data ?? []);
  }, [router]);

  useEffect(() => { load(); }, [load]);

  async function createStudent(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const res = await api("/students", { method: "POST", body: JSON.stringify(s) });
    if (!res.ok) return setMsg((await res.json()).error?.message ?? "Failed to create student.");
    setS({ fullName: "", email: "", password: "", studentNumber: "" });
    await load();
  }

  async function createCourse(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const res = await api("/courses", { method: "POST", body: JSON.stringify(c) });
    if (!res.ok) return setMsg((await res.json()).error?.message ?? "Failed to create course.");
    setC({ code: "", title: "", teacherId: "" });
    await load();
  }

  async function removeStudent(id: string) { await api(`/students/${id}`, { method: "DELETE" }); await load(); }
  async function removeCourse(id: string) { await api(`/courses/${id}`, { method: "DELETE" }); await load(); }

  return (
    <main style={{ maxWidth: 900, margin: "24px auto", padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h1>Admin — {name}</h1>
        <button onClick={async () => { await api("/auth/logout", { method: "POST" }); window.location.href = "/login"; }}>Sign out</button>
      </div>
      {msg && <p style={{ color: "crimson" }}>{msg}</p>}

      <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div>
          <h2>Students</h2>
          <form onSubmit={createStudent} style={{ display: "grid", gap: 6, marginBottom: 12 }}>
            <input placeholder="Full name" value={s.fullName} onChange={(e) => setS({ ...s, fullName: e.target.value })} required />
            <input placeholder="Email" type="email" value={s.email} onChange={(e) => setS({ ...s, email: e.target.value })} required />
            <input placeholder="Temp password" value={s.password} onChange={(e) => setS({ ...s, password: e.target.value })} required />
            <input placeholder="Student number" value={s.studentNumber} onChange={(e) => setS({ ...s, studentNumber: e.target.value })} required />
            <button type="submit">Add student</button>
          </form>
          <ul>
            {students.map((st) => (
              <li key={st.id}>{st.studentNumber} — {st.fullName} <button onClick={() => removeStudent(st.id)}>✕</button></li>
            ))}
          </ul>
        </div>

        <div>
          <h2>Courses</h2>
          <form onSubmit={createCourse} style={{ display: "grid", gap: 6, marginBottom: 12 }}>
            <input placeholder="Code (e.g. CS101)" value={c.code} onChange={(e) => setC({ ...c, code: e.target.value })} required />
            <input placeholder="Title" value={c.title} onChange={(e) => setC({ ...c, title: e.target.value })} required />
            <select value={c.teacherId} onChange={(e) => setC({ ...c, teacherId: e.target.value })} required>
              <option value="" disabled>Select owning teacher</option>
              {teachers.map((t) => <option key={t.id} value={t.id}>{t.fullName}</option>)}
            </select>
            <button type="submit">Add course</button>
          </form>
          <ul>
            {courses.map((co) => (
              <li key={co.id}>{co.code} — {co.title} <i>({co.teacherName})</i> <button onClick={() => removeCourse(co.id)}>✕</button></li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
