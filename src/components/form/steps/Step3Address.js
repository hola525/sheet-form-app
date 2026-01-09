// ✅ FILE: app/duo/steps/Step3Address.js
// UI-only upgrade (same style rules as Step 1 & Step 2)
// ✅ Mobile responsive
// ✅ Bigger fonts + better spacing
// ✅ Smooth transitions + focus rings + cursor pointer
// ✅ NO logic changes (province change still resets city)

const THEME = {
  // 🌈 Easy to change later
  cardBg: "bg-black/25",
  cardBorder: "border-zinc-700/60",
  cardBorderActive: "border-white/60",
  cardBgActive: "bg-white/10",

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

function SelectField({ value, onChange, disabled, children }) {
  return (
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
        THEME.cardBorder,
        "focus:border-white/40",
        THEME.focusRing,
        disabled ? "opacity-60 cursor-not-allowed" : "",
      ].join(" ")}
    >
      {children}
    </select>
  );
}

function InputField({ value, onChange, placeholder, type = "text" }) {
  return (
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
        THEME.cardBorder,
        "focus:border-white/40",
        THEME.focusRing,
      ].join(" ")}
    />
  );
}

function TextareaField({ value, onChange, placeholder, rows = 3 }) {
  return (
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
        THEME.cardBorder,
        "focus:border-white/40",
        THEME.focusRing,
      ].join(" ")}
    />
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
}) {
  return (
    <div className="space-y-4">
      <SectionCard
        title="Address *"
        subtitle="Tell us where the cleaning will take place."
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
