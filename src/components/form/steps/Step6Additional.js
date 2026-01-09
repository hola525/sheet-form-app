// ✅ FILE: app/duo/steps/Step6Additional.js
// UI-only upgrade (same theme rules as Step 1/3/4)
// ✅ Mobile responsive
// ✅ Bigger fonts + better spacing
// ✅ Smooth transitions + focus rings + cursor pointer
// ✅ Adds red border on required fields when user clicks Submit (touchedNext)
// ✅ NO logic changes

const THEME = {
  cardBg: "bg-black/25",
  cardBorder: "border-zinc-700/60",

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

function FieldError({ show, message = "This field is required." }) {
  if (!show) return null;
  return <div className="mt-2 text-sm text-red-300">{message}</div>;
}

function TextInput({ value, onChange, placeholder = "", error }) {
  return (
    <>
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={[
          "mt-2 w-full rounded-2xl border px-4 py-3 sm:py-3.5",
          "text-base sm:text-lg",
          "bg-black/30 outline-none",
          "transition-all duration-200 ease-in-out",
          "cursor-text",
          THEME.focusRing,
          error ? "border-red-500/70 focus:border-red-400" : `${THEME.cardBorder} focus:border-white/40`,
        ].join(" ")}
      />
      <FieldError show={error} />
    </>
  );
}

function TextArea({ value, onChange, placeholder = "", rows = 4, error }) {
  return (
    <>
      <textarea
        rows={rows}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={[
          "mt-2 w-full rounded-2xl border px-4 py-3 sm:py-3.5",
          "text-base sm:text-lg",
          "bg-black/30 outline-none",
          "transition-all duration-200 ease-in-out",
          "cursor-text",
          "resize-y",
          THEME.focusRing,
          error ? "border-red-500/70 focus:border-red-400" : `${THEME.cardBorder} focus:border-white/40`,
        ].join(" ")}
      />
      <FieldError show={error} />
    </>
  );
}

function SelectField({ value, onChange, children, error }) {
  return (
    <>
      <select
        value={value}
        onChange={onChange}
        className={[
          "mt-2 w-full rounded-2xl border px-4 py-3 sm:py-3.5",
          "text-base sm:text-lg",
          "bg-black/30 outline-none",
          "transition-all duration-200 ease-in-out",
          "cursor-pointer",
          THEME.focusRing,
          error ? "border-red-500/70 focus:border-red-400" : `${THEME.cardBorder} focus:border-white/40`,
        ].join(" ")}
      >
        {children}
      </select>
      <FieldError show={error} />
    </>
  );
}

export default function Step6Additional({
  cleaningInstructions,
  setCleaningInstructions,
  favoriteDuo,
  setFavoriteDuo,
  serviceType,
  setServiceType,
  serviceTypeOptions,
  touchedNext, // ✅ NEW
}) {
  // ✅ Required validation (show only after Submit clicked)
  const showInstructionsError = !!touchedNext && !String(cleaningInstructions || "").trim();
  const showServiceTypeError = !!touchedNext && !serviceType;

  const hasAnyError = showInstructionsError || showServiceTypeError;

  return (
    <div className="space-y-4">
      <SectionCard
        title="Additional instructions *"
        subtitle="Tell us any details that are important for the Duo0 who will be performing the cleaning."
        error={hasAnyError}
        rightSlot={
          <div className="hidden sm:block rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-white/70">
            Step 5 of 5
          </div>
        }
      >
        <div className="grid gap-4 sm:gap-5">
          {/* Cleaning instructions */}
          <div>
            <FieldLabel>Cleaning instructions *</FieldLabel>
            <TextArea
              rows={4}
              value={cleaningInstructions}
              onChange={(e) => setCleaningInstructions(e.target.value)}
              placeholder="Write any important notes…"
              error={showInstructionsError}
            />
            <div className={["mt-2 text-xs sm:text-sm", THEME.textMuted].join(" ")}>
              Example: pets at home, key instructions, parking details, fragile items, etc.
            </div>
          </div>

          {/* Favorite Duo */}
          <div>
            <FieldLabel>Favorite Duo0</FieldLabel>
            <TextInput
              value={favoriteDuo}
              onChange={(e) => setFavoriteDuo(e.target.value)}
              placeholder="Optional"
              error={false}
            />
          </div>

          {/* Service type */}
          <div>
            <FieldLabel>Type of service to be performed *</FieldLabel>
            <SelectField
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              error={showServiceTypeError}
            >
              <option value="">Choose</option>
              {serviceTypeOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </SelectField>

            <div className={["mt-2 text-xs sm:text-sm", THEME.textMuted].join(" ")}>
              Pick the option that best matches the cleaning request.
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
