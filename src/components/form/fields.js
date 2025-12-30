"use client";

import { cn } from "./utils";

export function SectionTitle({ title, desc }) {
  return (
    <div className="mb-5">
      <h2 className="text-lg font-semibold tracking-tight text-white">{title}</h2>
      {desc ? <p className="mt-1 text-sm text-zinc-400">{desc}</p> : null}
    </div>
  );
}

export function Field({ label, hint, error, children, required }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm font-medium text-zinc-200">
          {label} {required ? <span className="text-zinc-500">*</span> : null}
        </label>
        {hint ? <span className="text-xs text-zinc-500">{hint}</span> : null}
      </div>

      {children}

      {error ? (
        <p className="text-xs text-red-300">{error}</p>
      ) : (
        <p className="text-xs text-transparent select-none">.</p>
      )}
    </div>
  );
}

export function Input({ className, ...props }) {
  return (
    <input
      {...props}
      className={cn(
        "w-full rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-white",
        "placeholder:text-zinc-600 outline-none",
        "focus:border-zinc-600 focus:ring-4 focus:ring-zinc-900",
        "transition",
        className
      )}
    />
  );
}

export function Textarea({ className, ...props }) {
  return (
    <textarea
      {...props}
      className={cn(
        "min-h-[110px] w-full resize-y rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-white",
        "placeholder:text-zinc-600 outline-none",
        "focus:border-zinc-600 focus:ring-4 focus:ring-zinc-900",
        "transition",
        className
      )}
    />
  );
}

export function Select({ className, children, ...props }) {
  return (
    <select
      {...props}
      className={cn(
        "w-full rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-white",
        "outline-none focus:border-zinc-600 focus:ring-4 focus:ring-zinc-900 transition",
        className
      )}
    >
      {children}
    </select>
  );
}

export function Pill({ children, onRemove }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950/60 px-3 py-1 text-xs text-zinc-200">
      {children}
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          className="rounded-full px-1 text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition"
          aria-label="Remove"
        >
          ×
        </button>
      ) : null}
    </span>
  );
}

export function Toggle({ checked, onChange, label, desc }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        "w-full rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4 text-left transition",
        "hover:border-zinc-700"
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-medium text-zinc-200">{label}</div>
          {desc ? <div className="mt-1 text-xs text-zinc-500">{desc}</div> : null}
        </div>

        <span
          className={cn(
            "relative inline-flex h-6 w-11 items-center rounded-full border border-zinc-700 bg-zinc-900 transition",
            checked ? "border-zinc-500" : ""
          )}
        >
          <span
            className={cn(
              "inline-block h-5 w-5 translate-x-1 rounded-full bg-white transition",
              checked ? "translate-x-5" : ""
            )}
          />
        </span>
      </div>
    </button>
  );
}

export function RadioCard({ name, value, checked, onChange, title, desc }) {
  return (
    <label
      className={cn(
        "cursor-pointer rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4 transition",
        "hover:border-zinc-700",
        checked ? "border-zinc-500 ring-4 ring-zinc-900" : ""
      )}
    >
      <div className="flex items-start gap-3">
        <input
          type="radio"
          name={name}
          value={value}
          checked={checked}
          onChange={() => onChange(value)}
          className="mt-1 accent-white"
        />
        <div>
          <div className="text-sm font-medium text-zinc-200">{title}</div>
          {desc ? <div className="mt-1 text-xs text-zinc-500">{desc}</div> : null}
        </div>
      </div>
    </label>
  );
}

export function FileDrop({ onPick, files }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-medium text-zinc-200">Attachments</div>
          <div className="mt-1 text-xs text-zinc-500">
            Upload screenshots / PDFs (UI only for now)
          </div>
        </div>

        <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-zinc-800 bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-zinc-200 transition">
          Choose files
          <input
            type="file"
            multiple
            className="hidden"
            onChange={(e) => onPick(Array.from(e.target.files || []))}
          />
        </label>
      </div>

      {files?.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {files.map((f) => (
            <span
              key={f.name + f.size}
              className="rounded-full border border-zinc-800 bg-zinc-950/60 px-3 py-1 text-xs text-zinc-300"
            >
              {f.name}
            </span>
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-dashed border-zinc-800 bg-zinc-950/30 p-6 text-center text-xs text-zinc-500">
          Drag & drop is not enabled yet (development phase). Use “Choose files”.
        </div>
      )}
    </div>
  );
}
