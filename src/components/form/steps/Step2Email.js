// ✅ FILE: app/duo/steps/Step2Email.js
"use client";

import { useEffect, useMemo, useRef, useState } from "react";

// ✅ Get first date from CSV like: "2026-01-15, 2026-01-18"
function getCleanDate_(plan) {
  const csv = plan?.["schedule date"] || "";
  const first = String(csv).split(",")[0]?.trim();
  return first || "-";
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
    <div className="mt-6 space-y-4" ref={wrapRef}>
      {/* Email input */}
      <div>
        <label className="text-sm text-zinc-300">Email *</label>
        <input
          className="mt-1 w-full rounded-xl border border-zinc-800 bg-black/40 px-3 py-2 text-sm outline-none focus:border-zinc-600"
          value={email}
          onChange={(e) => {
            // ✅ Important: do NOT clear action here.
            // We only update the email, parent will auto-fetch plans if needed.
            setEmail(e.target.value);
          }}
          placeholder="Enter your email"
        />
      </div>

      {/* New user fields */}
      {userType === "new" && (
        <div className="rounded-xl border border-zinc-800 bg-black/30 p-4 space-y-4">
          <div className="text-sm font-semibold">NEW USER</div>

          <div>
            <label className="text-sm text-zinc-300">Name and Surname *</label>
            <input
              className="mt-1 w-full rounded-xl border border-zinc-800 bg-black/40 px-3 py-2 text-sm outline-none focus:border-zinc-600"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
            />
          </div>

          <div>
            <label className="text-sm text-zinc-300">Phone *</label>
            <input
              className="mt-1 w-full rounded-xl border border-zinc-800 bg-black/40 px-3 py-2 text-sm outline-none focus:border-zinc-600"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Your phone number"
            />
          </div>
        </div>
      )}

      {/* Existing user fields */}
      {userType === "registered" && (
        <div className="rounded-xl border border-zinc-800 bg-black/30 p-4 space-y-3">
          <div className="text-sm font-semibold">EXISTING USER</div>

          <label className="text-sm text-zinc-300">
            What action do you want to take? *
          </label>

          <div className="space-y-2 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={action === "hire"}
                onChange={() => {
                  setAction("hire");
                  setOpenMenuId("");
                  // keep selection clean
                  setSelectedPlanId("");
                  setModifyAction("");
                }}
              />
              Hire cleaning services
            </label>

            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={action === "plans"}
                onChange={() => {
                  setAction("plans");
                  setOpenMenuId("");
                  // reset plan selection (user will choose from list)
                  setSelectedPlanId("");
                  setModifyAction("");
                  // ✅ No manual fetch here; parent auto-fetches when action=plans + email changes
                  // But we can still fetch once immediately if email exists
                  if (email.trim()) fetchPlans();
                }}
              />
              View Active Plans
            </label>
          </div>

          {/* Plans list */}
          {action === "plans" && hasEmail ? (
            <div className="mt-3 rounded-xl border border-zinc-800 bg-black/20 p-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">Active/Pending Plans</div>

                {/* Keep refresh button (optional), but not required anymore */}
                <button
                  type="button"
                  onClick={fetchPlans}
                  className="text-xs underline"
                  disabled={plansLoading}
                  title="Refresh plans"
                >
                  {plansLoading ? "Loading..." : "Refresh"}
                </button>
              </div>

              {plansLoading ? (
                <div className="mt-2 text-sm text-zinc-400">Loading…</div>
              ) : plans.length === 0 ? (
                <div className="mt-2 text-sm text-zinc-400">
                  No plans found for this email.
                </div>
              ) : (
                <div className="mt-3 space-y-2">
                  {plans.map((p) => {
                    const id = p.id;
                    const label = `${p["street/number"] || "-"}, ${p["city/town"] || "-"}, ${
                      p["province"] || "-"
                    } — ${p["duration hours"] || "-"}h × ${p["number of cleanings"] || "-"} cleanings`;

                    const cleanDate = getCleanDate_(p);
                    const isOpen = openMenuId === id;

                    return (
                      <div
                        key={id}
                        className="relative rounded-xl border border-zinc-800 bg-black/30 px-3 py-2"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm font-semibold truncate">
                              {label}
                            </div>
                            <div className="mt-1 text-xs text-zinc-400">
                              Clean Date: {cleanDate}
                            </div>
                          </div>

                          {/* 3 dots */}
                          <button
                            type="button"
                            className="shrink-0 rounded-lg border border-zinc-700 px-2 py-1 text-xs hover:bg-white/10"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setOpenMenuId(isOpen ? "" : id);
                            }}
                            aria-label="Open plan actions"
                          >
                            ⋯
                          </button>
                        </div>

                        {/* Dropdown menu */}
                        {isOpen ? (
                          <div className="absolute right-2 top-12 z-50 w-64 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-lg">
                            {[
                              { key: "address", label: "Change address of the plan" },
                              { key: "plan", label: "Modify the contracted plan" },
                              { key: "schedule", label: "View/Change DATE, TIME & EXTRAS" },
                              { key: "additional", label: "View/Change additional instructions" },
                            ].map((item) => (
                              <button
                                key={item.key}
                                type="button"
                                className="w-full px-3 py-2 text-left text-sm hover:bg-white/10"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();

                                  // ✅ keep old validation logic working
                                  setSelectedPlanId(id);
                                  setModifyAction(item.key);

                                  // ✅ instant jump + prefill handled in parent
                                  if (onPlanActionSelect) {
                                    onPlanActionSelect(id, item.key);
                                  }

                                  // close menu
                                  setOpenMenuId("");
                                }}
                              >
                                {item.label}
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}

                  <div className="pt-1 text-[11px] text-zinc-500">
                    Tip: click ⋯ on a plan and choose an action to open it instantly.
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
