import { NextResponse } from "next/server";
import { getSheetsClient } from "@/lib/googleSheet";

const SHEET = "Config";

function norm(s) {
  return String(s || "").trim().toLowerCase();
}

function uniq(arr) {
  return Array.from(new Set(arr.map((v) => String(v || "").trim()).filter(Boolean)));
}

// small helper to support multiple header names (so you don’t get stuck)
function getColAny(headers, names) {
  for (const n of names) {
    const idx = headers.indexOf(norm(n));
    if (idx >= 0) return idx;
  }
  return -1;
}

/**
 * ✅ NEW: Split a cell like:
 * "Bue city,Bue city 2, Bue city 3"
 * into ["Bue city", "Bue city 2", "Bue city 3"]
 */
function splitCitiesCell(value) {
  const raw = String(value || "").trim();
  if (!raw) return [];

  return raw
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

export async function GET() {
  try {
    const sheets = getSheetsClient();
    const spreadsheetId = process.env.SPREADSHEET_ID;

    // Read header row
    const headerRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${SHEET}!1:1`,
    });
    const headers = (headerRes.data.values?.[0] || []).map(norm);

    // Read data rows
    const dataRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${SHEET}!A2:ZZ`,
    });
    const rows = dataRes.data.values || [];

    const getCol = (name) => headers.indexOf(norm(name));

    // Existing
    const idxCategory = getCol("Category");
    const idxDepartment = getCol("Department");
    const idxPriority = getCol("Priority");
    const idxStatus = getCol("Status");
    const idxProvinces = getCol("Provinces");

    // New fields
    const idxPropertyType = getCol("PropertyType");
    const idxExtrasCols = getCol("extrasCols");
    const idxDurationHours = getCol("DurationHours");
    const idxNumberOfCleanings = getCol("NumberOfCleanings");
    const idxRenewPlan = getCol("RenewPlan");

    // City/Town (your sheet column is "CityTown")
    const idxCityTown = getColAny(headers, ["City/Town", "CityTown", "City"]);

    // ✅ Service Type dropdown
    const idxServiceType = getColAny(headers, [
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

    const citiesByProvince = {}; // { "Province": ["City 1", ...] }

    for (const r of rows) {
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

      // ✅ UPDATED: province -> cities mapping (support comma-separated cities in one cell)
      if (prov && idxCityTown >= 0) {
        const cities = splitCitiesCell(r[idxCityTown]);
        if (cities.length) {
          if (!citiesByProvince[prov]) citiesByProvince[prov] = [];
          citiesByProvince[prov].push(...cities);
        }
      }
    }

    // ✅ make each province city list unique + clean
    Object.keys(citiesByProvince).forEach((p) => {
      citiesByProvince[p] = uniq(citiesByProvince[p]);
    });

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
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Failed to load config" },
      { status: 500 }
    );
  }
}
