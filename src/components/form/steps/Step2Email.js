// ✅ FILE: app/duo/steps/Step2Email.js
"use client";

import { useEffect, useMemo, useRef, useState } from "react";

// ✅ Get first date from CSV like: "2026-01-15, 2026-01-18"
function getCleanDate_(plan) {
  const csv = plan?.["schedule date"] || "";
  const first = String(csv).split(",")[0]?.trim();
  return first || "-";
}

// ✅ Same “theme variables” idea like Step 1 (easy to tweak later)
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
};

function SectionCard({ title, subtitle, rightSlot, children }) {
  return (
    <div
      className={[
        "rounded-2xl border p-5 sm:p-6",
        THEME.cardBorder,
        THEME.cardBg,
        "transition-all duration-200 ease-in-out",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div
            className={[
              "text-base sm:text-lg font-semibold",
              THEME.textTitle,
            ].join(" ")}
          >
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

function InputField({ label, value, onChange, placeholder, type = "text" }) {
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
          THEME.cardBorder,
          "focus:border-white/40",
          THEME.focusRing,
        ].join(" ")}
      />
    </div>
  );
}

// ✅ “Action Card” (Hire / View Plans) like Step 1 style
function ActionCard({ checked, title, description, onSelect, name = "action" }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        "group relative w-full rounded-2xl border px-4 py-4 text-left",
        "transition-all duration-200 ease-in-out",
        "cursor-pointer select-none",
        "hover:-translate-y-[1px] hover:shadow-lg hover:shadow-black/20",
        "active:translate-y-0 active:scale-[0.99]",
        THEME.focusRing,
        checked
          ? `${THEME.cardBorderActive} ${THEME.cardBgActive}`
          : `${THEME.cardBorder} bg-black/20 ${THEME.hoverBg}`,
      ].join(" ")}
    >
      <div className="flex items-start gap-4">
        {/* ✅ Custom radio (clean + consistent) */}
        <span className="mt-1 inline-flex min-h-6 min-w-6 items-center justify-center rounded-full border border-white/20 bg-black/30 transition-all duration-200 ease-in-out group-hover:border-white/30">
          <span
            className={[
              "min-h-3.5 min-w-3.5 rounded-full transition-all duration-200 ease-in-out",
              checked ? "bg-white opacity-100" : "bg-white opacity-0",
            ].join(" ")}
          />
          <input
            type="radio"
            name={name}
            checked={checked}
            onChange={onSelect}
            className="sr-only"
          />
        </span>

        <div className="min-w-0">
          <div className={["text-base sm:text-lg font-semibold", THEME.textTitle].join(" ")}>
            {title}
          </div>
          <div className={["mt-1 text-sm sm:text-base", THEME.textSub].join(" ")}>
            {description}
          </div>
        </div>
      </div>

      {/* <div
        className={[
          "pointer-events-none absolute right-4 top-4 rounded-full px-2 py-1 text-xs",
          "transition-all duration-200 ease-in-out",
          checked ? "bg-white/10 text-white/90" : "bg-black/20 text-white/50",
        ].join(" ")}
      >
        {checked ? "Selected" : "Select"}
      </div> */}
    </button>
  );
}

// ✅ Plan row (3-dots menu) — UI only
function PlanRow({
  plan,
  isOpen,
  onToggleMenu,
  onActionPick,
}) {
  const id = plan.id;
  const label = `${plan["street/number"] || "-"}, ${plan["city/town"] || "-"}, ${
    plan["province"] || "-"
  } — ${plan["duration hours"] || "-"}h × ${plan["number of cleanings"] || "-"} cleanings`;

  const cleanDate = getCleanDate_(plan);

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
            Clean Date: <span className="text-white/70">{cleanDate}</span>
          </div>
        </div>

        {/* 3 dots */}
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

      {/* Dropdown menu */}
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
            { key: "schedule", label: "View/Change DATE, TIME & EXTRAS" },
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
  action,
  setAction,
  plansLoading,
  plans,
  fetchPlans,

  // plan selection state (still used by "Next" validation)
  selectedPlanId,
  setSelectedPlanId,
  modifyAction,
  setModifyAction,

  // ✅ NEW: 3-dots menu -> instant jump
  onPlanActionSelect,
  setMsg
}) {
  // Which plan menu is open
  const [openMenuId, setOpenMenuId] = useState("");

  // Close dropdown on outside click
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

  return (
    <div className="mt-7 space-y-4 sm:space-y-5" ref={wrapRef}>
      {/* ✅ Email */}
      <SectionCard
        title="Email *"
        subtitle="Enter your email to continue."
      >
        <InputField
          label="Email Address"
          value={email}
          onChange={(e) => {
            // ✅ Important: do NOT clear action here.
            // We only update the email, parent will auto-fetch plans if needed.
            setEmail(e.target.value);
          }}
          placeholder="Enter your email"
          type="email"
        />
      </SectionCard>

      {/* ✅ NEW USER */}
      {userType === "new" && (
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
            />

            <InputField
              label="Phone *"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Your phone number"
            />
          </div>
        </SectionCard>
      )}

      {/* ✅ EXISTING USER */}
      {userType === "registered" && (
        <SectionCard
          title="Existing User"
          subtitle="Choose an action to continue."
          rightSlot={
            <div className="hidden sm:block rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-white/70">
              Step 2 of 5
            </div>
          }
        >
          {/* Actions (Hire / Plans) */}
          <div className="grid gap-3 sm:grid-cols-2">
            <ActionCard
              checked={action === "hire"}
              title="Hire cleaning services"
              description="Create a new cleaning request with this email."
              onSelect={() => {
                setAction("hire");
                setOpenMenuId("");
                // keep selection clean
                setSelectedPlanId("");
                setModifyAction("");
              }}
              name="existingAction"
            />

            <ActionCard
              checked={action === "plans"}
              title="View Active Plans"
              description="See and update your existing cleaning plans."
              onSelect={() => {
                setAction("plans");
                setOpenMenuId("");
                // reset plan selection (user will choose from list)
                setSelectedPlanId("");
                setModifyAction("");
                // ✅ No manual fetch required (parent auto-fetches),
                // but we keep this immediate fetch for better UX.
                if (email.trim()) fetchPlans();
              }}
              name="existingAction"
            />
          </div>

          {/* Plans list */}
          {action === "plans" && hasEmail ? (
            <div className="mt-5 rounded-2xl border bg-black/20 p-4 sm:p-5 border-zinc-700/60">
              <div className="flex items-center justify-between gap-3">
                <div className={["text-base sm:text-lg font-semibold", THEME.textTitle].join(" ")}>
                  Active / Pending Plans
                </div>

                {/* Keep refresh button (optional), but not required anymore */}
                <button
                  type="button"
                  onClick={fetchPlans}
                  disabled={plansLoading}
                  title="Refresh plans"
                  className={[
                    "rounded-xl border px-3 py-2 text-xs sm:text-sm",
                    "transition-all duration-200 ease-in-out",
                    "cursor-pointer",
                    "hover:bg-white/10 active:scale-[0.98]",
                    THEME.cardBorder,
                    THEME.focusRing,
                    plansLoading ? "opacity-70 cursor-not-allowed" : "",
                  ].join(" ")}
                >
                  {plansLoading ? "Loading..." : "Refresh"}
                </button>
              </div>

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
                    console.log("p---------->>>>>", p)
                    const isOpen = openMenuId === id;

                    return (
                      <PlanRow
                        key={id}
                        plan={p}
                        isOpen={isOpen}
                        onToggleMenu={(planId) => {
                          setOpenMenuId(isOpen ? "" : planId);
                        }}
                        onActionPick={(planId, actionKey) => {
                          // ✅ keep old validation logic working
                          setSelectedPlanId(planId);
                          setModifyAction(actionKey);

                          // ✅ instant jump + prefill handled in parent
                          if (onPlanActionSelect) onPlanActionSelect(planId, actionKey);

                          // close menu
                          setOpenMenuId("");
                         setMsg("")

                        }}
                      />
                    );
                  })}

                  <div className={["pt-1 text-xs sm:text-sm", THEME.textMuted].join(" ")}>
                    Tip: click <span className="text-white/70">⋯</span> on a plan and choose an action to open it instantly.
                  </div>
                </div>
              )}
            </div>
          ) : null}

          {/* Small helper when no email */}
          {action === "plans" && !hasEmail ? (
            <div className={["mt-4 text-xs sm:text-sm", THEME.textMuted].join(" ")}>
              Enter your email above to load your plans.
            </div>
          ) : null}
        </SectionCard>
      )}
    </div>
  );
}
