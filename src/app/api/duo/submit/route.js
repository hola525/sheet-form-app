import { NextResponse } from "next/server";
import { getSheetsClient } from "@/lib/googleSheet";
import { randomUUID } from "crypto";

export const runtime = "nodejs";
const SHEET = "Submissions";

/** Strong normalize (handles hidden chars too) */
function norm(s) {
  return String(s || "")
    .replace(/[\uFEFF\u200B\u200C\u200D\u00A0]/g, " ")
    .trim()
    .toLowerCase();
}

/** Convert 0-based col index to A1 letters */
function colToA1(colIndex) {
  let n = colIndex + 1;
  let s = "";
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

/** stable plan id */
function genId() {
  return `DUO-${randomUUID()}`;
}

/** per-cleaning id */
function genCleaningId() {
  return `CLN-${randomUUID()}`;
}

function toNumber_(v) {
  const raw = String(v ?? "").trim();
  if (!raw) return 0;
  // remove $, commas, spaces
  const cleaned = raw.replace(/[^\d.-]/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function sumExtrasTotal_(extrasByCleaning, extraPriceByName) {
  const obj = extrasByCleaning && typeof extrasByCleaning === "object" ? extrasByCleaning : {};
  let total = 0;

  Object.keys(obj).forEach((k) => {
    const arr = Array.isArray(obj[k]) ? obj[k] : [];
    arr.forEach((name) => {
      const nm = String(name || "").trim();
      if (!nm) return;
      if (nm.toLowerCase() === "nothing") return;
      total += toNumber_(extraPriceByName[nm] ?? 0);
    });
  });

  return total;
}

/** Find next empty row based on column A (Timestamp column) */
async function getNextRowIndex({ sheets, spreadsheetId }) {
  const colARes = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${SHEET}!A:A`,
  });
  const colA = colARes.data.values || [];
  return colA.length + 1;
}

function buildInitialCleaningObjects_(numberCleanings) {
  const n = Math.max(0, Math.min(12, Number(numberCleanings || 0) || 0));
  const arr = [];
  for (let i = 0; i < n; i++) {
    arr.push({ cleaningId: genCleaningId(), eventId: "", duoId: "" });
  }
  return arr;
}

/** Safe read a sheet, return [] if missing */
async function safeReadSheet_(sheets, spreadsheetId, rangeA1) {
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: rangeA1,
    });
    return res.data.values || [];
  } catch (e) {
    return [];
  }
}

/**
 * ✅ Mobility Costs loader (simple A:B)
 * - Your new sheet format: col A city, col B cost
 */
async function loadMobilityByCity_(sheets, spreadsheetId) {
  const values = await safeReadSheet_(sheets, spreadsheetId, `Mobility Costs!A:B`);
  const map = {}; // { "CABA": 3000 }

  (values || []).forEach((row) => {
    const city = String(row?.[0] || "").trim();
    const cost = toNumber_(row?.[1]);
    if (!city) return;
    map[city] = cost;
  });

  return map;
}

/**
 * ✅ Plan Prices loader
 * Sheet: Plan Prices
 * Headers: DurationHours | NumberOfCleanings | PlanPrice
 */
async function loadPlanPriceMap_(sheets, spreadsheetId) {
  const values = await safeReadSheet_(sheets, spreadsheetId, `Plan Prices!A1:Z`);
  if (!values.length) return {};

  const headers = (values[0] || []).map(norm);
  const idxDur = headers.indexOf(norm("DurationHours"));
  const idxN = headers.indexOf(norm("NumberOfCleanings"));
  const idxPrice = headers.indexOf(norm("PlanPrice"));

  // if headers not found, just return empty (simple + safe)
  if (idxDur < 0 || idxN < 0 || idxPrice < 0) return {};

  const map = {}; // { "1|4": 108240 }
  values.slice(1).forEach((r) => {
    const dur = String(r[idxDur] || "").trim();
    const n = String(r[idxN] || "").trim();
    const price = toNumber_(r[idxPrice]);
    if (!dur || !n) return;
    map[`${dur}|${n}`] = price;
  });

  return map;
}

/**
 * ✅ Extra Prices loader
 * Sheet: Extra prices
 * Headers: ExtraName | ExtraPrice
 */
async function loadExtraPriceMap_(sheets, spreadsheetId) {
  const values = await safeReadSheet_(sheets, spreadsheetId, `Extra prices!A1:Z`);
  if (!values.length) return {};

  const headers = (values[0] || []).map(norm);
  const idxName = headers.indexOf(norm("ExtraName"));
  const idxPrice = headers.indexOf(norm("ExtraPrice"));

  if (idxName < 0 || idxPrice < 0) return {};

  const map = {}; // { "KIT BASICO": 10000 }
  values.slice(1).forEach((r) => {
    const name = String(r[idxName] || "").trim();
    const price = toNumber_(r[idxPrice]);
    if (!name) return;
    map[name] = price;
  });

  return map;
}

const REQUIRED_HEADERS = [
  "Timestamp",
  "ID",

  "Full Name",
  "Email",
  "Phone",
  "Department",
  "Category",
  "Priority",
  "Notes",
  "Status",
  "Attachment URL",

  "User Type",
  "Flow Action",

  "Province",
  "City/Town",
  "Street/Number",
  "Property Details",
  "Property Type",

  "Duration Hours",
  "Number of Cleanings",
  "Auto Renew",

  "Schedule Date",
  "Schedule Time",
  "Time Window",
  "Extras (JSON)",

  "Cleaning Instructions",
  "Favorite Duo0",
  "Type of service to be performed",

  "Cleanings (JSON)",

  // ✅ NEW pricing columns
  "Mobility Cost (per cleaning)",
  "Mobility Cost (total)",
  "Plan Price",
  "Extras Price (total)",
  "Total Price",

  "Email Sent (Request)",
  "Email Sent (Reminder) (JSON)",
  "Email Sent (Completed) (JSON)",
];

async function ensureHeaders({ sheets, spreadsheetId }) {
  const headerRes = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${SHEET}!1:1`,
  });

  const currentHeaders = headerRes.data.values?.[0] || [];
  const currentNorm = currentHeaders.map(norm);

  const missing = REQUIRED_HEADERS.filter((h) => !currentNorm.includes(norm(h)));
  if (missing.length === 0) return currentHeaders;

  const newHeaders = [...currentHeaders, ...missing];

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${SHEET}!1:1`,
    valueInputOption: "RAW",
    requestBody: { values: [newHeaders] },
  });

  return newHeaders;
}

export async function POST(req) {
  try {
    const body = await req.json();

    const sheets = getSheetsClient();
    const spreadsheetId = process.env.SPREADSHEET_ID;

    const headersRaw = await ensureHeaders({ sheets, spreadsheetId });

    // header -> index map
    const headerIndex = new Map();
    headersRaw.forEach((h, i) => headerIndex.set(norm(h), i));

    const submissionId = genId();
    const cleaningObjs = buildInitialCleaningObjects_(body.plan?.numberCleanings);

    // ✅ Load pricing tables (safe even if sheets missing)
    const [mobilityByCity, planPriceMap, extraPriceByName] = await Promise.all([
      loadMobilityByCity_(sheets, spreadsheetId),
      loadPlanPriceMap_(sheets, spreadsheetId),
      loadExtraPriceMap_(sheets, spreadsheetId),
    ]);

    const city = String(body.address?.city || "").trim();
    const durationHours = String(body.plan?.durationHours || "").trim();
    const numberCleanings = toNumber_(body.plan?.numberCleanings);

    const mobilityPerCleaning = toNumber_(mobilityByCity[city] ?? 0);
    const mobilityTotal = mobilityPerCleaning * numberCleanings;

    const planPrice = toNumber_(planPriceMap[`${durationHours}|${numberCleanings}`] ?? 0);

    const extrasTotal = sumExtrasTotal_(body.schedule?.extras || {}, extraPriceByName);

    const totalPrice = planPrice + mobilityTotal + extrasTotal;

    const payload = {
      Timestamp: new Date().toISOString(),
      ID: submissionId,

      "Full Name": body.fullName || "",
      Email: body.email || "",
      Phone: body.phone || "",
      Department: body.department || "",
      Category: body.category || "",
      Priority: body.priority || "",
      Notes: body.notes || "",
      Status: body.status || "Pending",
      "Attachment URL": body.attachmentUrl || "",

      "User Type": body.userType || "",
      "Flow Action": body.flowAction || "",

      Province: body.address?.province || "",
      "City/Town": body.address?.city || "",
      "Street/Number": body.address?.street || "",
      "Property Details": body.address?.details || "",
      "Property Type": body.address?.propertyType || "",

      "Duration Hours": body.plan?.durationHours || "",
      "Number of Cleanings": body.plan?.numberCleanings || "",
      "Auto Renew": body.plan?.autoRenew || "",

      "Schedule Date": body.schedule?.date || "",
      "Schedule Time": body.schedule?.time || "",
      "Time Window": body.schedule?.timeWindow || "",
      "Extras (JSON)": JSON.stringify(body.schedule?.extras || {}),

      "Cleaning Instructions": body.additional?.cleaningInstructions || "",
      "Favorite Duo0": body.additional?.favoriteDuo || "",
      "Type of service to be performed": body.additional?.serviceType || "",

      "Cleanings (JSON)": JSON.stringify(cleaningObjs),

      // ✅ Pricing saved
      "Mobility Cost (per cleaning)": mobilityPerCleaning,
      "Mobility Cost (total)": mobilityTotal,
      "Plan Price": planPrice,
      "Extras Price (total)": extrasTotal,
      "Total Price": totalPrice,

      "Email Sent (Request)": "",
      "Email Sent (Reminder) (JSON)": "",
      "Email Sent (Completed) (JSON)": "",
    };

    // build row EXACT header length
    const row = new Array(headersRaw.length).fill("");
    for (const [key, value] of Object.entries(payload)) {
      const idx = headerIndex.get(norm(key));
      if (idx !== undefined) row[idx] = value ?? "";
    }

    // write new row
    const nextRow = await getNextRowIndex({ sheets, spreadsheetId });
    const endCol = colToA1(headersRaw.length - 1);

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${SHEET}!A${nextRow}:${endCol}${nextRow}`,
      valueInputOption: "RAW",
      requestBody: { values: [row] },
    });

    return NextResponse.json({ ok: true, id: submissionId });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Failed to submit" },
      { status: 500 }
    );
  }
}
