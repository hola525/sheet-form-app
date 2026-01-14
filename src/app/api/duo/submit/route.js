import { NextResponse } from "next/server";
import { getSheetsClient } from "@/lib/googleSheet";
import { randomUUID } from "crypto";

export const runtime = "nodejs";
const SHEET = "Submissions";

/** normalize header names */
function norm(s) {
  return String(s || "").trim().toLowerCase();
}

/** stable plan id */
function genId() {
  return `DUO-${randomUUID()}`;
}

/** per-cleaning id */
function genCleaningId() {
  return `CLN-${randomUUID()}`;
}

const REQUIRED_HEADERS = [
  "ID",

  "Timestamp",
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

  // ✅ NEW COLUMN
  "Cleaning IDs (JSON)",
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

/** Build cleanings array for first submit */
function buildInitialCleaningObjects_(numberCleanings) {
  const n = Math.max(0, Math.min(12, Number(numberCleanings || 0) || 0));
  const arr = [];
  for (let i = 0; i < n; i++) {
    arr.push({ cleaningId: genCleaningId(), eventId: "", duoId: "" });
  }
  return arr;
}

export async function POST(req) {
  try {
    const body = await req.json();

    const sheets = getSheetsClient();
    const spreadsheetId = process.env.SPREADSHEET_ID;

    const headersRaw = await ensureHeaders({ sheets, spreadsheetId });
    const headers = headersRaw.map(norm);

    const submissionId = genId();

    // ✅ NEW: build cleaning IDs array synced to number of cleanings
    const cleaningObjs = buildInitialCleaningObjects_(
      body.plan?.numberCleanings
    );

    const payload = {
      id: submissionId,
      timestamp: new Date().toISOString(),

      "full name": body.fullName || "",
      email: body.email || "",
      phone: body.phone || "",
      department: body.department || "",
      category: body.category || "",
      priority: body.priority || "",
      notes: body.notes || "",
      status: body.status || "Pending",
      "attachment url": body.attachmentUrl || "",

      "user type": body.userType || "",
      "flow action": body.flowAction || "",

      province: body.address?.province || "",
      "city/town": body.address?.city || "",
      "street/number": body.address?.street || "",
      "property details": body.address?.details || "",
      "property type": body.address?.propertyType || "",

      "duration hours": body.plan?.durationHours || "",
      "number of cleanings": body.plan?.numberCleanings || "",
      "auto renew": body.plan?.autoRenew || "",

      "schedule date": body.schedule?.date || "",
      "schedule time": body.schedule?.time || "",
      "time window": body.schedule?.timeWindow || "",
      "extras (json)": JSON.stringify(body.schedule?.extras || {}),

      "cleaning instructions": body.additional?.cleaningInstructions || "",
      "favorite duo0": body.additional?.favoriteDuo || "",
      "type of service to be performed": body.additional?.serviceType || "",

      // ✅ NEW
      "cleaning ids (json)": JSON.stringify(cleaningObjs),
    };

    const row = headers.map((h) => payload[h] ?? "");

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${SHEET}!A:ZZ`,
      valueInputOption: "USER_ENTERED",
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
