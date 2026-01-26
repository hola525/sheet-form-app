// ✅ FILE: app/duo/steps/Step1EmailLookup.js
"use client";

import { useMemo } from "react";

const THEME = {
  cardBg: "bg-black/25",
  cardBorder: "border-zinc-700/60",
  textTitle: "text-zinc-100",
  textSub: "text-zinc-300",
  textMuted: "text-zinc-400",
  focusRing:
    "focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-0",
  errorBorder: "border-red-500/70",
  errorBg: "bg-red-500/5",
};

function isValidEmail_(value) {
  const v = String(value || "").trim();
  if (!v) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
}

export default function Step1EmailLookup({ email, setEmail, touchedNext }) {
  const showEmailError = useMemo(() => {
    if (!touchedNext) return false;
    if (!email.trim()) return true;
    if (!isValidEmail_(email)) return true;
    return false;
  }, [email, touchedNext]);

  return (
    <div
      className={[
        "mt-7 rounded-2xl border p-5 sm:p-6",
        "transition-all duration-200 ease-in-out",
        showEmailError
          ? `${THEME.errorBorder} ${THEME.errorBg}`
          : `${THEME.cardBorder} ${THEME.cardBg}`,
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className={["text-base sm:text-lg font-semibold", THEME.textTitle].join(" ")}>
            Email <span className="text-white/70">*</span>
          </div>
          <div className={["mt-1 text-sm sm:text-base", THEME.textSub].join(" ")}>
            Enter your email to continue. We will automatically check if you already have plans.
          </div>

          {showEmailError ? (
            <div className="mt-2 text-sm text-red-300">
              Please enter a valid email address.
            </div>
          ) : null}
        </div>

        <div className="hidden sm:block rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-white/70">
          Step 1 of 5
        </div>
      </div>

      <div className="mt-5">
        <label className={["text-sm sm:text-base font-medium", THEME.textSub].join(" ")}>
          Email Address
        </label>

        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          className={[
            "mt-2 w-full rounded-2xl border px-4 py-3 sm:py-3.5",
            "text-base sm:text-lg",
            "bg-black/30 outline-none",
            "transition-all duration-200 ease-in-out",
            "cursor-text",
            THEME.focusRing,
            showEmailError
              ? "border-red-500/70 focus:border-red-400"
              : `${THEME.cardBorder} focus:border-white/40`,
          ].join(" ")}
        />

        <div className={["mt-3 text-xs sm:text-sm", THEME.textMuted].join(" ")}>
          Tip: If you already have plans, you’ll see them in the next step.
        </div>
      </div>
    </div>
  );
}
