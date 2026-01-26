// ✅ FILE: app/duo/FormShell.js
"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";

import Step1EmailLookup from "./steps/Step1EmailLookup";
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

function isValidEmail_(value) {
  const v = String(value || "").trim();
  if (!v) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
}
function isValidPhone_(value) {
  const v = String(value || "").trim();
  if (!v) return false;
  const digits = v.replace(/[^\d]/g, "");
  return digits.length >= 7 && digits.length <= 15;
}

function LoadingOverlay({ show, label }) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm rounded-3xl border border-zinc-700/60 bg-zinc-950/80 shadow-2xl p-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-zinc-700/60 bg-black/30">
          <Loader2 className="h-7 w-7 animate-spin text-white" />
        </div>
        <p className="mt-4 text-base sm:text-lg font-semibold text-white">
          {label || "Loading..."}
        </p>
        <p className="mt-1 text-sm text-zinc-300">Please wait a moment</p>
      </div>
    </div>
  );
}

export default function FormShell() {
  const [step, setStep] = useState(1);

  // ✅ NEW FLOW: Step 1 is email-only, userType decided automatically
  const [userType, setUserType] = useState(""); // "new" | "registered"

  // Step 1/2
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  // Keep these to avoid touching your existing logic
  const [action, setAction] = useState(""); // "hire" | "plans"

  // Registered plans flow
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [modifyAction, setModifyAction] = useState(""); // "address" | "plan" | "additional"

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

  const [scheduleDates, setScheduleDates] = useState([]);
  const [scheduleTimes, setScheduleTimes] = useState([]);
  const [extrasByCleaning, setExtrasByCleaning] = useState({});

  // legacy fields (kept safe)
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [timeWindow, setTimeWindow] = useState("");
  const [extras, setExtras] = useState({});

  // Step 5
  const [cleaningInstructions, setCleaningInstructions] = useState("");
  const [favoriteDuo, setFavoriteDuo] = useState("");
  const [serviceType, setServiceType] = useState("");

  // Plans display
  const [plansLoading, setPlansLoading] = useState(false);
  const [plans, setPlans] = useState([]);

  // UI status
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [touchedNext, setTouchedNext] = useState(0);
  // ✅ NEW — original plan snapshot (for strict edit rules)
  const [origPlanN, setOrigPlanN] = useState(0);
  const [origPlanDates, setOrigPlanDates] = useState([]); // array of YYYY-MM-DD
  const [planLockedAll, setPlanLockedAll] = useState(false);

  // Config
  const [cfg, setCfg] = useState({
    provinces: [],
    propertyTypes: [],
    durationHours: [],
    numberOfCleanings: [],
    renewPlans: [],
    extrasCols: [],
    citiesByProvince: {},
    serviceTypes: [],
  });
  // ✅ YYYY-MM-DD in Argentina timezone (stable for your Argentina client)
  function todayISOInArgentina_() {
    const fmt = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Argentina/Buenos_Aires",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return fmt.format(new Date()); // "YYYY-MM-DD"
  }

  function areAllDatesPassed_(datesArr, n) {
    const today = todayISOInArgentina_();
    const take = (Array.isArray(datesArr) ? datesArr : []).slice(0, n);
    if (!n || take.length < n) return false;
    // must have all dates and all must be < today
    return take.every(
      (d) => String(d || "").trim() && String(d).trim() < today
    );
  }

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/duo/config");
        const data = await res.json();
        if (data.ok) {
          setCfg({
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
      } catch (e) {}
    }
    load();
  }, []);

  useEffect(() => setTouchedNext(0), [step]);

  // Options
  const provinceOptions = cfg.provinces.length
    ? cfg.provinces
    : OPTIONS.provinces;
  const propertyTypeOptions = cfg.propertyTypes.length
    ? cfg.propertyTypes
    : OPTIONS.propertyTypes;
  const durationOptions = cfg.durationHours.length
    ? cfg.durationHours
    : OPTIONS.durationHours;
  const numberCleaningsOptions = cfg.numberOfCleanings.length
    ? cfg.numberOfCleanings
    : OPTIONS.numberCleanings;
  const renewOptions = cfg.renewPlans.length ? cfg.renewPlans : ["Yes", "No"];
  const serviceTypeOptions = cfg.serviceTypes.length
    ? cfg.serviceTypes
    : OPTIONS.serviceTypes;
  const extrasCheckboxOptions = cfg.extrasCols.length
    ? cfg.extrasCols
    : OPTIONS.extrasCols;

  const cityOptions = useMemo(() => {
    if (!province) return [];
    const dynamic = cfg.citiesByProvince?.[province];
    if (Array.isArray(dynamic) && dynamic.length) return dynamic;
    return OPTIONS.cities[province] || [];
  }, [province, cfg.citiesByProvince]);

  const cleaningLabels = useMemo(() => {
    const n = Number(numberCleanings || 0);
    if (!n) return [];
    return Array.from(
      { length: Math.min(n, 12) },
      (_, i) => `Cleaning ${i + 1}`
    );
  }, [numberCleanings]);

  const isRegisteredPlansFlow = userType === "registered" && action === "plans";

  function getUpdateModeForCurrentStep_() {
    if (!isRegisteredPlansFlow) return "";
    if (!modifyAction) return "";

    if (step === 3 && modifyAction === "address") return "address";
    if (step === 4 && modifyAction === "plan") return "plan_full";
    if (step === 5 && modifyAction === "additional") return "additional";
    return "";
  }

  // ✅ Step 1 validation (email only)
  function canNextStep1() {
    return !!email.trim() && isValidEmail_(email);
  }

  function canNextStep2() {
    if (!email.trim()) return false;
    if (!isValidEmail_(email)) return false;

    if (userType === "new")
      return fullName.trim() && phone.trim() && isValidPhone_(phone);

    if (userType === "registered") {
      // user will typically choose from ⋯, but keep Next supported
      return !!selectedPlanId && !!modifyAction;
    }
    return false;
  }

  function canNextStep3() {
    return province && city && street.trim() && details.trim() && propertyType;
  }

  function canNextStep4() {
    if (!(durationHours && numberCleanings && renewOptions.includes(autoRenew)))
      return false;

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

  function getStepError_(stepNum) {
    if (stepNum === 1) {
      if (!email.trim()) return "Please enter your email address.";
      if (!isValidEmail_(email))
        return "Please enter a valid email address (example: name@email.com).";
      return "";
    }

    if (stepNum === 2) {
      if (!email.trim()) return "Please enter your email address.";
      if (!isValidEmail_(email))
        return "Please enter a valid email address (example: name@email.com).";

      if (userType === "new") {
        if (!fullName.trim()) return "Please enter your Name and Surname.";
        if (!phone.trim()) return "Please enter your phone number.";
        if (!isValidPhone_(phone)) return "Please enter a valid phone number.";
        return "";
      }

      if (userType === "registered") {
        if (!selectedPlanId)
          return "Please select a plan first (and pick an action).";
        if (!modifyAction)
          return "Please choose what you want to change for the selected plan.";
        return "";
      }

      return "Please continue from Step 1.";
    }

    if (stepNum === 3) {
      if (!province) return "Please select a Province.";
      if (!city) return "Please select a City/Town.";
      if (!street.trim()) return "Please enter Street/Number.";
      if (!details.trim()) return "Please enter Property details.";
      if (!propertyType) return "Please select Property Type.";
      return "";
    }

    if (stepNum === 4) {
      if (!durationHours) return "Please select Duration of each cleaning.";
      if (!numberCleanings) return "Please select Number of Cleanings.";
      if (!renewOptions.includes(autoRenew))
        return "Please choose Auto renew (Yes/No).";

      const n = Number(numberCleanings || 0);
      if (!n) return "Please select Number of Cleanings.";

      for (let i = 0; i < n; i++) {
        const label = `Cleaning ${i + 1}`;
        const d = scheduleDates?.[i];
        const t = scheduleTimes?.[i];
        const ex = extrasByCleaning?.[label] || [];

        if (!d) return `Please select Date for ${label}.`;
        if (!t) return `Please select Time for ${label}.`;
        if (!Array.isArray(ex) || ex.length === 0)
          return `Please select Extras for ${label} (choose “Nothing” if none).`;
      }
      return "";
    }

    if (stepNum === 5) {
      if (!cleaningInstructions.trim())
        return "Please fill Cleaning instructions.";
      if (!serviceType) return "Please select Type of service to be performed.";
      return "";
    }

    return "";
  }

  // API
  async function fetchPlans() {
    setMsg("");
    setPlans([]);
    setPlansLoading(true);

    try {
      const res = await fetch(
        `/api/duo/plans?email=${encodeURIComponent(email.trim())}`
      );
      const data = await res.json();
      if (!res.ok || !data.ok)
        throw new Error(data?.error || "Failed to load plans");
      setPlans(data.plans || []);
      return data.plans || [];
    } catch (e) {
      setMsg(e.message);
      return [];
    } finally {
      setPlansLoading(false);
    }
  }

  // ✅ Step1: decide flow automatically
  async function lookupEmailAndRoute_() {
    setMsg("");
    setTouchedNext(1);

    const err = getStepError_(1);
    if (err) {
      setMsg(`❌ ${err}`);
      return;
    }

    const foundPlans = await fetchPlans();

    if (Array.isArray(foundPlans) && foundPlans.length > 0) {
      // Registered path
      setUserType("registered");
      setAction("plans");
      setSelectedPlanId("");
      setModifyAction("");
      setStep(2);
      return;
    }

    // New user path
    setUserType("new");
    setAction("hire");
    setSelectedPlanId("");
    setModifyAction("");
    setFullName("");
    setPhone("");
    setStep(2);
  }

  function prefillFromSelectedPlan_(forcedId) {
    const id = forcedId || selectedPlanId;
    if (!id) return;

    const plan = plans.find((p) => p.id === id);
    if (!plan) return;

    setProvince(plan["province"] || "");
    setCity(plan["city/town"] || "");
    setStreet(plan["street/number"] || "");
    setDetails(plan["property details"] || "");
    setPropertyType(plan["property type"] || "");

    setDurationHours(plan["duration hours"] || "");
    setNumberCleanings(plan["number of cleanings"] || "");
    setAutoRenew(plan["auto renew"] || "");

    const dStr = plan["schedule date"] || "";
    const tStr = plan["schedule time"] || "";
    setDate(dStr);
    setTime(tStr);
    setTimeWindow(plan["time window"] || "");

    setScheduleDates(splitCSV_(dStr));
    setScheduleTimes(splitCSV_(tStr));
    // ✅ store original plan values for strict edit rules
    const existingN = Number(plan["number of cleanings"] || 0) || 0;
    const originalDatesArr = splitCSV_(dStr);

    setOrigPlanN(existingN);
    setOrigPlanDates(originalDatesArr);

    // ✅ lock the whole Step 4 if ALL cleanings are passed
    setPlanLockedAll(areAllDatesPassed_(originalDatesArr, existingN));

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

    setCleaningInstructions(plan["cleaning instructions"] || "");
    setFavoriteDuo(plan["favorite duo0"] || "");
    setServiceType(plan["type of service to be performed"] || "");
  }

  function onPlanActionSelect_(planId, actionKey) {
    setAction("plans");
    setUserType("registered");
    setSelectedPlanId(planId);
    setModifyAction(actionKey);

    prefillFromSelectedPlan_(planId);

    if (actionKey === "address") return setStep(3);
    if (actionKey === "plan") return setStep(4);
    if (actionKey === "additional") return setStep(5);
  }

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

      if (isRegisteredPlansFlow && updateMode && updateMode !== "all") {
        setMsg("✅ Updated successfully!");
        setStep(2);
        setSelectedPlanId("");
        setModifyAction("");
        await fetchPlans();
        return;
      }

      setMsg("✅ Plan updated successfully!");
      resetAll_();
    } catch (e) {
      setMsg(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function submitAll() {
    setMsg("");
    setSaving(true);

    try {
      const scheduleDateCSV = joinCSV_(scheduleDates);
      const scheduleTimeCSV = joinCSV_(scheduleTimes);

      const payload = {
        userType: userType === "new" ? "New" : "Registered",
        flowAction:
          userType === "new" ? "Hire cleaning services" : "View Active Plans",
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

  // Navigation
  async function goNext() {
    setMsg("");
    setTouchedNext(step);

    if (step === 1) {
      await lookupEmailAndRoute_();
      return;
    }

    const err = getStepError_(step);
    if (err) {
      setMsg(`❌ ${err}`);
      return;
    }

    if (step === 2 && canNextStep2()) {
      if (userType === "registered") {
        prefillFromSelectedPlan_();
        if (modifyAction === "address") return setStep(3);
        if (modifyAction === "plan") return setStep(4);
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

    if (isRegisteredPlansFlow && step !== 2 && modifyAction) {
      setStep(2);
      return;
    }

    if (step === 2) return setStep(1);
    if (step === 3) return setStep(2);
    if (step === 4) return setStep(3);
    if (step === 5) return setStep(4);
  }

  function onFinalSubmitClick() {
    setMsg("");
    setTouchedNext(step);

    const err = getStepError_(5);
    if (err) {
      setMsg(`❌ ${err}`);
      return;
    }

    if (userType === "registered" && action === "plans")
      return updateExistingPlan("all");
    return submitAll();
  }

  function onChangeNumberCleanings_(nextValue) {
    // This function is now used ONLY for Step 4 logic
    // It will behave strictly only when editing an existing plan (modifyAction === "plan")

    const isStrictEdit =
      userType === "registered" &&
      action === "plans" &&
      modifyAction === "plan";

    // ✅ NEW HIRE FLOW (or other flows): keep your old behavior
    if (!isStrictEdit) {
      setNumberCleanings(nextValue);
      setScheduleDates([]);
      setScheduleTimes([]);
      setExtrasByCleaning({});
      setDate("");
      setTime("");
      setExtras({});
      return;
    }

    // ✅ STRICT EDIT MODE (Modify contracted plan)
    if (planLockedAll) {
      setMsg("❌ This plan is locked because all cleanings have passed.");
      return;
    }

    const targetN = Number(nextValue || 0) || 0;

    // ✅ cannot reduce below original
    if (origPlanN && targetN < origPlanN) {
      setMsg(`❌ You cannot reduce number of cleanings below ${origPlanN}.`);
      return;
    }

    setMsg("");
    setNumberCleanings(nextValue);

    // ✅ preserve old dates/times, only extend for new cleanings
    setScheduleDates((prev) => {
      const cur = Array.isArray(prev) ? [...prev] : [];
      while (cur.length < targetN) cur.push("");
      return cur; // no truncation because reduction is blocked
    });

    setScheduleTimes((prev) => {
      const cur = Array.isArray(prev) ? [...prev] : [];
      while (cur.length < targetN) cur.push("");
      return cur;
    });

    // ✅ preserve old extras; new ones will be empty until user selects
    setExtrasByCleaning((prev) => {
      return { ...(prev || {}) };
    });
  }

  const updateMode = getUpdateModeForCurrentStep_();
  const showPartialUpdate = !!updateMode;

  function onUpdateClick_() {
    setMsg("");
    setTouchedNext(step);

    const err = getStepError_(step);
    if (err) {
      setMsg(`❌ ${err}`);
      return;
    }

    return updateExistingPlan(updateMode);
  }

  const isNextBlocked =
    (step === 1 && !canNextStep1()) ||
    (step === 2 && !canNextStep2()) ||
    (step === 3 && !canNextStep3()) ||
    (step === 4 && !canNextStep4());

  const isSubmitBlocked = !canSubmitFinal();
  const isUpdateBlocked = showPartialUpdate && !!getStepError_(step);

  // ✅ Registered -> Hire new cleaning (keep email, go Step2 new-user details)
  function startNewHireKeepEmail_() {
    setMsg("");
    setTouchedNext(0);

    setUserType("new");
    setAction("hire");

    setSelectedPlanId("");
    setModifyAction("");

    setFullName("");
    setPhone("");

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

    setStep(2);
  }

  const overlayLabel = saving
    ? "Saving your data..."
    : plansLoading
    ? "Loading plans..."
    : "Loading...";

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-zinc-700 to-zinc-800 text-white px-4 py-10 sm:px-6">
      <LoadingOverlay show={saving || plansLoading} label={overlayLabel} />

      <div className="mx-auto w-full max-w-5xl min-h-[800px]">
        <div className="rounded-3xl border border-zinc-700/60 bg-zinc-950/40 shadow-xl backdrop-blur px-5 py-6 sm:px-8 sm:py-8 min-h-[550px]">
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

          {msg ? (
            <div className="mt-5 rounded-2xl border border-zinc-700/60 bg-black/30 px-4 py-3 text-sm sm:text-base">
              {msg}
            </div>
          ) : null}

          {step === 1 && (
            <Step1EmailLookup
              email={email}
              setEmail={setEmail}
              touchedNext={touchedNext === 1}
            />
          )}

          {step === 2 && (
            <Step2Email
              userType={userType}
              email={email}
              setEmail={setEmail}
              fullName={fullName}
              setFullName={setFullName}
              phone={phone}
              setPhone={setPhone}
              plansLoading={plansLoading}
              plans={plans}
              fetchPlans={fetchPlans}
              selectedPlanId={selectedPlanId}
              setSelectedPlanId={setSelectedPlanId}
              modifyAction={modifyAction}
              setModifyAction={setModifyAction}
              onPlanActionSelect={onPlanActionSelect_}
              setMsg={setMsg}
              touchedNext={touchedNext === 2}
              onHireFromRegistered={startNewHireKeepEmail_}
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
              touchedNext={touchedNext}
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
              // ✅ IMPORTANT: we pass the strict handler (now expects nextValue)
              onChangeNumberCleanings={onChangeNumberCleanings_}
              cleaningLabels={cleaningLabels}
              scheduleDates={scheduleDates}
              setScheduleDates={setScheduleDates}
              scheduleTimes={scheduleTimes}
              setScheduleTimes={setScheduleTimes}
              extrasByCleaning={extrasByCleaning}
              setExtrasByCleaning={setExtrasByCleaning}
              extrasCheckboxOptions={extrasCheckboxOptions}
              // ✅ NEW
              planLockedAll={planLockedAll}
              origPlanN={origPlanN}
              touchedNext={touchedNext}
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
              touchedNext={touchedNext}
            />
          )}

          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={goBack}
              disabled={step === 1 || saving || plansLoading}
              className="w-full sm:w-auto rounded-2xl border border-zinc-700/70 bg-black/20 px-5 py-3 text-base font-medium disabled:opacity-50 cursor-pointer"
            >
              {TEXT.back}
            </button>

            {showPartialUpdate ? (
              <button
                type="button"
                onClick={onUpdateClick_}
                disabled={saving}
                aria-disabled={isUpdateBlocked || saving}
                className={[
                  "w-full sm:w-auto sm:ml-auto rounded-2xl bg-white px-6 py-3 text-base font-semibold text-black hover:bg-zinc-200 cursor-pointer",
                  isUpdateBlocked ? "opacity-60" : "",
                  saving ? "opacity-60" : "",
                ].join(" ")}
              >
                {saving ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Updating...
                  </span>
                ) : (
                  "Update"
                )}
              </button>
            ) : step < 5 ? (
              <button
                type="button"
                onClick={goNext}
                aria-disabled={isNextBlocked}
                className={[
                  "w-full sm:w-auto sm:ml-auto rounded-2xl bg-white px-6 py-3 text-base font-semibold text-black hover:bg-zinc-200 cursor-pointer",
                  isNextBlocked ? "opacity-60" : "",
                ].join(" ")}
              >
                {TEXT.next}
              </button>
            ) : (
              <button
                type="button"
                onClick={onFinalSubmitClick}
                disabled={saving}
                aria-disabled={isSubmitBlocked || saving}
                className={[
                  "w-full sm:w-auto sm:ml-auto rounded-2xl bg-white px-6 py-3 text-base font-semibold text-black hover:bg-zinc-200 cursor-pointer",
                  isSubmitBlocked ? "opacity-60" : "",
                  saving ? "opacity-60" : "",
                ].join(" ")}
              >
                {saving ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    {userType === "registered" && action === "plans"
                      ? "Updating..."
                      : "Saving..."}
                  </span>
                ) : userType === "registered" && action === "plans" ? (
                  "Update"
                ) : (
                  TEXT.submit
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
