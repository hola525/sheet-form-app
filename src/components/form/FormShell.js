// ✅ FILE: app/duo/FormShell.js
"use client";

import { useEffect, useMemo, useRef, useState } from "react";

// ✅ Step components (UI only)
import Step1UserType from "./steps/Step1UserType";
import Step2Email from "./steps/Step2Email";
import Step3Address from "./steps/Step3Address";
import Step4Plan from "./steps/Step4Plan";
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
    Córdoba: [
      "Córdoba city (inside the ring road)",
      "Córdoba city (outside the ring road)",
      "Carlos Paz",
      "Malagueño",
      "Saldán",
      "Villa Allende",
    ],
    Mendoza: ["Mendoza City"],
    "Santa Fé": ["Santa Fé City", "qwdeqw"],
  },
  propertyTypes: ["House", "Apartment", "Office", "Commercial", "Airbnb"],
  durationHours: ["1", "2", "3", "4"],
  numberCleanings: ["1", "2", "4", "8", "12"],
  extrasCols: [
    "Nothing",
    "Basic Kit",
    "Hydro-lavator",
    "Ladder",
    "Extensible",
    "Extension",
    "Hose",
  ],
  serviceTypes: [
    "Completion of Work",
    "Pre/post move-in cleaning",
    "Deep cleaning",
    "Periodic cleaning",
    "Airbnb Check in/out",
  ],
};

// Helpers for comma-separated schedule fields
function splitCSV_(s) {
  return String(s || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}
function joinCSV_(arr) {
  return (arr || [])
    .map((x) => String(x || "").trim())
    .filter(Boolean)
    .join(", ");
}

export default function FormShell() {
  // =========================================================
  // STEP FLOW STATE
  // Steps: 1,2,3,4,5(Additional)
  // =========================================================
  const [step, setStep] = useState(1);

  // Step 1
  const [userType, setUserType] = useState(""); // "new" | "registered"

  // Step 2
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [action, setAction] = useState(""); // "hire" | "plans"

  // ✅ Registered plans flow
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [modifyAction, setModifyAction] = useState("");

  // Step 3 - Address
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [street, setStreet] = useState("");
  const [details, setDetails] = useState("");
  const [propertyType, setPropertyType] = useState("");

  // Step 4 - Plan + Schedule + Extras
  const [durationHours, setDurationHours] = useState("");
  const [numberCleanings, setNumberCleanings] = useState("");
  const [autoRenew, setAutoRenew] = useState("");

  // ✅ NEW schedule state (per cleaning)
  const [scheduleDates, setScheduleDates] = useState([]); // ["2026-01-10", ...]
  const [scheduleTimes, setScheduleTimes] = useState([]); // ["10:00", ...]
  const [extrasByCleaning, setExtrasByCleaning] = useState({}); // { "Cleaning 1": ["Nothing"], ... }

  // (keep legacy fields so we don’t break existing update/prefill logic)
  const [date, setDate] = useState(""); // comma string
  const [time, setTime] = useState(""); // comma string
  const [timeWindow, setTimeWindow] = useState(""); // keep for compatibility
  const [extras, setExtras] = useState({}); // legacy map

  // Final step
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
    citiesByProvince: {},
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
            serviceTypes: data.serviceTypes || [],
          });
        }
      } catch (e) {
        // silent fallback
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
  const renewOptions = cfg.renewPlans.length ? cfg.renewPlans : ["Yes", "No"];
  const serviceTypeOptions = cfg.serviceTypes.length ? cfg.serviceTypes : OPTIONS.serviceTypes;

  const extrasCheckboxOptions = cfg.extrasCols.length ? cfg.extrasCols : OPTIONS.extrasCols;

  const cityOptions = useMemo(() => {
    if (!province) return [];
    const dynamic = cfg.citiesByProvince?.[province];
    if (Array.isArray(dynamic) && dynamic.length) return dynamic;
    return OPTIONS.cities[province] || [];
  }, [province, cfg.citiesByProvince]);

  // =========================================================
  // Derived: cleaning labels
  // =========================================================
  const cleaningLabels = useMemo(() => {
    const n = Number(numberCleanings || 0);
    if (!n) return [];
    return Array.from({ length: Math.min(n, 12) }, (_, i) => `Cleaning ${i + 1}`);
  }, [numberCleanings]);

  // =========================================================
  // VALIDATION
  // =========================================================
  function canNextStep1() {
    return userType === "new" || userType === "registered";
  }

  function canNextStep2() {
    if (!email.trim()) return false;

    if (userType === "new") return fullName.trim() && phone.trim();

    if (userType === "registered") {
      if (action === "hire") return true;
      if (action === "plans") return !!selectedPlanId && !!modifyAction;
      return false;
    }
    return false;
  }

  function canNextStep3() {
    return province && city && street.trim() && details.trim() && propertyType;
  }

  function canNextStep4() {
    if (!(durationHours && numberCleanings && renewOptions.includes(autoRenew))) return false;

    const n = Number(numberCleanings || 0);
    if (!n) return false;

    for (let i = 0; i < n; i++) {
      const d = scheduleDates[i];
      const t = scheduleTimes[i];
      if (!d || !t) return false;

      const key = `Cleaning ${i + 1}`;
      const selected = extrasByCleaning[key] || [];
      if (!Array.isArray(selected) || selected.length === 0) return false;
    }

    return true;
  }

  function canSubmitFinal() {
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

  // ✅ Prefill (keep compatible; accepts forced id so Step2 can instantly jump)
  function prefillFromSelectedPlan_(forcedId) {
    const id = forcedId || selectedPlanId;
    if (!id) return;

    const plan = plans.find((p) => p.id === id);
    if (!plan) return;

    // Address
    setProvince(plan["province"] || "");
    setCity(plan["city/town"] || "");
    setStreet(plan["street/number"] || "");
    setDetails(plan["property details"] || "");
    setPropertyType(plan["property type"] || "");

    // Plan
    setDurationHours(plan["duration hours"] || "");
    setNumberCleanings(plan["number of cleanings"] || "");
    setAutoRenew(plan["auto renew"] || "");

    // Legacy schedule strings (comma)
    const dStr = plan["schedule date"] || "";
    const tStr = plan["schedule time"] || "";
    setDate(dStr);
    setTime(tStr);
    setTimeWindow(plan["time window"] || "");

    // NEW arrays from CSV
    setScheduleDates(splitCSV_(dStr));
    setScheduleTimes(splitCSV_(tStr));

    // Extras JSON
    try {
      const ex = plan["extras (json)"] ? JSON.parse(plan["extras (json)"]) : {};
      setExtras(ex && typeof ex === "object" ? ex : {});

      const mapped = {};
      Object.keys(ex || {}).forEach((k) => {
        const v = ex[k];
        if (Array.isArray(v)) mapped[k] = v;
        else if (typeof v === "string" && v.trim()) mapped[k] = [v.trim()];
      });
      setExtrasByCleaning(mapped);
    } catch (e) {
      setExtras({});
      setExtrasByCleaning({});
    }

    // Additional
    setCleaningInstructions(plan["cleaning instructions"] || "");
    setFavoriteDuo(plan["favorite duo0"] || "");
    setServiceType(plan["type of service to be performed"] || "");
  }

  // ✅ Instant jump handler (called by Step2 3-dots menu)
  // IMPORTANT: This must be in FormShell so it can change steps.
  function onPlanActionSelect_(planId, actionKey) {
    setAction("plans");              // keep flow
    setSelectedPlanId(planId);       // set plan
    setModifyAction(actionKey);      // set action

    // Prefill first (so next screens show correct data)
    prefillFromSelectedPlan_(planId);

    // Jump instantly
    if (actionKey === "address") return setStep(3);
    if (actionKey === "plan") return setStep(4);
    if (actionKey === "schedule") return setStep(4);
    if (actionKey === "additional") return setStep(5);
  }

  // ✅ Update existing row
  async function updateExistingPlan(updateMode) {
    setMsg("");
    setSaving(true);

    try {
      const scheduleDateCSV = joinCSV_(scheduleDates);
      const scheduleTimeCSV = joinCSV_(scheduleTimes);

      const payload = {
        address: { province, city, street, details, propertyType },
        plan: { durationHours, numberCleanings, autoRenew },
        schedule: {
          date: scheduleDateCSV,
          time: scheduleTimeCSV,
          timeWindow: timeWindow || "",
          extras: extrasByCleaning,
        },
        additional: { cleaningInstructions, favoriteDuo, serviceType },
      };

      const res = await fetch("/api/duo/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedPlanId, updateMode, payload }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data?.error || "Update failed");

      setMsg("✅ Plan updated successfully!");
      resetAll_();
    } catch (e) {
      setMsg(e.message);
    } finally {
      setSaving(false);
    }
  }

  // ✅ Submit (New User / Registered hire flow)
  async function submitAll() {
    setMsg("");
    setSaving(true);

    try {
      const scheduleDateCSV = joinCSV_(scheduleDates);
      const scheduleTimeCSV = joinCSV_(scheduleTimes);

      const payload = {
        userType: userType === "new" ? "New" : "Registered",
        flowAction:
          action === "hire"
            ? "Hire cleaning services"
            : action === "plans"
            ? "View Active Plans"
            : "",

        email,
        fullName: userType === "new" ? fullName : "",
        phone: userType === "new" ? phone : "",

        address: { province, city, street, details, propertyType },
        plan: { durationHours, numberCleanings, autoRenew },

        schedule: {
          date: scheduleDateCSV,
          time: scheduleTimeCSV,
          timeWindow: timeWindow || "",
          extras: extrasByCleaning,
        },

        additional: { cleaningInstructions, favoriteDuo, serviceType },
      };

      const res = await fetch("/api/duo/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data?.error || "Submit failed");

      setMsg("✅ Saved to Google Sheet!");
      resetAll_();
    } catch (e) {
      setMsg(e.message);
    } finally {
      setSaving(false);
    }
  }

  function resetAll_() {
    setStep(1);

    setUserType("");
    setEmail("");
    setFullName("");
    setPhone("");
    setAction("");

    setSelectedPlanId("");
    setModifyAction("");

    setProvince("");
    setCity("");
    setStreet("");
    setDetails("");
    setPropertyType("");

    setDurationHours("");
    setNumberCleanings("");
    setAutoRenew("");

    setScheduleDates([]);
    setScheduleTimes([]);
    setExtrasByCleaning({});

    setDate("");
    setTime("");
    setTimeWindow("");
    setExtras({});

    setCleaningInstructions("");
    setFavoriteDuo("");
    setServiceType("");

    setPlans([]);
  }

  // =========================================================
  // NAVIGATION (same behavior)
  // =========================================================
  function goNext() {
    setMsg("");

    if (step === 1 && canNextStep1()) return setStep(2);

    if (step === 2 && canNextStep2()) {
      if (userType === "registered" && action === "plans") {
        prefillFromSelectedPlan_();

        if (modifyAction === "address") return setStep(3);
        if (modifyAction === "plan") return setStep(4);
        if (modifyAction === "schedule") return setStep(4);
        if (modifyAction === "additional") return setStep(5);
        return;
      }
      return setStep(3);
    }

    if (step === 3 && canNextStep3()) return setStep(4);
    if (step === 4 && canNextStep4()) return setStep(5);
  }

  function goBack() {
    setMsg("");
    if (step === 2) return setStep(1);
    if (step === 3) return setStep(2);
    if (step === 4) return setStep(3);
    if (step === 5) return setStep(4);
  }

  function onFinalSubmitClick() {
    if (userType === "registered" && action === "plans") return updateExistingPlan("all");
    return submitAll();
  }

  function onChangeNumberCleanings_() {
    setScheduleDates([]);
    setScheduleTimes([]);
    setExtrasByCleaning({});
    setDate("");
    setTime("");
    setExtras({});
  }

  // =========================================================
  // ✅ UI: Bigger + more professional + responsive
  // =========================================================
  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-zinc-700 to-zinc-800 text-white px-4 py-10 sm:px-6">
      <div className="mx-auto w-full max-w-5xl min-h-[800px]">
        <div className="rounded-3xl border border-zinc-700/60 bg-zinc-950/40 shadow-xl backdrop-blur px-5 py-6 sm:px-8 sm:py-8 min-h-[550px]">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
                {TEXT.title}
              </h1>
              <p className="mt-1 text-base sm:text-lg text-zinc-300">
                {TEXT.step(step)}
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-700/60 bg-black/20 px-3 py-2 text-sm sm:text-base text-zinc-200">
              Progress: <span className="font-semibold">{step}</span>/5
            </div>
          </div>

          {/* Message */}
          {msg ? (
            <div className="mt-5 rounded-2xl border border-zinc-700/60 bg-black/30 px-4 py-3 text-sm sm:text-base">
              {msg}
            </div>
          ) : null}

          {/* Steps */}
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
              fetchPlans={fetchPlans} // used by Step2 auto-fetch + optional manual retry
              selectedPlanId={selectedPlanId}
              setSelectedPlanId={setSelectedPlanId}
              modifyAction={modifyAction}
              setModifyAction={setModifyAction}
              onPlanActionSelect={onPlanActionSelect_} // ✅ 3-dots -> instant jump
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
              onChangeNumberCleanings={onChangeNumberCleanings_}
              cleaningLabels={cleaningLabels}
              scheduleDates={scheduleDates}
              setScheduleDates={setScheduleDates}
              scheduleTimes={scheduleTimes}
              setScheduleTimes={setScheduleTimes}
              extrasByCleaning={extrasByCleaning}
              setExtrasByCleaning={setExtrasByCleaning}
              extrasCheckboxOptions={extrasCheckboxOptions}
            />
          )}

          {step === 5 && (
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
          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={goBack}
              disabled={step === 1}
              className="w-full sm:w-auto rounded-2xl border border-zinc-700/70 bg-black/20 px-5 py-3 text-base font-medium disabled:opacity-50 cursor-pointer"
            >
              {TEXT.back}
            </button>

            {step < 5 ? (
              <button
                type="button"
                onClick={goNext}
                disabled={
                  (step === 1 && !canNextStep1()) ||
                  (step === 2 && !canNextStep2()) ||
                  (step === 3 && !canNextStep3()) ||
                  (step === 4 && !canNextStep4())
                }
                className="w-full sm:w-auto sm:ml-auto rounded-2xl bg-white px-6 py-3 text-base font-semibold text-black hover:bg-zinc-200 disabled:opacity-60 cursor-pointer"
              >
                {TEXT.next}
              </button>
            ) : (
              <button
                type="button"
                onClick={onFinalSubmitClick}
                disabled={!canSubmitFinal() || saving}
                className="w-full sm:w-auto sm:ml-auto rounded-2xl bg-white px-6 py-3 text-base font-semibold text-black hover:bg-zinc-200 disabled:opacity-60 cursor-pointer"
              >
                {saving ? "Saving..." : userType === "registered" && action === "plans" ? "Update" : TEXT.submit}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
