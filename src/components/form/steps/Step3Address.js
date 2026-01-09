// ✅ FILE: app/duo/steps/Step3Address.js
// UI-only upgrade (same style rules as Step 1 & Step 2)
// ✅ Mobile responsive
// ✅ Bigger fonts + better spacing
// ✅ Smooth transitions + focus rings + cursor pointer
// ✅ Adds red border on required fields when user clicks Next (touchedNext)
// ✅ NO logic changes (province change still resets city)

const THEME = {
  // 🌈 Easy to change later
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

function FieldError({ show }) {
  if (!show) return null;
  return <div className="mt-2 text-sm text-red-300">This field is required.</div>;
}

function SelectField({ value, onChange, disabled, error, children }) {
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
          "cursor-pointer",
          THEME.focusRing,
          error ? "border-red-500/70 focus:border-red-400" : `${THEME.cardBorder} focus:border-white/40`,
          disabled ? "opacity-60 cursor-not-allowed" : "",
        ].join(" ")}
      >
        {children}
      </select>

      <FieldError show={error} />
    </>
  );
}

function InputField({ value, onChange, placeholder, type = "text", error }) {
  return (
    <>
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
          THEME.focusRing,
          error ? "border-red-500/70 focus:border-red-400" : `${THEME.cardBorder} focus:border-white/40`,
        ].join(" ")}
      />

      <FieldError show={error} />
    </>
  );
}

function TextareaField({ value, onChange, placeholder, rows = 3, error }) {
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
          THEME.focusRing,
          error ? "border-red-500/70 focus:border-red-400" : `${THEME.cardBorder} focus:border-white/40`,
        ].join(" ")}
      />

      <FieldError show={error} />
    </>
  );
}

export default function Step3Address({
  province,
  setProvince,
  city,
  setCity,
  street,
  setStreet,
  details,
  setDetails,
  propertyType,
  setPropertyType,
  provinceOptions,
  cityOptions,
  propertyTypeOptions,
  touchedNext, // ✅ new
}) {
  // ✅ show errors only after user clicks Next
  const showProvinceError = !!touchedNext && !province;
  const showCityError = !!touchedNext && !city;
  const showStreetError = !!touchedNext && !street.trim();
  const showDetailsError = !!touchedNext && !details.trim();
  const showPropertyTypeError = !!touchedNext && !propertyType;

  const hasAnyError =
    showProvinceError ||
    showCityError ||
    showStreetError ||
    showDetailsError ||
    showPropertyTypeError;

  return (
    <div className="space-y-4">
      <SectionCard
        title="Address *"
        subtitle="Tell us where the cleaning will take place."
        error={hasAnyError} // ✅ card border red if any missing
        rightSlot={
          <div className="hidden sm:block rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-white/70">
            Step 3 of 5
          </div>
        }
      >
        <div className="grid gap-4 sm:gap-5">
          {/* Province + City (2 cols on desktop) */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel>Province *</FieldLabel>
              <SelectField
                value={province}
                onChange={(e) => {
                  // ✅ keep logic: if province changes, reset city
                  setProvince(e.target.value);
                  setCity("");
                }}
                error={showProvinceError}
              >
                <option value="">Select</option>
                {provinceOptions.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </SelectField>
            </div>

            <div>
              <FieldLabel>City/Town *</FieldLabel>
              <SelectField
                value={city}
                onChange={(e) => setCity(e.target.value)}
                disabled={!province}
                error={showCityError}
              >
                <option value="">
                  {province ? "Select" : "Select province first"}
                </option>
                {cityOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </SelectField>
            </div>
          </div>

          {/* Street */}
          <div>
            <FieldLabel>Street/Number *</FieldLabel>
            <InputField
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              placeholder="e.g. Main St 123"
              error={showStreetError}
            />
          </div>

          {/* Details */}
          <div>
            <FieldLabel>Property details *</FieldLabel>
            <TextareaField
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Lot / Block / Floor / Apartment / Other"
              rows={4}
              error={showDetailsError}
            />

            <div className={["mt-2 text-xs sm:text-sm", THEME.textMuted].join(" ")}>
              Add any extra info that helps our team find the location faster.
            </div>
          </div>

          {/* Property Type */}
          <div>
            <FieldLabel>Property Type *</FieldLabel>
            <SelectField
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value)}
              error={showPropertyTypeError}
            >
              <option value="">Select</option>
              {propertyTypeOptions.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </SelectField>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
