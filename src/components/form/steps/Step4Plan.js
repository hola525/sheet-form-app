// ✅ FILE: app/duo/steps/Step4Plan.js
// UI-only upgrade (same style rules as Step 1 & Step 3)
// ✅ Mobile responsive
// ✅ Bigger fonts + better spacing
// ✅ Smooth transitions + focus rings + cursor pointer
// ✅ Scroll ONLY in "Schedule & Extras" section when many cleanings
// ✅ NO business logic change

// --- helpers (date-only compare, no timezone headaches) ---
function todayISO_() {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}
function isPastDate_(yyyyMmDd) {
  const d = String(yyyyMmDd || "").trim();
  if (!d) return false;
  return d < todayISO_(); // lexicographic works for YYYY-MM-DD
}

const THEME = {
  cardBg: "bg-black/25",
  cardBorder: "border-zinc-700/60",
  innerBg: "bg-black/20",
  innerBorder: "border-zinc-700/60",

  textTitle: "text-zinc-100",
  textSub: "text-zinc-300",
  textMuted: "text-zinc-400",

  focusRing:
    "focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-0",
};

function SectionCard({ title, subtitle, rightSlot, children }) {
  return (
    <div
      className={[
        "mt-7 rounded-2xl border p-5 sm:p-6",
        THEME.cardBorder,
        THEME.cardBg,
        "transition-all duration-200 ease-in-out",
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

function FieldLabel({ children }) {
  return (
    <label className={["text-sm sm:text-base font-medium", THEME.textSub].join(" ")}>
      {children}
    </label>
  );
}

function SelectField({ value, onChange, children }) {
  return (
    <select
      value={value}
      onChange={onChange}
      className={[
        "mt-2 w-full rounded-2xl border px-4 py-3 sm:py-3.5",
        "text-base sm:text-lg",
        "bg-black/30 outline-none",
        "transition-all duration-200 ease-in-out",
        "cursor-pointer",
        THEME.cardBorder,
        "focus:border-white/40",
        THEME.focusRing,
      ].join(" ")}
    >
      {children}
    </select>
  );
}

function InputField({ type, value, onChange, disabled, min }) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      disabled={disabled}
      min={min}
      className={[
        "mt-2 w-full rounded-2xl border px-4 py-3 sm:py-3.5",
        "text-base sm:text-lg",
        "bg-black/30 outline-none",
        "transition-all duration-200 ease-in-out",
        type === "date" || type === "time" ? "cursor-pointer" : "cursor-text",
        THEME.cardBorder,
        "focus:border-white/40",
        THEME.focusRing,
        disabled ? "opacity-60 cursor-not-allowed" : "",
      ].join(" ")}
    />
  );
}

function RadioPill({ checked, label, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        "group flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3",
        "transition-all duration-200 ease-in-out",
        "cursor-pointer",
        checked
          ? "border-white/50 bg-white/10"
          : "border-zinc-700/60 bg-black/20 hover:bg-black/30",
        THEME.focusRing,
      ].join(" ")}
    >
      <div className="flex items-center gap-3">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-white/20 bg-black/30">
          <span
            className={[
              "h-3.5 w-3.5 rounded-full transition-all duration-200 ease-in-out",
              checked ? "bg-white opacity-100" : "bg-white opacity-0",
            ].join(" ")}
          />
        </span>
        <div className={["text-sm sm:text-base font-medium", THEME.textSub].join(" ")}>
          {label}
        </div>
      </div>

      <div
        className={[
          "rounded-full px-2 py-1 text-xs transition-all duration-200 ease-in-out",
          checked ? "bg-white/10 text-white/90" : "bg-black/20 text-white/50",
        ].join(" ")}
      >
        {checked ? "Selected" : "Select"}
      </div>
    </button>
  );
}

function CheckboxItem({ checked, disabled, label, onToggle }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onToggle}
      className={[
        "group flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left",
        "transition-all duration-200 ease-in-out",
        disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:bg-black/30",
        "border-zinc-700/60 bg-black/20",
        THEME.focusRing,
      ].join(" ")}
    >
      <span
        className={[
          "flex min-h-5 min-w-5 items-center justify-center rounded-md border",
          "transition-all duration-200 ease-in-out",
          checked ? "border-white/40 bg-white/10" : "border-white/15 bg-black/30",
        ].join(" ")}
        aria-hidden="true"
      >
        <span
          className={[
            "min-h-2.5 min-w-2.5 rounded-sm transition-all duration-200 ease-in-out",
            checked ? "bg-white opacity-100" : "bg-white opacity-0",
          ].join(" ")}
        />
      </span>

      <span className="text-sm sm:text-base text-white/85">{label}</span>
    </button>
  );
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

  // Schedule + extras
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
    <div className="space-y-4">
      <SectionCard
        title="Cleaning plan *"
        subtitle="Choose your plan, then set schedule and extras for each cleaning."
        rightSlot={
          <div className="hidden sm:block rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-white/70">
            Step 4 of 5
          </div>
        }
      >
        {/* Plan fields */}
        <div className="grid gap-4 sm:gap-5">
          <div>
            <FieldLabel>Duration of each cleaning (hours) *</FieldLabel>
            <SelectField value={durationHours} onChange={(e) => setDurationHours(e.target.value)}>
              <option value="">Select</option>
              {durationOptions.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </SelectField>
          </div>

          <div>
            <FieldLabel>Number of cleanings *</FieldLabel>
            <SelectField
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
            </SelectField>
          </div>

          <div>
            <FieldLabel>Auto renew when expires? *</FieldLabel>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {renewOptions.slice(0, 2).map((opt) => (
                <RadioPill
                  key={opt}
                  checked={autoRenew === opt}
                  label={opt}
                  onSelect={() => setAutoRenew(opt)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Schedule + Extras */}
        {n ? (
          <div
            className={[
              "mt-6 rounded-2xl border p-4 sm:p-5",
              THEME.innerBorder,
              THEME.innerBg,
            ].join(" ")}
          >
            <div className={["text-base sm:text-lg font-semibold", THEME.textTitle].join(" ")}>
              Schedule & extras
            </div>
            <div className={["mt-1 text-xs sm:text-sm", THEME.textMuted].join(" ")}>
              If a cleaning date is already in the past, it is locked and cannot be edited.
            </div>

            {/* ✅ Scroll only this section when too many cleanings */}
            <div className="mt-4 max-h-[65vh] overflow-y-auto pr-1">
              <div className="space-y-4">
                {cleaningLabels.map((label, idx) => {
                  const key = label; // "Cleaning 1"
                  const dateVal = scheduleDates?.[idx] || "";
                  const locked = isPastDate_(dateVal);
                  const selectedExtras = extrasByCleaning?.[key] || [];

                  return (
                    <div
                      key={key}
                      className={[
                        "rounded-2xl border p-4",
                        "transition-all duration-200 ease-in-out",
                        THEME.innerBorder,
                        "bg-black/25",
                      ].join(" ")}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className={["text-base sm:text-lg font-semibold", THEME.textTitle].join(" ")}>
                            {label}{" "}
                            {locked ? (
                              <span className="ml-2 text-xs sm:text-sm text-zinc-400">
                                (Locked - past date)
                              </span>
                            ) : null}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => clearCleaning_(idx, locked)}
                          disabled={locked}
                          className={[
                            "rounded-full border px-3 py-1 text-xs sm:text-sm",
                            "transition-all duration-200 ease-in-out",
                            locked
                              ? "opacity-50 cursor-not-allowed border-zinc-700/50"
                              : "cursor-pointer border-white/10 hover:bg-white/10",
                            THEME.focusRing,
                          ].join(" ")}
                        >
                          Clear
                        </button>
                      </div>

                      {/* Date + Time */}
                      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <FieldLabel>Date *</FieldLabel>
                          <InputField
                            type="date"
                            min={minDate}
                            value={dateVal}
                            disabled={locked}
                            onChange={(e) => setDateAt_(idx, e.target.value)}
                          />
                        </div>

                        <div>
                          <FieldLabel>Time *</FieldLabel>
                          <InputField
                            type="time"
                            value={scheduleTimes?.[idx] || ""}
                            disabled={locked}
                            onChange={(e) => setTimeAt_(idx, e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Extras */}
                      <div className="mt-5">
                        <div className={["text-sm sm:text-base font-semibold", THEME.textSub].join(" ")}>
                          Extras (select any) *
                        </div>

                        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                          {extrasCheckboxOptions.map((opt) => {
                            const checked = selectedExtras.includes(opt);
                            return (
                              <CheckboxItem
                                key={opt}
                                checked={checked}
                                disabled={locked}
                                label={opt}
                                onToggle={() => toggleExtra_(key, opt, locked)}
                              />
                            );
                          })}
                        </div>

                        {!locked &&
                        (!Array.isArray(selectedExtras) || selectedExtras.length === 0) ? (
                          <div className={["mt-3 text-xs sm:text-sm", THEME.textMuted].join(" ")}>
                            Select at least one option (choose “Nothing” if no extras).
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className={["mt-4 text-xs sm:text-sm", THEME.textMuted].join(" ")}>
                Tip: This section scrolls when you have many cleanings.
              </div>
            </div>
          </div>
        ) : null}
      </SectionCard>
    </div>
  );
}
