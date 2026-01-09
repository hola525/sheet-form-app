// ✅ FILE: app/duo/steps/Step1UserType.js
// UI-only improvements:
// - Centralized “theme variables” (colors) at top for easy future changes
// - Smooth ease-in-out transitions, hover/active scale, focus rings
// - Cursor pointer everywhere clickable
// - Bigger + nicer custom radio indicator (still accessible)
// - Slightly “more form” (header, helper text, subtle footer hint)

const THEME = {
  // 🌈 Change these later if client wants new colors
  cardBg: "bg-black/25",
  cardBorder: "border-zinc-700/60",
  cardBorderActive: "border-white/60",
  cardBgActive: "bg-white/10",

  textTitle: "text-zinc-100",
  textSub: "text-zinc-300",
  textMuted: "text-zinc-400",

  hoverBg: "hover:bg-black/30",
  focusRing:
    "focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-0",
};

function OptionCard({
  checked,
  title,
  description,
  onSelect,
  name = "emailType",
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        "group relative w-full rounded-2xl border px-4 py-4 text-left",
        "transition-all duration-200 ease-in-out",
        "cursor-pointer select-none",
        "hover:-translate-y-[1px] hover:shadow-lg hover:shadow-black/20",
        "active:translate-y-0 active:scale-[0.99]",
        THEME.focusRing,

        checked
          ? `${THEME.cardBorderActive} ${THEME.cardBgActive}`
          : `${THEME.cardBorder} ${THEME.cardBg} ${THEME.hoverBg}`,
      ].join(" ")}
    >
      <div className="flex items-start gap-4">
        {/* ✅ Custom radio (bigger + nicer) */}
        <span className="mt-1 inline-flex min-h-6 min-w-6 items-center justify-center rounded-full border border-white/20 bg-black/30 transition-all duration-200 ease-in-out group-hover:border-white/30">
          <span
            className={[
              "min-h-3.5 min-w-3.5 rounded-full! transition-all duration-200 ease-in-out",
              checked ? "bg-white opacity-100" : "bg-white opacity-0",
            ].join(" ")}
          />

          {/* Hidden native radio for accessibility */}
          <input
            type="radio"
            name={name}
            checked={checked}
            onChange={onSelect}
            className="sr-only"
          />
        </span>

        <div className="min-w-0">
          <div
            className={[
              "text-base sm:text-lg font-semibold",
              THEME.textTitle,
              "transition-colors duration-200 ease-in-out",
            ].join(" ")}
          >
            {title}
          </div>

          <div
            className={[
              "mt-1 text-sm sm:text-base",
              THEME.textSub,
              "transition-colors duration-200 ease-in-out",
            ].join(" ")}
          >
            {description}
          </div>
        </div>
      </div>

      {/* ✅ Subtle right indicator (feels more “premium”) */}
      <div
        className={[
          "pointer-events-none absolute right-4 top-4 rounded-full px-2 py-1 text-xs",
          "transition-all duration-200 ease-in-out",
          checked ? "bg-white/10 text-white/90" : "bg-black/20 text-white/50",
        ].join(" ")}
      >
        {checked ? "Selected" : "Select"}
      </div>
    </button>
  );
}

export default function Step1UserType({ userType, setUserType }) {
  return (
    <div
      className={[
        "mt-7 rounded-2xl border p-5 sm:p-6",
        THEME.cardBorder,
        THEME.cardBg,
        "transition-all duration-200 ease-in-out",
      ].join(" ")}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div
            className={[
              "text-base sm:text-lg font-semibold",
              THEME.textTitle,
            ].join(" ")}
          >
            Email Type <span className="text-white/70">*</span>
          </div>
          <div
            className={["mt-1 text-sm sm:text-base", THEME.textSub].join(" ")}
          >
            Choose how you want to continue.
          </div>
        </div>

        {/* Small visual badge (optional nice touch) */}
        <div className="hidden sm:block rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-white/70">
          Step 1 of 5
        </div>
      </div>

      {/* Options */}
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <OptionCard
          checked={userType === "new"}
          title="New Email"
          description="First time here? Create a new cleaning request."
          onSelect={() => setUserType("new")}
        />

        <OptionCard
          checked={userType === "registered"}
          title="Registered Email"
          description="View or update your existing plans."
          onSelect={() => setUserType("registered")}
        />
      </div>

      {/* Footer hint */}
      <div className={["mt-4 text-xs sm:text-sm", THEME.textMuted].join(" ")}>
        Tip: You can change this later by clicking{" "}
        <span className="text-white/70">Back</span>.
      </div>
    </div>
  );
}
