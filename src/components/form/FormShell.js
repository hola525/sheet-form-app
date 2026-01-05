// ✅ FILE: app/duo/FormShell.js
"use client";

import { useEffect, useMemo, useState } from "react";

// ✅ Step components (UI only)
import Step1UserType from "./steps/Step1UserType";
import Step2Email from "./steps/Step2Email";
import Step3Address from "./steps/Step3Address";
import Step4Plan from "./steps/Step4Plan";
import Step5Schedule from "./steps/Step5Schedule";
import Step6Additional from "./steps/Step6Additional";

const TEXT = {
  title: "Duo0",
  step: (n) => `Step ${n}`,
  next: "Next",
  back: "Back",
  submit: "Submit",
};

// ✅ fallback options (used when sheet/API is empty or request fails)
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
    "Santa Fé": ["Santa Fé City", "qwdeqw"],
  },
  propertyTypes: ["House", "Apartment", "Office", "Commercial", "Airbnb"],
  durationHours: ["1", "2", "3", "4"],
  numberCleanings: ["1", "2", "4", "8", "12"],
  extrasCols: ["Nothing", "Basic Kit", "Hydro-lavator", "Ladder", "Extensible", "Extension", "Hose"],
  serviceTypes: [
    "Completion of Work",
    "Pre/post move-in cleaning",
    "Deep cleaning",
    "Periodic cleaning",
    "Airbnb Check in/out",
  ],
};

export default function FormShell() {
  // =========================================================
  // STEP FLOW STATE (brain stays here)
  // =========================================================
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
  const [extras, setExtras] = useState({}); // rowKey => option

  // Step 6 - Additional instructions + service type
  const [cleaningInstructions, setCleaningInstructions] = useState("");
  const [favoriteDuo, setFavoriteDuo] = useState("");
  const [serviceType, setServiceType] = useState("");

  // Registered flow - plans display
  const [plansLoading, setPlansLoading] = useState(false);
  const [plans, setPlans] = useState([]);

  // UI status
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  // =========================================================
  // CONFIG FROM GOOGLE SHEET (Config tab)
  // =========================================================
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
    citiesByProvince: {}, // { "Province": ["City 1", ...] }
    serviceTypes: [],
  });

  useEffect(() => {
    // ✅ Load config once on mount
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
            serviceTypes: data.serviceTypes || [],
          });
        }
      } catch (e) {
        // ✅ Silent fallback: OPTIONS will still work
      }
    }

    load();
  }, []);

  // =========================================================
  // OPTIONS (cfg first, then fallback OPTIONS)
  // =========================================================
  const provinceOptions = cfg.provinces.length ? cfg.provinces : OPTIONS.provinces;
  const propertyTypeOptions = cfg.propertyTypes.length ? cfg.propertyTypes : OPTIONS.propertyTypes;
  const durationOptions = cfg.durationHours.length ? cfg.durationHours : OPTIONS.durationHours;
  const numberCleaningsOptions = cfg.numberOfCleanings.length ? cfg.numberOfCleanings : OPTIONS.numberCleanings;
  const extrasColOptions = cfg.extrasCols.length ? cfg.extrasCols : OPTIONS.extrasCols;
  const renewOptions = cfg.renewPlans.length ? cfg.renewPlans : ["Yes", "No"];
  const serviceTypeOptions = cfg.serviceTypes.length ? cfg.serviceTypes : OPTIONS.serviceTypes;

  // ✅ City/Town dropdown depends on selected Province
  const cityOptions = useMemo(() => {
    if (!province) return [];
    const dynamic = cfg.citiesByProvince?.[province];
    if (Array.isArray(dynamic) && dynamic.length) return dynamic;
    return OPTIONS.cities[province] || [];
  }, [province, cfg.citiesByProvince]);

  // ✅ Extras grid rows depend on numberCleanings
  const rowKeys = useMemo(() => {
    const n = Number(numberCleanings || 0);
    const base = ["None"];
    if (!n) return base;
    const rows = Array.from({ length: Math.min(n, 12) }, (_, i) => `Cleaning ${i + 1}`);
    return [...base, ...rows, "All cleanings"];
  }, [numberCleanings]);

  // =========================================================
  // VALIDATION (no behavior change)
  // =========================================================
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
    // ✅ Keep required: cleaningInstructions + serviceType
    if (!cleaningInstructions.trim()) return false;
    if (!serviceType) return false;
    return true;
  }

  // =========================================================
  // API HELPERS
  // =========================================================
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
      // ✅ Payload is same, we only add "additional" object
      const payload = {
        userType: userType === "new" ? "New" : "Registered",
        flowAction: action === "hire" ? "Hire cleaning services" : action === "plans" ? "View Active Plans" : "",

        email,
        fullName: userType === "new" ? fullName : "",
        phone: userType === "new" ? phone : "",

        address: { province, city, street, details, propertyType },
        plan: { durationHours, numberCleanings, autoRenew },
        schedule: { date, time, timeWindow, extras },

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

      // ✅ Reset everything (same behavior)
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

  // =========================================================
  // NAVIGATION (no behavior change)
  // =========================================================
  function goNext() {
    setMsg("");

    if (step === 1 && canNextStep1()) return setStep(2);

    if (step === 2 && canNextStep2()) {
      // ✅ Registered flow: "View Active Plans" stays on step 2
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
        {/* Header */}
        <h1 className="text-xl font-semibold">{TEXT.title}</h1>
        <p className="mt-1 text-sm text-zinc-400">{TEXT.step(step)}</p>

        {/* Message */}
        {msg ? (
          <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950/50 p-3 text-sm">{msg}</div>
        ) : null}

        {/* ✅ Steps (UI components only) */}
        {step === 1 && <Step1UserType userType={userType} setUserType={setUserType} />}

        {step === 2 && (
          <Step2Email
            userType={userType}
            email={email}
            setEmail={setEmail}
            fullName={fullName}
            setFullName={setFullName}
            phone={phone}
            setPhone={setPhone}
            action={action}
            setAction={setAction}
            plansLoading={plansLoading}
            plans={plans}
            fetchPlans={fetchPlans}
          />
        )}

        {step === 3 && (
          <Step3Address
            province={province}
            setProvince={setProvince}
            city={city}
            setCity={setCity}
            street={street}
            setStreet={setStreet}
            details={details}
            setDetails={setDetails}
            propertyType={propertyType}
            setPropertyType={setPropertyType}
            provinceOptions={provinceOptions}
            cityOptions={cityOptions}
            propertyTypeOptions={propertyTypeOptions}
          />
        )}

        {step === 4 && (
          <Step4Plan
            durationHours={durationHours}
            setDurationHours={setDurationHours}
            numberCleanings={numberCleanings}
            setNumberCleanings={setNumberCleanings}
            autoRenew={autoRenew}
            setAutoRenew={setAutoRenew}
            durationOptions={durationOptions}
            numberCleaningsOptions={numberCleaningsOptions}
            renewOptions={renewOptions}
            onChangeNumberCleanings={() => setExtras({})} // ✅ same behavior as before
          />
        )}

        {step === 5 && (
          <Step5Schedule
            date={date}
            setDate={setDate}
            time={time}
            setTime={setTime}
            timeWindow={timeWindow}
            setTimeWindow={setTimeWindow}
            rowKeys={rowKeys}
            extras={extras}
            setExtras={setExtras}
            extrasColOptions={extrasColOptions}
          />
        )}

        {step === 6 && (
          <Step6Additional
            cleaningInstructions={cleaningInstructions}
            setCleaningInstructions={setCleaningInstructions}
            favoriteDuo={favoriteDuo}
            setFavoriteDuo={setFavoriteDuo}
            serviceType={serviceType}
            setServiceType={setServiceType}
            serviceTypeOptions={serviceTypeOptions}
          />
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
