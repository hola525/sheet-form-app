"use client";

import { useEffect, useMemo, useState } from "react";

const TEXT = {
  title: "Duo0",
  step: (n) => `Step ${n}`,
  next: "Next",
  back: "Back",
  submit: "Submit",
};

// ✅ fallback options
const OPTIONS = {
  provinces: ["Buenos Aires", "Córdoba", "Mendoza", "Santa Fé"],
  cities: {
    "Buenos Aires": ["Buenos Aires City", "La Plata"],
    "Córdoba": [
      "Córdoba city (inside the ring road)",
      "Córdoba city (outside the ring road)",
      "Carlos Paz",
      "Malagueño",
      "Saldán",
      "Villa Allende",
    ],
    "Mendoza": ["Mendoza City"],
    "Santa Fé": ["Santa Fé City"],
  },
  propertyTypes: ["House", "Apartment", "Office", "Commercial", "Airbnb"],
  durationHours: ["1", "2", "3", "4"],
  numberCleanings: ["1", "2", "4", "8", "12"],
  extrasCols: ["Nothing", "Basic Kit", "Hydro-lavator", "Ladder", "Extensible", "Extension", "Hose"],

  // ✅ fallback service types (Google Form style)
  serviceTypes: [
    "Completion of Work",
    "Pre/post move-in cleaning",
    "Deep cleaning",
    "Periodic cleaning",
    "Airbnb Check in/out",
  ],
};

export default function FormShell() {
  const [step, setStep] = useState(1);

  // Step 1
  const [userType, setUserType] = useState(""); // "new" | "registered"

  // Step 2
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [action, setAction] = useState(""); // "hire" | "plans"

  // Step 3 - Address
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [street, setStreet] = useState("");
  const [details, setDetails] = useState("");
  const [propertyType, setPropertyType] = useState("");

  // Step 4 - Plan
  const [durationHours, setDurationHours] = useState("");
  const [numberCleanings, setNumberCleanings] = useState("");
  const [autoRenew, setAutoRenew] = useState("");

  // Step 5 - Schedule + Extras grid
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [timeWindow, setTimeWindow] = useState("");
  const [extras, setExtras] = useState({});

  // ✅ Step 6 - Additional instructions + Service type
  const [cleaningInstructions, setCleaningInstructions] = useState("");
  const [favoriteDuo, setFavoriteDuo] = useState("");
  const [serviceType, setServiceType] = useState("");

  // Plans view for Registered Email
  const [plansLoading, setPlansLoading] = useState(false);
  const [plans, setPlans] = useState([]);
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  // ✅ Config loaded from /api/duo/config
  const [cfg, setCfg] = useState({
    departments: [],
    categories: [],
    priorities: [],
    statuses: [],
    provinces: [],

    propertyTypes: [],
    durationHours: [],
    numberOfCleanings: [],
    renewPlans: [],
    extrasCols: [],

    citiesByProvince: {},

    // ✅ NEW
    serviceTypes: [],
  });

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/duo/config");
        const data = await res.json();
        if (data.ok) {
          setCfg({
            departments: data.departments || [],
            categories: data.categories || [],
            priorities: data.priorities || [],
            statuses: data.statuses || [],
            provinces: data.provinces || [],

            propertyTypes: data.propertyTypes || [],
            durationHours: data.durationHours || [],
            numberOfCleanings: data.numberOfCleanings || [],
            renewPlans: data.renewPlans || [],
            extrasCols: data.extrasCols || [],

            citiesByProvince: data.citiesByProvince || {},

            // ✅ Type of service from config
            serviceTypes: data.serviceTypes || [],
          });
        }
      } catch (e) {
        // silent fallback
      }
    }
    load();
  }, []);

  // ✅ Helpers: cfg first, fallback OPTIONS
  const provinceOptions = cfg.provinces.length ? cfg.provinces : OPTIONS.provinces;
  const propertyTypeOptions = cfg.propertyTypes.length ? cfg.propertyTypes : OPTIONS.propertyTypes;
  const durationOptions = cfg.durationHours.length ? cfg.durationHours : OPTIONS.durationHours;
  const numberCleaningsOptions = cfg.numberOfCleanings.length ? cfg.numberOfCleanings : OPTIONS.numberCleanings;
  const extrasColOptions = cfg.extrasCols.length ? cfg.extrasCols : OPTIONS.extrasCols;
  const renewOptions = cfg.renewPlans.length ? cfg.renewPlans : ["Yes", "No"];

  // ✅ dynamic dropdown for Step 6
  const serviceTypeOptions = cfg.serviceTypes.length ? cfg.serviceTypes : OPTIONS.serviceTypes;

  // ✅ City/Town dynamic (cfg first, fallback OPTIONS)
  const cityOptions = useMemo(() => {
    if (!province) return [];
    const dynamic = cfg.citiesByProvince?.[province];
    if (Array.isArray(dynamic) && dynamic.length) return dynamic;
    return OPTIONS.cities[province] || [];
  }, [province, cfg.citiesByProvince]);

  // Extras grid rows
  const rowKeys = useMemo(() => {
    const n = Number(numberCleanings || 0);
    const base = ["None"];
    if (!n) return base;
    const rows = Array.from({ length: Math.min(n, 12) }, (_, i) => `Cleaning ${i + 1}`);
    return [...base, ...rows, "All cleanings"];
  }, [numberCleanings]);

  // ✅ validations
  function canNextStep1() {
    return userType === "new" || userType === "registered";
  }

  function canNextStep2() {
    if (!email.trim()) return false;
    if (userType === "new") return fullName.trim() && phone.trim();
    if (userType === "registered") return action === "hire" || action === "plans";
    return false;
  }

  function canNextStep3() {
    return province && city && street.trim() && details.trim() && propertyType;
  }

  function canNextStep4() {
    return durationHours && numberCleanings && renewOptions.includes(autoRenew);
  }

  function canNextStep5() {
    if (!date || !time || !timeWindow.trim()) return false;
    for (const r of rowKeys) {
      if (!extras[r]) return false;
    }
    return true;
  }

  function canSubmitStep6() {
    if (!cleaningInstructions.trim()) return false;
    if (!serviceType) return false;
    return true;
  }

  async function fetchPlans() {
    setMsg("");
    setPlans([]);
    setPlansLoading(true);
    try {
      const res = await fetch(`/api/duo/plans?email=${encodeURIComponent(email.trim())}`);
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data?.error || "Failed to load plans");
      setPlans(data.plans || []);
    } catch (e) {
      setMsg(e.message);
    } finally {
      setPlansLoading(false);
    }
  }

  async function submitAll() {
    setMsg("");
    setSaving(true);
    try {
      const payload = {
        userType: userType === "new" ? "New" : "Registered",
        flowAction: action === "hire" ? "Hire cleaning services" : action === "plans" ? "View Active Plans" : "",

        email,
        fullName: userType === "new" ? fullName : "",
        phone: userType === "new" ? phone : "",

        address: { province, city, street, details, propertyType },
        plan: { durationHours, numberCleanings, autoRenew },
        schedule: { date, time, timeWindow, extras },

        // ✅ Step 6
        additional: {
          cleaningInstructions,
          favoriteDuo,
          serviceType,
        },
      };

      const res = await fetch("/api/duo/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data?.error || "Submit failed");

      setMsg("✅ Saved to Google Sheet!");
      setStep(1);

      // Reset
      setUserType("");
      setEmail("");
      setFullName("");
      setPhone("");
      setAction("");

      setProvince("");
      setCity("");
      setStreet("");
      setDetails("");
      setPropertyType("");

      setDurationHours("");
      setNumberCleanings("");
      setAutoRenew("");

      setDate("");
      setTime("");
      setTimeWindow("");
      setExtras({});

      // Step 6 reset
      setCleaningInstructions("");
      setFavoriteDuo("");
      setServiceType("");

      setPlans([]);
    } catch (e) {
      setMsg(e.message);
    } finally {
      setSaving(false);
    }
  }

  function goNext() {
    setMsg("");

    if (step === 1 && canNextStep1()) return setStep(2);

    if (step === 2 && canNextStep2()) {
      if (userType === "registered" && action === "plans") {
        fetchPlans();
        return;
      }
      return setStep(3);
    }

    if (step === 3 && canNextStep3()) return setStep(4);
    if (step === 4 && canNextStep4()) return setStep(5);
    if (step === 5 && canNextStep5()) return setStep(6);
  }

  function goBack() {
    setMsg("");
    if (step === 2) return setStep(1);
    if (step === 3) return setStep(2);
    if (step === 4) return setStep(3);
    if (step === 5) return setStep(4);
    if (step === 6) return setStep(5);
  }

  return (
    <div className="min-h-screen bg-gray-600 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-xl rounded-2xl border border-zinc-800 bg-zinc-950/40 p-6">
        <h1 className="text-xl font-semibold">{TEXT.title}</h1>
        <p className="mt-1 text-sm text-zinc-400">{TEXT.step(step)}</p>

        {msg ? (
          <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950/50 p-3 text-sm">{msg}</div>
        ) : null}

        {/* STEP 1 */}
        {step === 1 && (
          <div className="mt-6 rounded-xl border border-zinc-800 bg-black/30 p-4">
            <label className="text-sm text-zinc-300 font-medium">Email Address *</label>
            <div className="mt-3 space-y-2 text-sm">
              <label className="flex items-center gap-2">
                <input type="radio" checked={userType === "new"} onChange={() => setUserType("new")} />
                New Email
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" checked={userType === "registered"} onChange={() => setUserType("registered")} />
                Registered Email
              </label>
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div className="mt-6 space-y-4">
            <div>
              <label className="text-sm text-zinc-300">Email *</label>
              <input
                className="mt-1 w-full rounded-xl border border-zinc-800 bg-black/40 px-3 py-2 text-sm outline-none focus:border-zinc-600"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
              />
            </div>

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
        )}

        {/* STEP 3: ADDRESS */}
        {step === 3 && (
          <div className="mt-6 space-y-4">
            <div className="rounded-xl border border-zinc-800 bg-black/30 p-4">
              <div className="text-sm font-semibold">NEW ADDRESS</div>
              <div className="mt-3 space-y-4">
                <div>
                  <label className="text-sm text-zinc-300">Province *</label>
                  <select
                    className="mt-1 w-full rounded-xl border border-zinc-800 bg-black/40 px-3 py-2 text-sm outline-none focus:border-zinc-600"
                    value={province}
                    onChange={(e) => {
                      setProvince(e.target.value);
                      setCity("");
                    }}
                  >
                    <option value="">Select</option>
                    {provinceOptions.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm text-zinc-300">City/Town *</label>
                  <select
                    className="mt-1 w-full rounded-xl border border-zinc-800 bg-black/40 px-3 py-2 text-sm outline-none focus:border-zinc-600"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    disabled={!province}
                  >
                    <option value="">{province ? "Select" : "Select province first"}</option>
                    {cityOptions.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm text-zinc-300">Street/Number *</label>
                  <input
                    className="mt-1 w-full rounded-xl border border-zinc-800 bg-black/40 px-3 py-2 text-sm outline-none focus:border-zinc-600"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="e.g. Main St 123"
                  />
                </div>

                <div>
                  <label className="text-sm text-zinc-300">Property details *</label>
                  <textarea
                    className="mt-1 w-full rounded-xl border border-zinc-800 bg-black/40 px-3 py-2 text-sm outline-none focus:border-zinc-600"
                    rows={3}
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="Lot/Block/Floor/Apartment/Other"
                  />
                </div>

                <div>
                  <label className="text-sm text-zinc-300">Property Type *</label>
                  <select
                    className="mt-1 w-full rounded-xl border border-zinc-800 bg-black/40 px-3 py-2 text-sm outline-none focus:border-zinc-600"
                    value={propertyType}
                    onChange={(e) => setPropertyType(e.target.value)}
                  >
                    <option value="">Select</option>
                    {propertyTypeOptions.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: PLAN */}
        {step === 4 && (
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
                      setNumberCleanings(e.target.value);
                      setExtras({});
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
        )}

        {/* STEP 5: SCHEDULE + EXTRAS */}
        {step === 5 && (
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
        )}

        {/* ✅ STEP 6 */}
        {step === 6 && (
          <div className="mt-6 space-y-4">
            <div className="rounded-xl border border-zinc-800 bg-black/30 p-4">
              <div className="text-sm font-semibold">ADDITIONAL INSTRUCTIONS</div>
              <p className="mt-2 text-sm text-zinc-400">
                Tell us any details that are important for the Duo0 who will be performing the cleaning.
              </p>

              <div className="mt-4 space-y-4">
                <div>
                  <label className="text-sm text-zinc-300">Cleaning instructions *</label>
                  <textarea
                    className="mt-1 w-full rounded-xl border border-zinc-800 bg-black/40 px-3 py-2 text-sm outline-none focus:border-zinc-600"
                    rows={3}
                    value={cleaningInstructions}
                    onChange={(e) => setCleaningInstructions(e.target.value)}
                    placeholder="Write any important notes…"
                  />
                </div>

                <div>
                  <label className="text-sm text-zinc-300">Favorite Duo0</label>
                  <input
                    className="mt-1 w-full rounded-xl border border-zinc-800 bg-black/40 px-3 py-2 text-sm outline-none focus:border-zinc-600"
                    value={favoriteDuo}
                    onChange={(e) => setFavoriteDuo(e.target.value)}
                    placeholder="Optional"
                  />
                </div>

                <div>
                  <label className="text-sm text-zinc-300">Type of service to be performed *</label>
                  <select
                    className="mt-1 w-full rounded-xl border border-zinc-800 bg-black/40 px-3 py-2 text-sm outline-none focus:border-zinc-600"
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value)}
                  >
                    <option value="">Choose</option>
                    {serviceTypeOptions.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer buttons */}
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={goBack}
            disabled={step === 1}
            className="rounded-xl border border-zinc-700 px-4 py-2 text-sm disabled:opacity-50"
          >
            {TEXT.back}
          </button>

          {step < 6 ? (
            <button
              type="button"
              onClick={goNext}
              disabled={
                (step === 1 && !canNextStep1()) ||
                (step === 2 && !canNextStep2()) ||
                (step === 3 && !canNextStep3()) ||
                (step === 4 && !canNextStep4()) ||
                (step === 5 && !canNextStep5())
              }
              className="ml-auto rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-zinc-200 disabled:opacity-60"
            >
              {TEXT.next}
            </button>
          ) : (
            <button
              type="button"
              onClick={submitAll}
              disabled={!canSubmitStep6() || saving}
              className="ml-auto rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-zinc-200 disabled:opacity-60"
            >
              {saving ? "Saving..." : TEXT.submit}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
