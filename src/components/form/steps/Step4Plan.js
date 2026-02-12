// ✅ FILE: app/duo/steps/Step4Plan.js
import { CalendarDays, Clock3 } from "lucide-react";
import { useMemo, useRef } from "react";

// ✅ YYYY-MM-DD in Argentina timezone
function todayISOInArgentina_() {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(new Date()); // "YYYY-MM-DD"
}
function addDaysISOArgentina_(days) {
  const base = new Date();
  base.setDate(base.getDate() + Number(days || 0));
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(base); // YYYY-MM-DD in Argentina tz
}

/**
 * Lock rule:
 * - lock if date is today OR tomorrow (or any earlier date)
 * - but we will apply it only in EDIT MODE (registered modify)
 */
function isLocked1DayBefore_(yyyyMmDd) {
  const d = String(yyyyMmDd || "").trim();
  if (!d) return false;

  const tomorrowISO = addDaysISOArgentina_(1); // tomorrow in Argentina tz
  return d <= tomorrowISO;
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

function SectionCard({ title, subtitle, rightSlot, error, children }) {
  return (
    <div
      className={[
        "mt-7 rounded-2xl border p-5 sm:p-6",
        THEME.cardBg,
        "transition-all duration-200 ease-in-out",
        error ? "border-red-500/70 bg-red-500/5" : THEME.cardBorder,
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
            <div
              className={["mt-1 text-sm sm:text-base", THEME.textSub].join(" ")}
            >
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
    <label
      className={["text-sm sm:text-base font-medium", THEME.textSub].join(" ")}
    >
      {children}
    </label>
  );
}

function FieldError({ show, message = "This field is required." }) {
  if (!show) return null;
  return <div className="mt-2 text-sm text-red-300">{message}</div>;
}

function SelectField({ value, onChange, children, error, disabled }) {
  return (
    <>
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={[
          "mt-2 w-full rounded-2xl border px-4 py-3 sm:py-3.5",
          "text-base sm:text-lg",
          "bg-black/30 outline-none",
          "transition-all duration-200 ease-in-out",
          disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer",
          THEME.focusRing,
          error
            ? "border-red-500/70 focus:border-red-400"
            : `${THEME.cardBorder} focus:border-white/40`,
        ].join(" ")}
      >
        {children}
      </select>

      <FieldError show={error} />
    </>
  );
}

function InputField({ type, value, onChange, disabled, min, error }) {
  const inputRef = useRef(null);
  const isDateTime = type === "date" || type === "time";

  function openNativePicker_() {
    if (!inputRef.current || disabled) return;
    if (typeof inputRef.current.showPicker === "function") {
      inputRef.current.showPicker();
      return;
    }
    inputRef.current.focus();
  }

  return (
    <>
      <div className="relative">
        <input
          ref={inputRef}
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
            isDateTime
              ? "cursor-pointer pr-12 duo-native-datetime"
              : "cursor-text",
            THEME.focusRing,
            error
              ? "border-red-500/70 focus:border-red-400"
              : `${THEME.cardBorder} focus:border-white/40`,
            disabled ? "opacity-60 cursor-not-allowed" : "",
          ].join(" ")}
        />

        {isDateTime ? (
          <button
            type="button"
            onClick={openNativePicker_}
            disabled={disabled}
            className={[
              "absolute right-3 top-1/2 -translate-y-1/2",
              "h-9 w-9 rounded-xl border",
              "flex items-center justify-center",
              "transition-all duration-200",
              disabled
                ? "opacity-50 cursor-not-allowed border-zinc-700/50 bg-black/10"
                : "cursor-pointer border-white/10 bg-black/25 hover:bg-white/10",
              error ? "border-red-500/40" : "",
            ].join(" ")}
            aria-label={
              type === "date" ? "Open date picker" : "Open time picker"
            }
          >
            {type === "date" ? (
              <CalendarDays className="h-5 w-5 text-white/90" />
            ) : (
              <Clock3 className="h-5 w-5 text-white/90" />
            )}
          </button>
        ) : null}
      </div>

      <FieldError show={error} />
    </>
  );
}

function RadioPill({ checked, label, onSelect, error, disabled }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={[
        "group flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3",
        "transition-all duration-200 ease-in-out",
        disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer",
        THEME.focusRing,
        error
          ? "border-red-500/70 bg-red-500/5"
          : checked
          ? "border-white/50 bg-white/10"
          : "border-zinc-700/60 bg-black/20 hover:bg-black/30",
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
        <div
          className={["text-sm sm:text-base font-medium", THEME.textSub].join(
            " "
          )}
        >
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
        disabled
          ? "opacity-60 cursor-not-allowed"
          : "cursor-pointer hover:bg-black/30",
        THEME.focusRing,
        "border-zinc-700/60 bg-black/20",
      ].join(" ")}
    >
      <span
        className={[
          "flex min-h-5 min-w-5 items-center justify-center rounded-md border",
          "transition-all duration-200 ease-in-out",
          checked
            ? "border-white/40 bg-white/10"
            : "border-white/15 bg-black/30",
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

  cleaningLabels,
  scheduleDates,
  setScheduleDates,
  scheduleTimes,
  setScheduleTimes,
  extrasByCleaning,
  setExtrasByCleaning,
  extrasCheckboxOptions,

  // ✅ NEW
  planLockedAll,
  origPlanN,
  origPlanDates,
  touchedNext,
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
      const current = Array.isArray(next[cleaningKey])
        ? [...next[cleaningKey]]
        : [];

      const has = current.includes(extraName);
      let updated = has
        ? current.filter((x) => x !== extraName)
        : [...current, extraName];

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
  const minDate = todayISOInArgentina_();

  const showDurationError = !!touchedNext && !durationHours;
  const showNumCleaningsError = !!touchedNext && !numberCleanings;
  const showAutoRenewError =
    !!touchedNext && (!autoRenew || !renewOptions.includes(autoRenew));

  const perCleaningErrors = useMemo(() => {
    let scheduleHasAnyError = false;

    const list = cleaningLabels.map((label, idx) => {
      const key = label;
      const dateVal = scheduleDates?.[idx] || "";
      // const locked = planLockedAll || isPastDate_(dateVal); // ✅ lock all OR past date
      const isEditMode = Number(origPlanN || 0) > 0;
      const isOriginalCleaning = isEditMode && idx < Number(origPlanN || 0);

      const baseDateForLock = isOriginalCleaning
        ? origPlanDates?.[idx] || dateVal
        : dateVal;

      const locked =
        planLockedAll ||
        (isOriginalCleaning && isLocked1DayBefore_(baseDateForLock));

      const timeVal = scheduleTimes?.[idx] || "";
      const selectedExtras = extrasByCleaning?.[key] || [];

      const dateErr = !!touchedNext && !locked && !dateVal;
      const timeErr = !!touchedNext && !locked && !timeVal;
      const extrasErr =
        !!touchedNext &&
        !locked &&
        (!Array.isArray(selectedExtras) || selectedExtras.length === 0);

      const any = dateErr || timeErr || extrasErr;
      if (any) scheduleHasAnyError = true;

      return { locked, dateErr, timeErr, extrasErr, any };
    });

    return { list, scheduleHasAnyError };
  }, [
    cleaningLabels,
    scheduleDates,
    scheduleTimes,
    extrasByCleaning,
    touchedNext,
    planLockedAll,
    origPlanN,
  ]);

  const hasAnyError =
    showDurationError ||
    showNumCleaningsError ||
    showAutoRenewError ||
    perCleaningErrors.scheduleHasAnyError;

  const disableStep4Fields = !!planLockedAll;

  return (
    <div className="space-y-4">
      <SectionCard
        title="Cleaning plan *"
        subtitle="Choose your plan, then set schedule and extras for each cleaning."
        error={hasAnyError}
        rightSlot={
          <div className="hidden sm:block rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-white/70">
            Step 4 of 5
          </div>
        }
      >
        {planLockedAll ? (
          <div className="mb-4 rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            🔒 This plan is locked because all cleanings have passed. You cannot
            this plan.
          </div>
        ) : origPlanN ? (
          <div className="mb-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/75">
            Note: You cannot reduce number of cleanings below <b>{origPlanN}</b>
            . If you increase it, old cleanings keep their schedule & extras.
          </div>
        ) : null}

        <div className="grid gap-4 sm:gap-5">
          <div>
            <FieldLabel>Duration of each cleaning (hours) *</FieldLabel>
            <SelectField
              value={durationHours}
              onChange={(e) => setDurationHours(e.target.value)}
              error={showDurationError}
              disabled={disableStep4Fields}
            >
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
                const val = e.target.value;
                // ✅ delegate to FormShell strict logic
                if (typeof onChangeNumberCleanings === "function")
                  onChangeNumberCleanings(val);
                else setNumberCleanings(val);
              }}
              error={showNumCleaningsError}
              disabled={disableStep4Fields}
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
                  error={showAutoRenewError}
                  disabled={disableStep4Fields}
                />
              ))}
            </div>

            <FieldError show={showAutoRenewError} />
          </div>
        </div>

        {n ? (
          <div
            className={[
              "mt-6 rounded-2xl border p-4 sm:p-5",
              THEME.innerBg,
              perCleaningErrors.scheduleHasAnyError
                ? "border-red-500/70 bg-red-500/5"
                : THEME.innerBorder,
            ].join(" ")}
          >
            <div
              className={[
                "text-base sm:text-lg font-semibold",
                THEME.textTitle,
              ].join(" ")}
            >
              Schedule & extras
            </div>
            <div
              className={["mt-1 text-xs sm:text-sm", THEME.textMuted].join(" ")}
            >
              Past dates are locked. If the full plan is locked, please add new
              plan.
            </div>

            <div className="mt-4 max-h-[65vh] overflow-y-auto pr-1">
              <div className="space-y-4">
                {cleaningLabels.map((label, idx) => {
                  const key = label;
                  const dateVal = scheduleDates?.[idx] || "";
                  // const locked = planLockedAll || isPastDate_(dateVal);
                  const isEditMode = Number(origPlanN || 0) > 0;
                  const isOriginalCleaning =
                    isEditMode && idx < Number(origPlanN || 0);

                  const baseDateForLock = isOriginalCleaning
                    ? origPlanDates?.[idx] || dateVal
                    : dateVal;

                  const locked =
                    planLockedAll ||
                    (isOriginalCleaning &&
                      isLocked1DayBefore_(baseDateForLock));

                  const selectedExtras = extrasByCleaning?.[key] || [];
                  const errs = perCleaningErrors.list[idx] || {};
                  const cardBorder = errs.any
                    ? "border-red-500/70 bg-red-500/5"
                    : THEME.innerBorder;

                  return (
                    <div
                      key={key}
                      className={[
                        "rounded-2xl border p-4",
                        "transition-all duration-200 ease-in-out",
                        cardBorder,
                        "bg-black/25",
                      ].join(" ")}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div
                            className={[
                              "text-base sm:text-lg font-semibold",
                              THEME.textTitle,
                            ].join(" ")}
                          >
                            {label}{" "}
                            {locked ? (
                              <span className="ml-2 text-xs sm:text-sm text-zinc-400">
                                (Locked)
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

                      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <FieldLabel>Date *</FieldLabel>
                          <InputField
                            type="date"
                            min={minDate}
                            value={dateVal}
                            disabled={locked}
                            onChange={(e) => setDateAt_(idx, e.target.value)}
                            error={errs.dateErr}
                          />
                        </div>

                        <div>
                          <FieldLabel>Time *</FieldLabel>
                          <InputField
                            type="time"
                            value={scheduleTimes?.[idx] || ""}
                            disabled={locked}
                            onChange={(e) => setTimeAt_(idx, e.target.value)}
                            error={errs.timeErr}
                          />
                        </div>
                      </div>

                      <div className="mt-5">
                        <div
                          className={[
                            "text-sm sm:text-base font-semibold",
                            THEME.textSub,
                          ].join(" ")}
                        >
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

                        <FieldError
                          show={errs.extrasErr}
                          message="Select at least one option (choose “Nothing” if no extras)."
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div
                className={["mt-4 text-xs sm:text-sm", THEME.textMuted].join(
                  " "
                )}
              >
                Tip: This section scrolls when you have many cleanings.
              </div>
            </div>
          </div>
        ) : null}
      </SectionCard>
    </div>
  );
}
