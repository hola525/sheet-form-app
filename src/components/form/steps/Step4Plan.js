// ✅ FILE: app/duo/steps/Step4Plan.js
export default function Step4Plan({
    durationHours,
    setDurationHours,
    numberCleanings,
    setNumberCleanings,
    autoRenew,
    setAutoRenew,
    durationOptions,
    numberCleaningsOptions,
    renewOptions,
    onChangeNumberCleanings,
  }) {
    return (
      <div className="mt-6 space-y-4">
        <div className="rounded-xl border border-zinc-800 bg-black/30 p-4">
          <div className="text-sm font-semibold">CLEANING PLAN</div>
  
          <div className="mt-3 space-y-4">
            <div>
              <label className="text-sm text-zinc-300">Duration of each cleaning (hours) *</label>
              <select
                className="mt-1 w-full rounded-xl border border-zinc-800 bg-black/40 px-3 py-2 text-sm outline-none focus:border-zinc-600"
                value={durationHours}
                onChange={(e) => setDurationHours(e.target.value)}
              >
                <option value="">Select</option>
                {durationOptions.map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>
  
            <div>
              <label className="text-sm text-zinc-300">Number of Cleanings *</label>
              <select
                className="mt-1 w-full rounded-xl border border-zinc-800 bg-black/40 px-3 py-2 text-sm outline-none focus:border-zinc-600"
                value={numberCleanings}
                onChange={(e) => {
                  // ✅ Keep old behavior: changing number cleanings clears extras
                  setNumberCleanings(e.target.value);
                  if (typeof onChangeNumberCleanings === "function") onChangeNumberCleanings();
                }}
              >
                <option value="">Select</option>
                {numberCleaningsOptions.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
  
            <div>
              <label className="text-sm text-zinc-300">Auto renew when expires? *</label>
              <div className="mt-2 space-y-2 text-sm">
                {renewOptions.slice(0, 2).map((opt) => (
                  <label key={opt} className="flex items-center gap-2">
                    <input type="radio" checked={autoRenew === opt} onChange={() => setAutoRenew(opt)} />
                    {opt}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  