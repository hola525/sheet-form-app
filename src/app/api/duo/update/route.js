import { NextResponse } from "next/server";
import { getSheetsClient } from "@/lib/googleSheet";

export const runtime = "nodejs";
const SHEET = "Submissions";
const REQUIRED_HEADERS = [
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

function norm(s) {
  return String(s || "")
    .trim()
    .toLowerCase();
}

// Convert 0 -> A, 25 -> Z, 26 -> AA ...
function colToA1_(colIndex) {
  let n = colIndex + 1;
  let s = "";
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

export async function POST(req) {
  try {
    const body = await req.json();

    const rowNumber = Number(body.rowNumber || 0);
    const updateMode = String(body.updateMode || ""); // address | plan | schedule | additional
    const payload = body.payload || {}; // same structure as FormShell payload

    if (!rowNumber) {
      return NextResponse.json(
        { ok: false, error: "rowNumber is required" },
        { status: 400 }
      );
    }
    if (!updateMode) {
      return NextResponse.json(
        { ok: false, error: "updateMode is required" },
        { status: 400 }
      );
    }

    const sheets = getSheetsClient();
    const spreadsheetId = process.env.SPREADSHEET_ID;

    // ✅ ensure all columns exist (prevents silent non-updates)
    const headersRaw = await ensureHeaders({ sheets, spreadsheetId });

    const headers = headersRaw.map(norm);

    // Helper to get column index by header name
    const col = (name) => headers.indexOf(norm(name));

    // ✅ Decide which columns to update based on updateMode
    const updates = [];

    // ----- ADDRESS -----
    if (updateMode === "address" || updateMode === "all") {
      const cProvince = col("Province");
      const cCity = col("City/Town");
      const cStreet = col("Street/Number");
      const cDetails = col("Property Details");
      const cType = col("Property Type");

      if (cProvince >= 0)
        updates.push({ col: cProvince, val: payload.address?.province || "" });
      if (cCity >= 0)
        updates.push({ col: cCity, val: payload.address?.city || "" });
      if (cStreet >= 0)
        updates.push({ col: cStreet, val: payload.address?.street || "" });
      if (cDetails >= 0)
        updates.push({ col: cDetails, val: payload.address?.details || "" });
      if (cType >= 0)
        updates.push({ col: cType, val: payload.address?.propertyType || "" });
    }

    // ----- PLAN -----
    if (updateMode === "plan" || updateMode === "all") {
      const cDur = col("Duration Hours");
      const cNum = col("Number of Cleanings");
      const cRenew = col("Auto Renew");

      if (cDur >= 0)
        updates.push({ col: cDur, val: payload.plan?.durationHours || "" });
      if (cNum >= 0)
        updates.push({ col: cNum, val: payload.plan?.numberCleanings || "" });
      if (cRenew >= 0)
        updates.push({ col: cRenew, val: payload.plan?.autoRenew || "" });
    }

    // ----- SCHEDULE + EXTRAS -----
    if (updateMode === "schedule" || updateMode === "all") {
      const cDate = col("Schedule Date");
      const cTime = col("Schedule Time");
      const cWindow = col("Time Window");
      const cExtras = col("Extras (JSON)");

      if (cDate >= 0)
        updates.push({ col: cDate, val: payload.schedule?.date || "" });
      if (cTime >= 0)
        updates.push({ col: cTime, val: payload.schedule?.time || "" });
      if (cWindow >= 0)
        updates.push({ col: cWindow, val: payload.schedule?.timeWindow || "" });
      if (cExtras >= 0)
        updates.push({
          col: cExtras,
          val: JSON.stringify(payload.schedule?.extras || {}),
        });
    }

    // ----- ADDITIONAL -----
    if (updateMode === "additional" || updateMode === "all") {
      const cInstr = col("Cleaning Instructions");
      const cFav = col("Favorite Duo0");
      const cSvc = col("Type of service to be performed");

      if (cInstr >= 0)
        updates.push({
          col: cInstr,
          val: payload.additional?.cleaningInstructions || "",
        });
      if (cFav >= 0)
        updates.push({ col: cFav, val: payload.additional?.favoriteDuo || "" });
      if (cSvc >= 0)
        updates.push({ col: cSvc, val: payload.additional?.serviceType || "" });
    }

    if (!updates.length) {
      return NextResponse.json(
        { ok: false, error: "No matching columns to update" },
        { status: 400 }
      );
    }

    // ✅ Batch update cell-by-cell (simple + safe)
    const data = updates.map((u) => {
      const colLetter = colToA1_(u.col);
      return {
        range: `${SHEET}!${colLetter}${rowNumber}`,
        values: [[u.val]],
      };
    });

    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId,
      requestBody: {
        valueInputOption: "USER_ENTERED",
        data,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Failed to update plan" },
      { status: 500 }
    );
  }
}
