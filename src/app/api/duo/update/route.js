// ✅ FILE: app/api/duo/update/route.js
// ✅ SAFE VERSION – header-based, JSON-safe, future-proof
// ❌ No risky logic changed

import { NextResponse } from "next/server";
import { getSheetsClient } from "@/lib/googleSheet";
import { randomUUID } from "crypto";

export const runtime = "nodejs";
const SHEET = "Submissions";

/**
 * ✅ Strong normalize
 * - Handles hidden unicode chars
 * - Must MATCH submit API normalization
 */
function norm(s) {
  return String(s || "")
    .replace(/[\uFEFF\u200B\u200C\u200D\u00A0]/g, " ")
    .trim()
    .toLowerCase();
}

/** Convert column index → A1 letter (0 → A) */
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

/** per-cleaning id */
function genCleaningId() {
  return `CLN-${randomUUID()}`;
}

/** Safe JSON parse */
function safeParseJson_(v, fallback) {
  try {
    if (!v) return fallback;
    const obj = JSON.parse(v);
    return obj ?? fallback;
  } catch {
    return fallback;
  }
}

/**
 * ✅ Sync cleaning objects by INDEX
 * - Preserves eventId & duoId
 * - Truncates if reduced
 * - Adds new objects if increased
 */
function syncCleaningObjects_(existingArr, targetN) {
  const n = Math.max(0, Math.min(12, Number(targetN || 0) || 0));
  const prev = Array.isArray(existingArr) ? existingArr : [];
  const next = [];

  for (let i = 0; i < n; i++) {
    const old = prev[i];
    if (old && typeof old === "object") {
      next.push({
        cleaningId:
          String(old.cleaningId || old.cleaningID || old.id || "") ||
          genCleaningId(),
        eventId: String(old.eventId || ""),
        duoId: String(old.duoId || ""),
      });
    } else {
      next.push({ cleaningId: genCleaningId(), eventId: "", duoId: "" });
    }
  }

  return next;
}

export async function POST(req) {
  try {
    const body = await req.json();

    const id = String(body.id || "").trim();
    const updateMode = String(body.updateMode || "").trim();
    const payload = body.payload || {};

    if (!id) {
      return NextResponse.json(
        { ok: false, error: "ID is required" },
        { status: 400 }
      );
    }

    const sheets = getSheetsClient();
    const spreadsheetId = process.env.SPREADSHEET_ID;

    /**
     * ✅ Read header + data
     * - Limited range for safety
     * - Headers must be in row 1
     */
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${SHEET}!A1:ZZ`,
    });

    const [headersRaw, ...rows] = res.data.values || [];
    const headers = (headersRaw || []).map(norm);

    const idCol = headers.indexOf("id");
    if (idCol === -1) throw new Error("ID column not found");

    const rowIndex = rows.findIndex((r) => r[idCol] === id);
    if (rowIndex === -1) throw new Error("Record not found");

    const rowNumber = rowIndex + 2; // + header
    const existingRow = rows[rowIndex] || [];

    /** Helper to find column index by header name */
    const col = (name) => headers.indexOf(norm(name));
    const updates = [];

    // ✅ ADDRESS
    if (updateMode === "address" || updateMode === "all") {
      updates.push(
        { col: col("Province"), val: payload.address?.province || "" },
        { col: col("City/Town"), val: payload.address?.city || "" },
        { col: col("Street/Number"), val: payload.address?.street || "" },
        { col: col("Property Details"), val: payload.address?.details || "" },
        { col: col("Property Type"), val: payload.address?.propertyType || "" }
      );
    }

    // ✅ PLAN
    if (updateMode === "plan" || updateMode === "all") {
      updates.push(
        { col: col("Duration Hours"), val: payload.plan?.durationHours || "" },
        {
          col: col("Number of Cleanings"),
          val: payload.plan?.numberCleanings || "",
        },
        { col: col("Auto Renew"), val: payload.plan?.autoRenew || "" }
      );
    }

    // ✅ SCHEDULE
    if (updateMode === "schedule" || updateMode === "all") {
      updates.push(
        { col: col("Schedule Date"), val: payload.schedule?.date || "" },
        { col: col("Schedule Time"), val: payload.schedule?.time || "" },
        { col: col("Time Window"), val: payload.schedule?.timeWindow || "" },
        {
          col: col("Extras (JSON)"),
          val: JSON.stringify(payload.schedule?.extras || {}),
        }
      );
    }

    // ✅ PLAN FULL (Step 4)
    if (updateMode === "plan_full") {
      updates.push(
        { col: col("Duration Hours"), val: payload.plan?.durationHours || "" },
        {
          col: col("Number of Cleanings"),
          val: payload.plan?.numberCleanings || "",
        },
        { col: col("Auto Renew"), val: payload.plan?.autoRenew || "" },
        { col: col("Schedule Date"), val: payload.schedule?.date || "" },
        { col: col("Schedule Time"), val: payload.schedule?.time || "" },
        { col: col("Time Window"), val: payload.schedule?.timeWindow || "" },
        {
          col: col("Extras (JSON)"),
          val: JSON.stringify(payload.schedule?.extras || {}),
        }
      );
    }

    // ✅ ADDITIONAL
    if (updateMode === "additional" || updateMode === "all") {
      updates.push(
        {
          col: col("Cleaning Instructions"),
          val: payload.additional?.cleaningInstructions || "",
        },
        {
          col: col("Favorite Duo0"),
          val: payload.additional?.favoriteDuo || "",
        },
        {
          col: col("Type of service to be performed"),
          val: payload.additional?.serviceType || "",
        }
      );
    }

    /**
     * ✅ CLEANINGS (JSON) sync
     * Only when plan changes
     */
    const cleaningCol = col("Cleanings (JSON)");
    const numCleanCol = col("Number of Cleanings");

    const shouldSync = updateMode === "plan_full" || updateMode === "all";

    if (cleaningCol >= 0 && numCleanCol >= 0 && shouldSync) {
      const targetN =
        payload.plan?.numberCleanings ?? existingRow[numCleanCol] ?? "";

      const existingJson = existingRow[cleaningCol] || "";
      const existingArr = safeParseJson_(existingJson, []);
      const synced = syncCleaningObjects_(existingArr, targetN);

      updates.push({
        col: cleaningCol,
        val: JSON.stringify(synced),
      });
    }

    /**
     * ✅ Build batch update ranges
     */
    const data = updates
      .filter((u) => u.col >= 0)
      .map((u) => ({
        range: `${SHEET}!${colToA1_(u.col)}${rowNumber}`,
        values: [[u.val]],
      }));

    /**
     * ✅ RAW write (JSON-safe, no column spill)
     */
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId,
      requestBody: {
        valueInputOption: "RAW",
        data,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e.message || "Update failed" },
      { status: 500 }
    );
  }
}
