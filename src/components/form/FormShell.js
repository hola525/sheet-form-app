"use client";

import { useMemo, useState } from "react";
import {
  Field,
  FileDrop,
  Input,
  Pill,
  RadioCard,
  SectionTitle,
  Select,
  Textarea,
  Toggle,
} from "./fields";
import { STATIC_OPTIONS, isEmail, normalizePhone } from "./utils";

const initial = {
  fullName: "",
  email: "",
  phone: "",
  department: "",
  category: "",
  priority: "Medium",
  contactMethod: "Email",
  company: "",
  website: "",
  budget: "",
  dueDate: "",
  dueTime: "",
  quantity: 1,
  satisfaction: 7,
  tags: [],
  notes: "",
  agree: false,
  urgentNotify: true,
  visibility: "internal",
};

export default function FormShell() {
  const [data, setData] = useState(initial);
  const [files, setFiles] = useState([]);
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const tagOptions = useMemo(
    () => ["Insurance", "Coverage", "Invoices", "QA", "Automation", "Integration", "Bug", "Feature", "Data Fix"],
    []
  );

  function setField(key, value) {
    setData((p) => ({ ...p, [key]: value }));
  }

  function markTouched(key) {
    setTouched((p) => ({ ...p, [key]: true }));
  }

  const errors = useMemo(() => {
    const e = {};
    if (!data.fullName.trim()) e.fullName = "Full name is required.";
    if (!data.email.trim()) e.email = "Email is required.";
    else if (!isEmail(data.email)) e.email = "Please enter a valid email.";
    if (!data.department) e.department = "Please select a department.";
    if (!data.category) e.category = "Please select a category.";
    if (!data.agree) e.agree = "You must accept the terms to continue.";
    if (data.website && !/^https?:\/\//i.test(data.website.trim())) {
      e.website = "Website must start with http:// or https://";
    }
    if (data.budget && Number.isNaN(Number(data.budget))) {
      e.budget = "Budget must be a number.";
    }
    return e;
  }, [data]);

  const canSubmit = Object.keys(errors).length === 0;

  function toggleTag(tag) {
    setData((p) => {
      const exists = p.tags.includes(tag);
      return { ...p, tags: exists ? p.tags.filter((t) => t !== tag) : [...p.tags, tag] };
    });
  }

  async function onSubmit(e) {
    e.preventDefault();
    setTouched({
      fullName: true,
      email: true,
      department: true,
      category: true,
      agree: true,
      website: true,
      budget: true,
    });

    if (!canSubmit) {
      setToast({ type: "error", message: "Please fix the highlighted fields." });
      return;
    }

    setSubmitting(true);
    setToast(null);

    try {
      // DEV PHASE: static submit (later we call /api/submit)
      await new Promise((r) => setTimeout(r, 700));

      setToast({ type: "success", message: "Saved (development mode). Ready to connect Sheets API next." });
      setData(initial);
      setFiles([]);
      setTouched({});
    } catch (err) {
      setToast({ type: "error", message: "Something went wrong. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  const preview = useMemo(() => {
    return {
      ...data,
      phone: normalizePhone(data.phone),
      attachments: files.map((f) => ({ name: f.name, size: f.size })),
    };
  }, [data, files]);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* subtle background */}
      <div className="pointer-events-none fixed inset-0 opacity-60">
        <div className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-zinc-900 blur-3xl" />
        <div className="absolute bottom-[-180px] right-[-120px] h-[520px] w-[520px] rounded-full bg-zinc-950 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950/40 px-3 py-1 text-xs text-zinc-400">
              Development UI
              <span className="h-1 w-1 rounded-full bg-zinc-600" />
              Monochrome Theme
            </div>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
              Professional Request Form
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-zinc-400">
              Clean black & white UI with validations, tags, and a live preview panel. (Static submit for now.)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/"
              className="rounded-xl border border-zinc-800 bg-zinc-950/40 px-4 py-2 text-sm text-zinc-200 hover:border-zinc-700 transition"
            >
              Back
            </a>
            <button
              type="button"
              onClick={() => {
                setData(initial);
                setFiles([]);
                setTouched({});
                setToast(null);
              }}
              className="rounded-xl border border-zinc-800 bg-zinc-950/40 px-4 py-2 text-sm text-zinc-200 hover:border-zinc-700 transition"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Toast */}
        {toast ? (
          <div
            className={[
              "mb-6 rounded-2xl border p-4 text-sm",
              toast.type === "success"
                ? "border-zinc-700 bg-zinc-950/40 text-zinc-200"
                : "border-red-800/40 bg-red-950/20 text-red-200",
            ].join(" ")}
          >
            <div className="flex items-center justify-between gap-4">
              <div>{toast.message}</div>
              <button
                type="button"
                onClick={() => setToast(null)}
                className="rounded-lg border border-zinc-800 bg-zinc-950/50 px-2 py-1 text-xs text-zinc-300 hover:text-white hover:border-zinc-700 transition"
              >
                Close
              </button>
            </div>
          </div>
        ) : null}

        {/* Layout */}
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          {/* Form Card */}
          <div className="rounded-3xl border border-zinc-800 bg-zinc-950/40 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] sm:p-7">
            <form onSubmit={onSubmit} className="space-y-10">
              {/* Section: Identity */}
              <div className="space-y-6">
                <SectionTitle
                  title="Requester Details"
                  desc="Basic information used for follow-up and assignment."
                />

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Full name" required error={touched.fullName ? errors.fullName : ""}>
                    <Input
                      value={data.fullName}
                      onChange={(e) => setField("fullName", e.target.value)}
                      onBlur={() => markTouched("fullName")}
                      placeholder="e.g., Muhammad Ibrahim"
                      autoComplete="name"
                    />
                  </Field>

                  <Field label="Email" required error={touched.email ? errors.email : ""}>
                    <Input
                      value={data.email}
                      onChange={(e) => setField("email", e.target.value)}
                      onBlur={() => markTouched("email")}
                      placeholder="e.g., ibrahim@company.com"
                      autoComplete="email"
                    />
                  </Field>

                  <Field label="Phone" hint="Optional" error="">
                    <Input
                      value={data.phone}
                      onChange={(e) => setField("phone", e.target.value)}
                      placeholder="e.g., +92 3xx xxxxxxx"
                      autoComplete="tel"
                    />
                  </Field>

                  <Field label="Preferred contact method" hint="Optional" error="">
                    <Select
                      value={data.contactMethod}
                      onChange={(e) => setField("contactMethod", e.target.value)}
                    >
                      {STATIC_OPTIONS.contactMethods.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>
              </div>

              {/* Section: Request */}
              <div className="space-y-6">
                <SectionTitle
                  title="Request Details"
                  desc="These fields map to dropdowns from Sheets later."
                />

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Department" required error={touched.department ? errors.department : ""}>
                    <Select
                      value={data.department}
                      onChange={(e) => setField("department", e.target.value)}
                      onBlur={() => markTouched("department")}
                    >
                      <option value="">Select a department</option>
                      {STATIC_OPTIONS.departments.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </Select>
                  </Field>

                  <Field label="Category" required error={touched.category ? errors.category : ""}>
                    <Select
                      value={data.category}
                      onChange={(e) => setField("category", e.target.value)}
                      onBlur={() => markTouched("category")}
                    >
                      <option value="">Select a category</option>
                      {STATIC_OPTIONS.categories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </Select>
                  </Field>

                  <Field label="Priority" hint="Default: Medium" error="">
                    <Select value={data.priority} onChange={(e) => setField("priority", e.target.value)}>
                      {STATIC_OPTIONS.priorities.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </Select>
                  </Field>

                  <Field label="Visibility" hint="Who can see this?" error="">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <RadioCard
                        name="visibility"
                        value="internal"
                        checked={data.visibility === "internal"}
                        onChange={(v) => setField("visibility", v)}
                        title="Internal"
                        desc="Visible to the team only."
                      />
                      <RadioCard
                        name="visibility"
                        value="client"
                        checked={data.visibility === "client"}
                        onChange={(v) => setField("visibility", v)}
                        title="Client-facing"
                        desc="Safe to share with client."
                      />
                    </div>
                  </Field>

                  <Field label="Company" hint="Optional" error="">
                    <Input
                      value={data.company}
                      onChange={(e) => setField("company", e.target.value)}
                      placeholder="e.g., Coastal Research"
                    />
                  </Field>

                  <Field label="Website" hint="Optional" error={touched.website ? errors.website : ""}>
                    <Input
                      value={data.website}
                      onChange={(e) => setField("website", e.target.value)}
                      onBlur={() => markTouched("website")}
                      placeholder="https://example.com"
                    />
                  </Field>

                  <Field label="Estimated budget" hint="Optional" error={touched.budget ? errors.budget : ""}>
                    <Input
                      value={data.budget}
                      onChange={(e) => setField("budget", e.target.value)}
                      onBlur={() => markTouched("budget")}
                      placeholder="e.g., 3000"
                      inputMode="numeric"
                    />
                  </Field>

                  <Field label="Quantity" hint="Number field" error="">
                    <Input
                      type="number"
                      min={1}
                      value={data.quantity}
                      onChange={(e) => setField("quantity", Number(e.target.value || 1))}
                    />
                  </Field>

                  <Field label="Preferred due date" hint="Optional" error="">
                    <Input
                      type="date"
                      value={data.dueDate}
                      onChange={(e) => setField("dueDate", e.target.value)}
                    />
                  </Field>

                  <Field label="Preferred due time" hint="Optional" error="">
                    <Input
                      type="time"
                      value={data.dueTime}
                      onChange={(e) => setField("dueTime", e.target.value)}
                    />
                  </Field>

                  <Field label="Satisfaction target" hint={`Current: ${data.satisfaction}/10`} error="">
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={data.satisfaction}
                      onChange={(e) => setField("satisfaction", Number(e.target.value))}
                      className="w-full accent-white"
                    />
                    <div className="flex justify-between text-xs text-zinc-600">
                      <span>1</span>
                      <span>10</span>
                    </div>
                  </Field>
                </div>

                {/* Tags */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-medium text-zinc-200">Tags</div>
                    <div className="text-xs text-zinc-500">Multi-select chips</div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {tagOptions.map((tag) => {
                      const active = data.tags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleTag(tag)}
                          className={[
                            "rounded-full border px-3 py-1 text-xs transition",
                            active
                              ? "border-zinc-500 bg-white text-black"
                              : "border-zinc-800 bg-zinc-950/40 text-zinc-300 hover:border-zinc-700",
                          ].join(" ")}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>

                  {data.tags.length ? (
                    <div className="flex flex-wrap gap-2">
                      {data.tags.map((t) => (
                        <Pill key={t} onRemove={() => toggleTag(t)}>
                          {t}
                        </Pill>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-500">No tags selected.</p>
                  )}
                </div>

                {/* Notes */}
                <Field label="Notes / Description" hint="Explain clearly" error="">
                  <Textarea
                    value={data.notes}
                    onChange={(e) => setField("notes", e.target.value)}
                    placeholder="Write a short description. Include example data if needed…"
                  />
                </Field>

                {/* Attachments (UI only) */}
                <FileDrop onPick={setFiles} files={files} />
              </div>

              {/* Section: Preferences */}
              <div className="space-y-6">
                <SectionTitle
                  title="Preferences"
                  desc="Small UX features that make it feel premium."
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <Toggle
                    checked={data.urgentNotify}
                    onChange={(v) => setField("urgentNotify", v)}
                    label="Enable urgent notifications"
                    desc="If priority is urgent, we can notify the team instantly (later)."
                  />

                  <Toggle
                    checked={data.agree}
                    onChange={(v) => {
                      setField("agree", v);
                      markTouched("agree");
                    }}
                    label="I confirm the information is correct"
                    desc="Required for submission."
                  />
                </div>

                {touched.agree && errors.agree ? (
                  <p className="text-xs text-red-300">{errors.agree}</p>
                ) : null}
              </div>

              {/* Submit */}
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-xs text-zinc-500">
                  This is UI-only submit for now. Next step: connect to <span className="text-zinc-300">/api/config</span> and{" "}
                  <span className="text-zinc-300">/api/submit</span>.
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className={[
                    "inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold transition",
                    "bg-white text-black hover:bg-zinc-200",
                    "disabled:opacity-60 disabled:cursor-not-allowed",
                  ].join(" ")}
                >
                  {submitting ? "Saving…" : "Submit Request"}
                </button>
              </div>
            </form>
          </div>

          {/* Preview Card */}
          <div className="rounded-3xl border border-zinc-800 bg-zinc-950/40 p-5 sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">Live Preview</h2>
                <p className="mt-1 text-sm text-zinc-400">This is what we’ll send to Sheets (later).</p>
              </div>

              <span className="rounded-full border border-zinc-800 bg-zinc-950/50 px-3 py-1 text-xs text-zinc-400">
                JSON
              </span>
            </div>

            <div className="mt-5 rounded-2xl border border-zinc-800 bg-black/40 p-4">
              <pre className="max-h-[520px] overflow-auto text-xs leading-relaxed text-zinc-300">
{JSON.stringify(preview, null, 2)}
              </pre>
            </div>

            <div className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4">
              <div className="text-sm font-medium text-zinc-200">Validation status</div>
              <div className="mt-2 text-sm">
                {canSubmit ? (
                  <span className="text-zinc-200">✅ Ready to submit</span>
                ) : (
                  <span className="text-red-200">⚠️ Missing required fields</span>
                )}
              </div>

              {!canSubmit ? (
                <ul className="mt-3 space-y-1 text-xs text-zinc-500">
                  {Object.entries(errors).map(([k, v]) => (
                    <li key={k}>
                      <span className="text-zinc-300">{k}:</span> {v}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-10 text-center text-xs text-zinc-600">
          Monochrome UI • Tailwind • Next.js (JS) • Development phase
        </div>
      </div>
    </div>
  );
}
