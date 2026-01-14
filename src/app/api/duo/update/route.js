// ✅ FILE: app/api/duo/update/route.js  (or your update api file)
// ✅ CHANGE: Cleanings (JSON) will ALWAYS be truncated/expanded to match "Number of Cleanings"
// ✅ CHANGE: Use the NEW number of cleanings during plan_full/all (not old sheet value)
// ✅ SAFE: Does not disturb your other logic

import { NextResponse } from "next/server";
import { getSheetsClient } from "@/lib/googleSheet";
import { randomUUID } from "crypto";

export const runtime = "nodejs";
const SHEET = "Submissions";

function norm(s) {
  return String(s || "").trim().toLowerCase();
}

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

// ✅ per-cleaning id
function genCleaningId() {
  return `CLN-${randomUUID()}`;
}

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
 * ✅ Sync cleaning objects by INDEX:
 * - Keep existing objects for same indexes (preserve eventId/duoId)
 * - Add new objects if targetN bigger
 * - Truncate if targetN smaller
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

    const rowNumber = rowIndex + 2;
    const existingRow = rows[rowIndex] || [];

    const col = (name) => headers.indexOf(norm(name));
    const updates = [];

    // ✅ ADDRESS (Step 3)
    if (updateMode === "address" || updateMode === "all") {
      updates.push(
        { col: col("Province"), val: payload.address?.province || "" },
        { col: col("City/Town"), val: payload.address?.city || "" },
        { col: col("Street/Number"), val: payload.address?.street || "" },
        { col: col("Property Details"), val: payload.address?.details || "" },
        { col: col("Property Type"), val: payload.address?.propertyType || "" }
      );
    }

    // ✅ PLAN only (legacy support)
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

    // ✅ SCHEDULE only (legacy support)
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

    // ✅ plan_full = Step 4 single update (PLAN + SCHEDULE + EXTRAS)
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

    // ✅ ADDITIONAL (Step 5)
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
     * ✅ CLEANINGS (JSON) SYNC
     * Must ALWAYS match Number of Cleanings when Step-4 updates happen.
     * - If reduced: truncate objects
     * - If increased: add new objects
     * - Keep existing objects by index (preserve eventId/duoId)
     */
    const cleaningIdsCol =
      col("Cleanings (JSON)") >= 0
        ? col("Cleanings (JSON)")
        : col("Cleaning IDs (JSON)");

    const numCleaningsCol = col("Number of Cleanings");

    // ✅ IMPORTANT: Only sync when Step-4 changes (plan_full or all)
    const shouldSyncCleaningIds =
      updateMode === "plan_full" || updateMode === "all";

    if (cleaningIdsCol >= 0 && numCleaningsCol >= 0 && shouldSyncCleaningIds) {
      // ✅ IMPORTANT: use the NEW value (the one we are saving now)
      // If plan_full/all => payload.plan.numberCleanings is the truth
      const targetN =
        payload.plan?.numberCleanings ??
        existingRow[numCleaningsCol] ??
        "";

      const existingCleaningIdsJson = existingRow[cleaningIdsCol] || "";
      const existingArr = safeParseJson_(existingCleaningIdsJson, []);

      const synced = syncCleaningObjects_(existingArr, targetN);

      updates.push({
        col: cleaningIdsCol,
        val: JSON.stringify(synced),
      });
    }

    const data = updates
      .filter((u) => u.col >= 0)
      .map((u) => ({
        range: `${SHEET}!${colToA1_(u.col)}${rowNumber}`,
        values: [[u.val]],
      }));

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
      { ok: false, error: e.message || "Update failed" },
      { status: 500 }
    );
  }
}
