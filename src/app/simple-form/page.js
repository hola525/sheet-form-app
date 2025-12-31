"use client";

import { useEffect, useState } from "react";

export default function SimpleFormPage() {
  // Form fields (basic)
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  // Dropdown fields (dynamic from sheet)
  const [department, setDepartment] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("");
  const [file, setFile] = useState(null);

  // Dropdown options loaded from /api/config
  const [options, setOptions] = useState({
    departments: [],
    categories: [],
    priorities: [],
  });

  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  // 1) Load dropdown data from backend (which reads from Config sheet)
  useEffect(() => {
    async function loadConfig() {
      try {
        setLoading(true);
        setMsg("");

        const res = await fetch("/api/config");
        const data = await res.json();

        setOptions({
          departments: data.departments || [],
          categories: data.categories || [],
          priorities: data.priorities || [],
        });
      } catch (err) {
        setMsg("Failed to load dropdown options.");
      } finally {
        setLoading(false);
      }
    }

    loadConfig();
  }, []);

  // 2) Submit form -> backend -> append row into Submissions sheet
  async function handleSubmit(e) {
    e.preventDefault();
    setMsg("");

    // Basic client-side validation
    if (!name.trim()) return setMsg("Name is required.");
    if (!email.trim()) return setMsg("Email is required.");

    try {
      setSaving(true);

      const fd = new FormData();
      fd.append("name", name);
      fd.append("email", email);
      fd.append("phone", "");
      fd.append("department", department);
      fd.append("category", category);
      fd.append("priority", priority);
      fd.append("notes", "");
      fd.append("status", "Pending");
      if (file) fd.append("file", file);

      const res = await fetch("/api/submit", {
        method: "POST",
        body: fd, // IMPORTANT: no Content-Type header, browser sets it
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setMsg(data?.error || "Submit failed.");
        return;
      }

      // Success: reset form
      setMsg("✅ Saved to Google Sheet successfully!");
      setName("");
      setEmail("");
      setDepartment("");
      setCategory("");
      setPriority("");
      setFile(null);
    } catch (err) {
      setMsg("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-600  text-white flex items-center justify-center p-6">
      <div className="w-full max-w-xl rounded-2xl border border-zinc-800 bg-zinc-950/40 p-6">
        <h1 className="text-xl font-semibold">Simple Dynamic Form</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Dropdowns come from <b>Config</b> sheet and submission saves to{" "}
          <b>Submissions</b>.
        </p>

        {msg ? (
          <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950/50 p-3 text-sm">
            {msg}
          </div>
        ) : null}

        {loading ? (
          <div className="mt-6 text-sm text-zinc-400">
            Loading dropdown options…
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {/* Name */}
            <div>
              <label className="text-sm text-zinc-300">Name *</label>
              <input
                className="mt-1 w-full rounded-xl border border-zinc-800 bg-black/40 px-3 py-2 text-sm outline-none focus:border-zinc-600"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter name"
              />
            </div>

            {/* Email */}
            <div>
              <label className="text-sm text-zinc-300">Email *</label>
              <input
                className="mt-1 w-full rounded-xl border border-zinc-800 bg-black/40 px-3 py-2 text-sm outline-none focus:border-zinc-600"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email"
              />
            </div>

            {/* Department (dynamic) */}
            <div>
              <label className="text-sm text-zinc-300">Department</label>
              <select
                className="mt-1 w-full rounded-xl border border-zinc-800 bg-black/40 px-3 py-2 text-sm outline-none focus:border-zinc-600"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              >
                <option value="">Select Department</option>
                {options.departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Category (dynamic) */}
            <div>
              <label className="text-sm text-zinc-300">Category</label>
              <select
                className="mt-1 w-full rounded-xl border border-zinc-800 bg-black/40 px-3 py-2 text-sm outline-none focus:border-zinc-600"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">Select Category</option>
                {options.categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority (dynamic) */}
            <div>
              <label className="text-sm text-zinc-300">Priority</label>
              <select
                className="mt-1 w-full rounded-xl border border-zinc-800 bg-black/40 px-3 py-2 text-sm outline-none focus:border-zinc-600"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="">Select Priority</option>
                {options.priorities.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            {/* File Field */}
            <div>
              <label className="text-sm text-zinc-300">
                Attachment (PDF/Image)
              </label>
              <input
                type="file"
                accept="image/*,application/pdf"
                className="mt-1 w-full rounded-xl border border-zinc-800 bg-black/40 px-3 py-2 text-sm"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-zinc-200 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Submit"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
