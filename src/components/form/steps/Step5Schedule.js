// ✅ FILE: app/duo/steps/Step5Schedule.js
export default function Step5Schedule({
    date,
    setDate,
    time,
    setTime,
    timeWindow,
    setTimeWindow,
    rowKeys,
    extras,
    setExtras,
    extrasColOptions,
  }) {
    return (
      <div className="mt-6 space-y-4">
        <div className="rounded-xl border border-zinc-800 bg-black/30 p-4">
          <div className="text-sm font-semibold">SCHEDULE YOUR CLEANING(S)</div>
  
          <div className="mt-3 space-y-4">
            <div>
              <label className="text-sm text-zinc-300">Day *</label>
              <input
                type="date"
                className="mt-1 w-full rounded-xl border border-zinc-800 bg-black/40 px-3 py-2 text-sm outline-none focus:border-zinc-600"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
  
            <div>
              <label className="text-sm text-zinc-300">Time *</label>
              <input
                type="time"
                className="mt-1 w-full rounded-xl border border-zinc-800 bg-black/40 px-3 py-2 text-sm outline-none focus:border-zinc-600"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
  
            <div>
              <label className="text-sm text-zinc-300">Time Window *</label>
              <textarea
                rows={2}
                className="mt-1 w-full rounded-xl border border-zinc-800 bg-black/40 px-3 py-2 text-sm outline-none focus:border-zinc-600"
                value={timeWindow}
                onChange={(e) => setTimeWindow(e.target.value)}
                placeholder="Best times if we can’t arrive exactly at the indicated time"
              />
            </div>
  
            {/* Extras grid */}
            <div className="rounded-xl border border-zinc-800 bg-black/20 p-3">
              <div className="text-sm font-semibold">Extras (select one per row) *</div>
  
              <div className="mt-3 space-y-3">
                {rowKeys.map((rk) => (
                  <div key={rk} className="flex items-center gap-3">
                    <div className="w-32 text-sm text-zinc-300">{rk}</div>
  
                    <select
                      className="flex-1 rounded-xl border border-zinc-800 bg-black/40 px-3 py-2 text-sm outline-none focus:border-zinc-600"
                      value={extras[rk] || ""}
                      onChange={(e) => setExtras((prev) => ({ ...prev, [rk]: e.target.value }))}
                    >
                      <option value="">Select</option>
                      {extrasColOptions.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  