import { NextResponse } from "next/server";
import { getSheetsClient } from "@/lib/googleSheet";

const SHEET_CONFIG = "Config";
const SHEET_PLAN = "Plan Prices";
const SHEET_EXTRAS = "Extra prices";
const SHEET_MOBILITY = "Mobility Costs";

function norm(s) {
  return String(s || "").trim().toLowerCase();
}

function uniq(arr) {
  return Array.from(
    new Set((arr || []).map((v) => String(v || "").trim()).filter(Boolean))
  );
}

function getColAny(headers, names) {
  const h = (headers || []).map(norm);
  for (const n of names) {
    const idx = h.indexOf(norm(n));
    if (idx >= 0) return idx;
  }
  return -1;
}

function parseMoney(value) {
  // handles: "$3,000" / "3000" / "3.000" / "  3000 "
  const raw = String(value || "").trim();
  if (!raw) return 0;
  const cleaned = raw
    .replace(/\$/g, "")
    .replace(/\s/g, "")
    .replace(/,/g, "")
    .replace(/\./g, ""); // if they used dots as thousands
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function splitCitiesCell(value) {
  const raw = String(value || "").trim();
  if (!raw) return [];
  return raw.split(",").map((x) => x.trim()).filter(Boolean);
}

async function readSheet_(sheets, spreadsheetId, sheetName) {
  const headerRes = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!1:1`,
  });
  const headers = (headerRes.data.values?.[0] || []).map(norm);

  const dataRes = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A2:ZZ`,
  });
  const rows = dataRes.data.values || [];

  return { headers, rows };
}

export async function GET() {
  try {
    const sheets = getSheetsClient();
    const spreadsheetId = process.env.SPREADSHEET_ID;

    // ---------------------------
    // 1) Config dropdowns
    // ---------------------------
    const { headers: cfgHeaders, rows: cfgRows } = await readSheet_(
      sheets,
      spreadsheetId,
      SHEET_CONFIG
    );

    const idxCategory = getColAny(cfgHeaders, ["Category"]);
    const idxDepartment = getColAny(cfgHeaders, ["Department"]);
    const idxPriority = getColAny(cfgHeaders, ["Priority"]);
    const idxStatus = getColAny(cfgHeaders, ["Status"]);
    const idxProvinces = getColAny(cfgHeaders, ["Provinces", "Province"]);

    const idxPropertyType = getColAny(cfgHeaders, ["PropertyType", "Property Type"]);
    const idxExtrasCols = getColAny(cfgHeaders, ["extrasCols", "Extras"]);
    const idxDurationHours = getColAny(cfgHeaders, ["DurationHours", "Duration Hours"]);
    const idxNumberOfCleanings = getColAny(cfgHeaders, ["NumberOfCleanings", "Number Of Cleanings"]);
    const idxRenewPlan = getColAny(cfgHeaders, ["RenewPlan", "Auto Renew", "Renew Plans"]);

    const idxCityTown = getColAny(cfgHeaders, ["City/Town", "CityTown", "City"]);
    const idxServiceType = getColAny(cfgHeaders, [
      "ServiceType",
      "Service Type",
      "Type of service to be performed",
      "TypeOfService",
      "Type of service",
    ]);

    const categories = [];
    const departments = [];
    const priorities = [];
    const statuses = [];
    const provinces = [];

    const propertyTypes = [];
    const extrasCols = [];
    const durationHours = [];
    const numberOfCleanings = [];
    const renewPlans = [];
    const serviceTypes = [];

    const citiesByProvince = {};

    for (const r of cfgRows) {
      const prov = idxProvinces >= 0 ? String(r[idxProvinces] || "").trim() : "";

      if (idxCategory >= 0) categories.push(r[idxCategory]);
      if (idxDepartment >= 0) departments.push(r[idxDepartment]);
      if (idxPriority >= 0) priorities.push(r[idxPriority]);
      if (idxStatus >= 0) statuses.push(r[idxStatus]);
      if (idxProvinces >= 0) provinces.push(r[idxProvinces]);

      if (idxPropertyType >= 0) propertyTypes.push(r[idxPropertyType]);
      if (idxExtrasCols >= 0) extrasCols.push(r[idxExtrasCols]);
      if (idxDurationHours >= 0) durationHours.push(r[idxDurationHours]);
      if (idxNumberOfCleanings >= 0) numberOfCleanings.push(r[idxNumberOfCleanings]);
      if (idxRenewPlan >= 0) renewPlans.push(r[idxRenewPlan]);
      if (idxServiceType >= 0) serviceTypes.push(r[idxServiceType]);

      // province -> cities (supports "a,b,c" in one cell)
      if (prov && idxCityTown >= 0) {
        const cities = splitCitiesCell(r[idxCityTown]);
        if (cities.length) {
          if (!citiesByProvince[prov]) citiesByProvince[prov] = [];
          citiesByProvince[prov].push(...cities);
        }
      }
    }

    Object.keys(citiesByProvince).forEach((p) => {
      citiesByProvince[p] = uniq(citiesByProvince[p]);
    });

    // ---------------------------
    // 2) Prices
    // ---------------------------

    // 2a) Mobility Costs => keyed by "province||city" (safe if city names repeat)
    const { headers: mobHeaders, rows: mobRows } = await readSheet_(
      sheets,
      spreadsheetId,
      SHEET_MOBILITY
    );

    const idxMobCity = getColAny(mobHeaders, ["City/Town", "CityTown", "City"]);
    const idxMobCost = getColAny(mobHeaders, ["Mobility cost per clean", "MobilityCost", "Mobility"]);

    const mobilityCostByKey = {}; // { "Buenos Aires||CABA": 3000 }
    for (const r of mobRows) {
      const city = idxMobCity >= 0 ? String(r[idxMobCity] || "").trim() : "";
      const cost = idxMobCost >= 0 ? parseMoney(r[idxMobCost]) : 0;
      if (!city) continue;

      // We don't store province in this sheet, so we will also store by city-only.
      // If you want province-safe, add a "Province" column in Mobility Costs later.
      mobilityCostByKey[city] = cost;
    }

    // 2b) Plan Prices => key "duration|n"
    const { headers: planHeaders, rows: planRows } = await readSheet_(
      sheets,
      spreadsheetId,
      SHEET_PLAN
    );

    const idxPlanDur = getColAny(planHeaders, ["DurationHours", "Duration Hours"]);
    const idxPlanN = getColAny(planHeaders, ["NumberOfCleanings", "Number Of Cleanings"]);
    const idxPlanPrice = getColAny(planHeaders, ["PlanPrice", "Plan Price"]);

    const planPriceByKey = {}; // { "2|4": 187806 }
    for (const r of planRows) {
      const dur = idxPlanDur >= 0 ? String(r[idxPlanDur] || "").trim() : "";
      const n = idxPlanN >= 0 ? String(r[idxPlanN] || "").trim() : "";
      const price = idxPlanPrice >= 0 ? parseMoney(r[idxPlanPrice]) : 0;
      if (!dur || !n) continue;
      planPriceByKey[`${dur}|${n}`] = price;
    }

    // 2c) Extras Prices => by name
    const { headers: exHeaders, rows: exRows } = await readSheet_(
      sheets,
      spreadsheetId,
      SHEET_EXTRAS
    );

    const idxExName = getColAny(exHeaders, ["ExtraName", "Extra Name"]);
    const idxExPrice = getColAny(exHeaders, ["ExtraPrice", "Extra Price"]);

    const extraPriceByName = {}; // { "KIT BASICO": 10000 }
    for (const r of exRows) {
      const name = idxExName >= 0 ? String(r[idxExName] || "").trim() : "";
      const price = idxExPrice >= 0 ? parseMoney(r[idxExPrice]) : 0;
      if (!name) continue;
      extraPriceByName[name] = price;
    }

    // ---------------------------
    // Response
    // ---------------------------
    return NextResponse.json({
      ok: true,

      categories: uniq(categories),
      departments: uniq(departments),
      priorities: uniq(priorities),
      statuses: uniq(statuses),
      provinces: uniq(provinces),

      propertyTypes: uniq(propertyTypes),
      extrasCols: uniq(extrasCols),
      durationHours: uniq(durationHours),
      numberOfCleanings: uniq(numberOfCleanings),
      renewPlans: uniq(renewPlans),
      citiesByProvince,
      serviceTypes: uniq(serviceTypes),

      // ✅ Prices for UI + submit/update
      mobilityCostByCity: mobilityCostByKey, // city -> cost
      planPriceByDurationAndN: planPriceByKey, // "duration|n" -> price
      extraPriceByName, // extra -> price
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Failed to load config" },
      { status: 500 }
    );
  }
}
