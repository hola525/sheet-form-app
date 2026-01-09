// ✅ FILE: app/duo/steps/Step4Plan.js

// --- helpers (date-only compare, no timezone headaches) ---
function todayISO_() {
  // "YYYY-MM-DD"
  return new Date().toISOString().slice(0, 10);
}

function isPastDate_(yyyyMmDd) {
  const d = String(yyyyMmDd || "").trim();
  if (!d) return false;

  // Compare as strings because YYYY-MM-DD is lexicographically sortable
  // "2026-01-08" < "2026-01-09" ✅
  return d < todayISO_();
}

export default function Step4Plan({
  // Plan
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

  // ✅ Schedule + extras per cleaning
  cleaningLabels,
  scheduleDates,
  setScheduleDates,
  scheduleTimes,
  setScheduleTimes,
  extrasByCleaning,
  setExtrasByCleaning,
  extrasCheckboxOptions,
}) {
  function setDateAt_(idx, value) {
    setScheduleDates((prev) => {
      const next = Array.isArray(prev) ? [...prev] : [];
      next[idx] = value;
      return next;
    });
  }

  function setTimeAt_(idx, value) {
    setScheduleTimes((prev) => {
      const next = Array.isArray(prev) ? [...prev] : [];
      next[idx] = value;
      return next;
    });
  }

  // Checkbox rules:
  // - Can select multiple
  // - "Nothing" becomes the only selected option
  // - Selecting anything else removes "Nothing"
  function toggleExtra_(cleaningKey, extraName, locked) {
    if (locked) return;

    setExtrasByCleaning((prev) => {
      const next = { ...(prev || {}) };
      const current = Array.isArray(next[cleaningKey]) ? [...next[cleaningKey]] : [];

      const has = current.includes(extraName);
      let updated = has ? current.filter((x) => x !== extraName) : [...current, extraName];

      const nothing = "Nothing";
      if (extraName === nothing && !has) {
        updated = [nothing];
      } else if (extraName !== nothing && updated.includes(nothing)) {
        updated = updated.filter((x) => x !== nothing);
      }

      next[cleaningKey] = updated;
      return next;
    });
  }

  function clearCleaning_(idx, locked) {
    if (locked) return;

    const key = `Cleaning ${idx + 1}`;
    setDateAt_(idx, "");
    setTimeAt_(idx, "");
    setExtrasByCleaning((prev) => {
      const next = { ...(prev || {}) };
      delete next[key];
      return next;
    });
  }

  const n = Number(numberCleanings || 0);
  const minDate = todayISO_();

  return (
    <div className="mt-6 space-y-4">
      <div className="rounded-xl border border-zinc-800 bg-black/30 p-4">
        <div className="text-sm font-semibold">CLEANING PLAN</div>

        {/* Plan fields */}
        <div className="mt-3 space-y-4">
          <div>
            <label className="text-sm text-zinc-300">
              Duration of each cleaning (hours) *
            </label>
            <select
              className="mt-1 w-full rounded-xl border border-zinc-800 bg-black/40 px-3 py-2 text-sm outline-none focus:border-zinc-600"
              value={durationHours}
              onChange={(e) => setDurationHours(e.target.value)}
            >
              <option value="">Select</option>
              {durationOptions.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-zinc-300">Number of Cleanings *</label>
            <select
              className="mt-1 w-full rounded-xl border border-zinc-800 bg-black/40 px-3 py-2 text-sm outline-none focus:border-zinc-600"
              value={numberCleanings}
              onChange={(e) => {
                setNumberCleanings(e.target.value);
                if (typeof onChangeNumberCleanings === "function") onChangeNumberCleanings();
              }}
            >
              <option value="">Select</option>
              {numberCleaningsOptions.map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
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

        {/* ✅ Schedule + extras per cleaning */}
        {n ? (
          <div className="mt-6 rounded-xl border border-zinc-800 bg-black/20 p-4">
            <div className="text-sm font-semibold">SCHEDULE & EXTRAS</div>
            <div className="mt-1 text-xs text-zinc-400">
              If a cleaning date is already in the past, it is locked and cannot be edited.
            </div>

            <div className="mt-4 space-y-4">
              {cleaningLabels.map((label, idx) => {
                const key = label; // "Cleaning 1"
                const dateVal = scheduleDates?.[idx] || "";
                const locked = isPastDate_(dateVal);

                const selectedExtras = extrasByCleaning?.[key] || [];

                return (
                  <div key={key} className="rounded-xl border border-zinc-800 bg-black/30 p-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold">
                        {label}{" "}
                        {locked ? <span className="text-xs text-zinc-400">(Locked - past date)</span> : null}
                      </div>

                      <button
                        type="button"
                        onClick={() => clearCleaning_(idx, locked)}
                        disabled={locked}
                        className="text-xs underline text-zinc-300 hover:text-white disabled:opacity-50"
                      >
                        Clear
                      </button>
                    </div>

                    {/* Date + Time */}
                    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className="text-sm text-zinc-300">Date *</label>
                        <input
                          type="date"
                          min={minDate} // ✅ prevents selecting past dates for new edits
                          className="mt-1 w-full rounded-xl border border-zinc-800 bg-black/40 px-3 py-2 text-sm outline-none focus:border-zinc-600 disabled:opacity-60"
                          value={dateVal}
                          disabled={locked}
                          onChange={(e) => setDateAt_(idx, e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="text-sm text-zinc-300">Time *</label>
                        <input
                          type="time"
                          className="mt-1 w-full rounded-xl border border-zinc-800 bg-black/40 px-3 py-2 text-sm outline-none focus:border-zinc-600 disabled:opacity-60"
                          value={scheduleTimes?.[idx] || ""}
                          disabled={locked}
                          onChange={(e) => setTimeAt_(idx, e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Extras checkboxes */}
                    <div className="mt-4">
                      <div className="text-sm text-zinc-300 font-medium">
                        Extras (select any) *
                      </div>

                      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {extrasCheckboxOptions.map((opt) => {
                          const checked = selectedExtras.includes(opt);
                          return (
                            <label key={opt} className="flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                checked={checked}
                                disabled={locked}
                                onChange={() => toggleExtra_(key, opt, locked)}
                              />
                              {opt}
                            </label>
                          );
                        })}
                      </div>

                      {!locked && (!Array.isArray(selectedExtras) || selectedExtras.length === 0) ? (
                        <div className="mt-2 text-xs text-zinc-400">
                          Select at least one option (choose “Nothing” if no extras).
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
