// ✅ FILE: app/duo/steps/Step2Email.js
"use client";

import { useEffect, useMemo, useRef, useState } from "react";

// ✅ Build schedule preview: "2026-01-15 10:00, 2026-01-18 14:30"
function getSchedulePreview_(plan) {
  const dateCSV = plan?.["schedule date"] || "";
  const timeCSV = plan?.["schedule time"] || "";

  const dates = String(dateCSV)
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

  const times = String(timeCSV)
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

  if (!dates.length) return "-";

  const parts = dates.map((d, i) => {
    const t = times[i] || "";
    return t ? `${d} ${t}` : d;
  });

  return parts.join(", ");
}

const THEME = {
  cardBg: "bg-black/25",
  cardBorder: "border-zinc-700/60",
  cardBorderActive: "border-white/60",
  cardBgActive: "bg-white/10",

  textTitle: "text-zinc-100",
  textSub: "text-zinc-300",
  textMuted: "text-zinc-400",

  hoverBg: "hover:bg-black/30",
  focusRing:
    "focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-0",
  errorBorder: "border-red-500/70",
  errorBg: "bg-red-500/5",
};

function SectionCard({ title, subtitle, rightSlot, children, error }) {
  return (
    <div
      className={[
        "rounded-2xl border p-5 sm:p-6",
        "transition-all duration-200 ease-in-out",
        error
          ? `${THEME.errorBorder} ${THEME.errorBg}`
          : `${THEME.cardBorder} ${THEME.cardBg}`,
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className={["text-base sm:text-lg font-semibold", THEME.textTitle].join(" ")}>
            {title}
          </div>
          {subtitle ? (
            <div className={["mt-1 text-sm sm:text-base", THEME.textSub].join(" ")}>
              {subtitle}
            </div>
          ) : null}
        </div>

        {rightSlot ? <div className="shrink-0">{rightSlot}</div> : null}
      </div>

      <div className="mt-5">{children}</div>
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  error,
}) {
  return (
    <div>
      <label className={["text-sm sm:text-base font-medium", THEME.textSub].join(" ")}>
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={[
          "mt-2 w-full rounded-2xl border px-4 py-3 sm:py-3.5",
          "text-base sm:text-lg",
          "bg-black/30 outline-none",
          "transition-all duration-200 ease-in-out",
          "cursor-text",
          error
            ? "border-red-500/70 focus:border-red-400"
            : `${THEME.cardBorder} focus:border-white/40`,
          THEME.focusRing,
        ].join(" ")}
      />

      {error ? (
        <div className="mt-2 text-sm text-red-300">This field is required.</div>
      ) : null}
    </div>
  );
}

// ✅ Plan row (3-dots menu) — UI only
function PlanRow({ plan, isOpen, onToggleMenu, onActionPick }) {
  const id = plan.id;
  const label = `${plan["street/number"] || "-"}, ${plan["city/town"] || "-"}, ${
    plan["province"] || "-"
  } — ${plan["duration hours"] || "-"}h × ${
    plan["number of cleanings"] || "-"
  } cleanings`;

  const schedulePreview = getSchedulePreview_(plan);

  return (
    <div
      className={[
        "relative rounded-2xl border px-4 py-3",
        "bg-black/20",
        THEME.cardBorder,
        "transition-all duration-200 ease-in-out",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className={["text-sm sm:text-base font-semibold", THEME.textTitle].join(" ")}>
            <div className="truncate">{label}</div>
          </div>

          <div className={["mt-1 text-xs sm:text-sm", THEME.textMuted].join(" ")}>
            Date and Time:{" "}
            <span className="text-white/70 break-words">{schedulePreview}</span>
          </div>
        </div>

        <button
          type="button"
          className={[
            "shrink-0 rounded-xl border px-2.5 py-2",
            "text-sm sm:text-base leading-none",
            "bg-black/20",
            THEME.cardBorder,
            "transition-all duration-200 ease-in-out",
            "hover:bg-white/10",
            "active:scale-[0.98]",
            "cursor-pointer",
            THEME.focusRing,
          ].join(" ")}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleMenu(id);
          }}
          aria-label="Open plan actions"
        >
          ⋯
        </button>
      </div>

      {isOpen ? (
        <div
          className={[
            "absolute right-3 top-14 z-50 w-72 overflow-hidden rounded-2xl border",
            "bg-zinc-950 shadow-xl shadow-black/30",
            THEME.cardBorder,
          ].join(" ")}
        >
          {[
            { key: "address", label: "Change address of the plan" },
            { key: "plan", label: "Modify the contracted plan" },
            { key: "additional", label: "View/Change additional instructions" },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              className={[
                "w-full px-4 py-3 text-left",
                "text-sm sm:text-base",
                "transition-colors duration-150 ease-in-out",
                "hover:bg-white/10",
                "cursor-pointer",
              ].join(" ")}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onActionPick(id, item.key);
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function Step2Email({
  userType,
  email,
  setEmail,
  fullName,
  setFullName,
  phone,
  setPhone,

  plansLoading,
  plans,
  fetchPlans,

  selectedPlanId,
  setSelectedPlanId,
  modifyAction,
  setModifyAction,

  onPlanActionSelect,
  setMsg,
  touchedNext,

  onHireFromRegistered,
}) {
  const [openMenuId, setOpenMenuId] = useState("");
  const wrapRef = useRef(null);

  useEffect(() => {
    function onDocClick(e) {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target)) setOpenMenuId("");
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const hasEmail = useMemo(() => !!email.trim(), [email]);

  const showEmailError =
    touchedNext &&
    (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim()));

  const showNameError = touchedNext && userType === "new" && !fullName.trim();

  const showPhoneError =
    touchedNext &&
    userType === "new" &&
    (!phone.trim() || phone.replace(/[^\d]/g, "").length < 7);

  const showPlanPickError =
    touchedNext &&
    userType === "registered" &&
    hasEmail &&
    (!selectedPlanId || !modifyAction);

  return (
    <div className="mt-7 space-y-4 sm:space-y-5" ref={wrapRef}>
      <SectionCard title="Email *" subtitle="You can edit your email if needed.">
        <InputField
          label="Email Address"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            // if user edits email, clear plan selection to avoid wrong updates
            setSelectedPlanId("");
            setModifyAction("");
            setOpenMenuId("");
          }}
          placeholder="Enter your email"
          type="email"
          error={showEmailError}
        />
      </SectionCard>

      {userType === "new" ? (
        <SectionCard
          title="New User"
          subtitle="Please provide your contact details."
          rightSlot={
            <div className="hidden sm:block rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-white/70">
              Step 2 of 5
            </div>
          }
        >
          <div className="grid gap-4 sm:gap-5">
            <InputField
              label="Name and Surname *"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
              error={showNameError}
            />

            <InputField
              label="Phone *"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Your phone number"
              error={showPhoneError}
            />
          </div>
        </SectionCard>
      ) : (
        <SectionCard
          title="Existing Plans"
          subtitle="Select a plan and choose what you want to change."
          rightSlot={
            <div className="hidden sm:block rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-white/70">
              Step 2 of 5
            </div>
          }
          error={showPlanPickError}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className={["text-sm sm:text-base", THEME.textMuted].join(" ")}>
              If you want a new request with this email, click “Hire new cleaning”.
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={fetchPlans}
                disabled={plansLoading || !hasEmail}
                className={[
                  "rounded-xl border px-3 py-2 text-xs sm:text-sm",
                  "transition-all duration-200 ease-in-out",
                  "cursor-pointer",
                  "hover:bg-white/10 active:scale-[0.98]",
                  THEME.cardBorder,
                  THEME.focusRing,
                  plansLoading || !hasEmail ? "opacity-70 cursor-not-allowed" : "",
                ].join(" ")}
              >
                {plansLoading ? "Loading..." : "Refresh"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setMsg("");
                  setOpenMenuId("");
                  setSelectedPlanId("");
                  setModifyAction("");
                  if (onHireFromRegistered) onHireFromRegistered();
                }}
                className={[
                  "rounded-xl bg-white px-3 py-2 text-xs sm:text-sm font-semibold text-black",
                  "hover:bg-zinc-200 active:scale-[0.98]",
                  "transition-all duration-200 ease-in-out",
                  "cursor-pointer",
                ].join(" ")}
              >
                Hire new cleaning
              </button>
            </div>
          </div>

          {showPlanPickError ? (
            <div className="mt-3 text-sm text-red-300">
              Please select a plan and choose an action from{" "}
              <span className="text-white/70">⋯</span>.
            </div>
          ) : null}

          {plansLoading ? (
            <div className={["mt-3 text-sm sm:text-base", THEME.textMuted].join(" ")}>
              Loading…
            </div>
          ) : plans.length === 0 ? (
            <div className={["mt-3 text-sm sm:text-base", THEME.textMuted].join(" ")}>
              No plans found for this email.
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {plans.map((p) => {
                const id = p.id;
                const isOpen = openMenuId === id;

                return (
                  <PlanRow
                    key={id}
                    plan={p}
                    isOpen={isOpen}
                    onToggleMenu={(planId) => setOpenMenuId(isOpen ? "" : planId)}
                    onActionPick={(planId, actionKey) => {
                      setSelectedPlanId(planId);
                      setModifyAction(actionKey);

                      if (onPlanActionSelect) onPlanActionSelect(planId, actionKey);

                      setOpenMenuId("");
                      setMsg("");
                    }}
                  />
                );
              })}

              <div className={["pt-1 text-xs sm:text-sm", THEME.textMuted].join(" ")}>
                Tip: click <span className="text-white/70">⋯</span> and choose an action.
              </div>
            </div>
          )}
        </SectionCard>
      )}
    </div>
  );
}
