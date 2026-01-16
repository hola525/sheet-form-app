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

  "Email Sent (Request)",
  "Email Sent At (Request)",
  "Email Error (Request)",

  "Email Sent (Reminder) (JSON)",
  "Email Sent At (Reminder) (JSON)",
  "Email Error (Reminder)",
  "Email Sent At (Completed) (JSON)",
  "Email Sent (Completed) (JSON)",
  "Email Error (Completed)",
];

async function ensureHeaders({ sheets, spreadsheetId }) {
  const headerRes = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${SHEET}!1:1`,
  });

  const currentHeaders = headerRes.data.values?.[0] || [];
  const currentNorm = currentHeaders.map(norm);

  const missing = REQUIRED_HEADERS.filter(
    (h) => !currentNorm.includes(norm(h))
  );
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

/** Find next empty row based on column A (Timestamp column) */
async function getNextRowIndex({ sheets, spreadsheetId }) {
  const colARes = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${SHEET}!A:A`,
  });
  const colA = colARes.data.values || [];
  // colA includes header in row 1, so next row is length + 1
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
    const cleaningObjs = buildInitialCleaningObjects_(
      body.plan?.numberCleanings
    );

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

      "Email Sent (Request)": "",
      "Email Sent At (Request)": "",
      "Email Error (Request)": "",

      "Email Sent (Reminder) (JSON)": "",
      "Email Sent At (Reminder) (JSON)": "",
      "Email Error (Reminder)": "",
      "Email Sent At (Completed) (JSON)": "",
      "Email Sent (Completed) (JSON)": "",
      "Email Error (Completed)": "",
    };

    // build row EXACT header length
    const row = new Array(headersRaw.length).fill("");
    for (const [key, value] of Object.entries(payload)) {
      const idx = headerIndex.get(norm(key));
      if (idx !== undefined) row[idx] = value ?? "";
    }

    // ✅ GUARANTEED write from column A of a NEW ROW
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
