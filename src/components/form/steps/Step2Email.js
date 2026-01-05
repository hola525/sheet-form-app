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
                <input type="radio" checked={action === "plans"} onChange={() => setAction("plans")} />
                View Active Plans
              </label>
            </div>
  
            {/* Show plans list (if action=plans) */}
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
                  <ul className="mt-2 space-y-2 text-sm">
                    {plans.map((p, idx) => (
                      <li key={idx} className="rounded-lg border border-zinc-800 bg-black/30 p-2">
                        <div>
                          <b>Address:</b> {p["street/number"] || "-"}, {p["city/town"] || "-"}, {p["province"] || "-"}
                        </div>
                        <div>
                          <b>Plan:</b> {p["duration hours"] || "-"}h × {p["number of cleanings"] || "-"} cleanings
                        </div>
                        <div>
                          <b>Status:</b> {p["status"] || "-"}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : null}
          </div>
        )}
      </div>
    );
  }
  