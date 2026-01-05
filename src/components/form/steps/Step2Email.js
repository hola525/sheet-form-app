// ✅ FILE: app/duo/steps/Step2Email.js
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

  // ✅ NEW for registered "plans" modify flow
  selectedPlanRow,
  setSelectedPlanRow,
  modifyAction,
  setModifyAction,
}) {
  return (
    <div className="mt-6 space-y-4">
      {/* Email input */}
      <div>
        <label className="text-sm text-zinc-300">Email *</label>
        <input
          className="mt-1 w-full rounded-xl border border-zinc-800 bg-black/40 px-3 py-2 text-sm outline-none focus:border-zinc-600"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
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

          <label className="text-sm text-zinc-300">What action do you want to take? *</label>

          <div className="space-y-2 text-sm">
            <label className="flex items-center gap-2">
              <input type="radio" checked={action === "hire"} onChange={() => setAction("hire")} />
              Hire cleaning services
            </label>

            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={action === "plans"}
                onChange={() => {
                  setAction("plans");
                  // ✅ clear selections when switching to plans
                  setSelectedPlanRow("");
                  setModifyAction("");
                }}
              />
              View Active Plans
            </label>
          </div>

          {/* Plans list (if action=plans) */}
          {action === "plans" && email.trim() ? (
            <div className="mt-3 rounded-xl border border-zinc-800 bg-black/20 p-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">Active/Pending Plans</div>

                <button type="button" onClick={fetchPlans} className="text-xs underline" disabled={plansLoading}>
                  {plansLoading ? "Loading..." : "Refresh"}
                </button>
              </div>

              {plansLoading ? (
                <div className="mt-2 text-sm text-zinc-400">Loading…</div>
              ) : plans.length === 0 ? (
                <div className="mt-2 text-sm text-zinc-400">No plans found for this email.</div>
              ) : (
                <div className="mt-3 space-y-3">
                  {/* ✅ 1) Select plan */}
                  <div className="rounded-xl border border-zinc-800 bg-black/30 p-3">
                    <div className="text-sm font-semibold">Select the plan you want to VIEW/MODIFY *</div>

                    <div className="mt-2 space-y-2 text-sm">
                      {plans.map((p, idx) => {
                        const row = String(p._rowNumber || "");
                        const label = `${p["street/number"] || "-"}, ${p["city/town"] || "-"}, ${p["province"] || "-"} — ${p["duration hours"] || "-"}h × ${p["number of cleanings"] || "-"} cleanings`;

                        return (
                          <label key={idx} className="flex items-start gap-2">
                            <input
                              type="radio"
                              checked={selectedPlanRow === row}
                              onChange={() => setSelectedPlanRow(row)}
                            />
                            <span>{label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* ✅ 2) Choose what to modify */}
                  <div className="rounded-xl border border-zinc-800 bg-black/30 p-3">
                    <div className="text-sm font-semibold">What action do you wish to take? *</div>

                    <div className="mt-2 space-y-2 text-sm">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          checked={modifyAction === "address"}
                          onChange={() => setModifyAction("address")}
                          disabled={!selectedPlanRow}
                        />
                        Change address of the plan
                      </label>

                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          checked={modifyAction === "plan"}
                          onChange={() => setModifyAction("plan")}
                          disabled={!selectedPlanRow}
                        />
                        Modify the contracted plan
                      </label>

                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          checked={modifyAction === "schedule"}
                          onChange={() => setModifyAction("schedule")}
                          disabled={!selectedPlanRow}
                        />
                        View/Change DATE, TIME & EXTRAS
                      </label>

                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          checked={modifyAction === "additional"}
                          onChange={() => setModifyAction("additional")}
                          disabled={!selectedPlanRow}
                        />
                        View/Change additional instructions
                      </label>
                    </div>

                    {!selectedPlanRow ? (
                      <div className="mt-2 text-xs text-zinc-400">Select a plan first to unlock actions.</div>
                    ) : null}
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
