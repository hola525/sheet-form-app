import { NextResponse } from "next/server";
import { getSheetsClient } from "@/lib/googleSheet";
import { randomUUID } from "crypto";

export const runtime = "nodejs";
const SHEET = "Submissions";

function norm(s) {
  return String(s || "")
    .replace(/[\uFEFF\u200B\u200C\u200D\u00A0]/g, " ")
    .trim()
    .toLowerCase();
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

function todayISOInArgentina_() {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(new Date());
}

function isPastDate_(yyyyMmDd) {
  const d = String(yyyyMmDd || "").trim();
  if (!d) return false;
  return d < todayISOInArgentina_();
}

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

function normalizeExtrasObj_(obj) {
  const out = {};
  const src = obj && typeof obj === "object" ? obj : {};
  Object.keys(src).forEach((k) => {
    const v = src[k];
    if (Array.isArray(v)) out[k] = v.map((x) => String(x || "").trim()).filter(Boolean);
    else if (typeof v === "string" && v.trim()) out[k] = [v.trim()];
    else out[k] = [];
  });
  return out;
}

function allCleaningsPassed_(datesArr, n) {
  const today = todayISOInArgentina_();
  const take = (Array.isArray(datesArr) ? datesArr : []).slice(0, n);
  if (!n || take.length < n) return false;
  return take.every((d) => String(d || "").trim() && String(d).trim() < today);
}

function syncCleaningObjects_(existingArr, targetN) {
  const n = Math.max(0, Math.min(12, Number(targetN || 0) || 0));
  const prev = Array.isArray(existingArr) ? existingArr : [];
  const next = [];

  for (let i = 0; i < n; i++) {
    const old = prev[i];
    if (old && typeof old === "object") {
      next.push({
        cleaningId:
          String(old.cleaningId || old.cleaningID || old.id || "") || genCleaningId(),
        eventId: String(old.eventId || ""),
        duoId: String(old.duoId || ""),
      });
    } else {
      next.push({ cleaningId: genCleaningId(), eventId: "", duoId: "" });
    }
  }
  return next;
}

function toNumber_(v) {
  const raw = String(v ?? "").trim();
  if (!raw) return 0;
  const cleaned = raw.replace(/[^\d.-]/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

async function safeReadSheet_(sheets, spreadsheetId, rangeA1) {
  try {
    const res = await sheets.spreadsheets.values.get({ spreadsheetId, range: rangeA1 });
    return res.data.values || [];
  } catch {
    return [];
  }
}

async function loadMobilityByCity_(sheets, spreadsheetId) {
  const values = await safeReadSheet_(sheets, spreadsheetId, `Mobility Costs!A:B`);
  const map = {};
  (values || []).forEach((row) => {
    const city = String(row?.[0] || "").trim();
    const cost = toNumber_(row?.[1]);
    if (!city) return;
    map[city] = cost;
  });
  return map;
}

async function loadPlanPriceMap_(sheets, spreadsheetId) {
  const values = await safeReadSheet_(sheets, spreadsheetId, `Plan Prices!A1:Z`);
  if (!values.length) return {};
  const headers = (values[0] || []).map(norm);

  const idxDur = headers.indexOf(norm("DurationHours"));
  const idxN = headers.indexOf(norm("NumberOfCleanings"));
  const idxPrice = headers.indexOf(norm("PlanPrice"));
  if (idxDur < 0 || idxN < 0 || idxPrice < 0) return {};

  const map = {};
  values.slice(1).forEach((r) => {
    const dur = String(r[idxDur] || "").trim();
    const n = String(r[idxN] || "").trim();
    const price = toNumber_(r[idxPrice]);
    if (!dur || !n) return;
    map[`${dur}|${n}`] = price;
  });
  return map;
}

async function loadExtraPriceMap_(sheets, spreadsheetId) {
  const values = await safeReadSheet_(sheets, spreadsheetId, `Extra prices!A1:Z`);
  if (!values.length) return {};
  const headers = (values[0] || []).map(norm);

  const idxName = headers.indexOf(norm("ExtraName"));
  const idxPrice = headers.indexOf(norm("ExtraPrice"));
  if (idxName < 0 || idxPrice < 0) return {};

  const map = {};
  values.slice(1).forEach((r) => {
    const name = String(r[idxName] || "").trim();
    const price = toNumber_(r[idxPrice]);
    if (!name) return;
    map[name] = price;
  });
  return map;
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

export async function POST(req) {
  try {
    const body = await req.json();

    const id = String(body.id || "").trim();
    const updateMode = String(body.updateMode || "").trim();
    const payload = body.payload || {};

    if (!id) {
      return NextResponse.json({ ok: false, error: "ID is required" }, { status: 400 });
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

    const numCleanCol = col("Number of Cleanings");
    const scheduleDateCol = col("Schedule Date");
    const scheduleTimeCol = col("Schedule Time");
    const extrasCol = col("Extras (JSON)");

    const existingN = Number(existingRow[numCleanCol] || 0) || 0;
    const existingDatesArr = splitCSV_(existingRow[scheduleDateCol] || "");
    const existingTimesArr = splitCSV_(existingRow[scheduleTimeCol] || "");
    const planIsLockedAll = allCleaningsPassed_(existingDatesArr, existingN);

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

    // ✅ PLAN (guard lock + no-reduce)
    if (updateMode === "plan" || updateMode === "all") {
      if (planIsLockedAll) {
        return NextResponse.json(
          { ok: false, error: "Plan is locked because all cleanings have passed." },
          { status: 400 }
        );
      }

      const targetN = Number(payload.plan?.numberCleanings || 0) || 0;
      if (existingN && targetN && targetN < existingN) {
        return NextResponse.json(
          { ok: false, error: `You cannot reduce number of cleanings below ${existingN}.` },
          { status: 400 }
        );
      }

      updates.push(
        { col: col("Duration Hours"), val: payload.plan?.durationHours || "" },
        { col: col("Number of Cleanings"), val: payload.plan?.numberCleanings || "" },
        { col: col("Auto Renew"), val: payload.plan?.autoRenew || "" }
      );
    }

    // ✅ SCHEDULE (guard lock)
    if (updateMode === "schedule" || updateMode === "all") {
      if (planIsLockedAll) {
        return NextResponse.json(
          { ok: false, error: "Plan is locked because all cleanings have passed." },
          { status: 400 }
        );
      }

      updates.push(
        { col: col("Schedule Date"), val: payload.schedule?.date || "" },
        { col: col("Schedule Time"), val: payload.schedule?.time || "" },
        { col: col("Time Window"), val: payload.schedule?.timeWindow || "" },
        { col: col("Extras (JSON)"), val: JSON.stringify(payload.schedule?.extras || {}) }
      );
    }

    // ✅ PLAN FULL
    if (updateMode === "plan_full") {
      if (planIsLockedAll) {
        return NextResponse.json(
          { ok: false, error: "Plan is locked because all cleanings have passed." },
          { status: 400 }
        );
      }

      const targetN = Number(payload.plan?.numberCleanings || 0) || 0;
      if (existingN && targetN < existingN) {
        return NextResponse.json(
          { ok: false, error: `You cannot reduce number of cleanings below ${existingN}.` },
          { status: 400 }
        );
      }

      const incomingDatesArr = splitCSV_(payload.schedule?.date || "");
      const incomingTimesArr = splitCSV_(payload.schedule?.time || "");

      const mergedDates = [];
      const mergedTimes = [];

      for (let i = 0; i < targetN; i++) {
        if (i < existingN) {
          const oldD = existingDatesArr[i] || "";
          const oldT = existingTimesArr[i] || "";
          const incomingD = incomingDatesArr[i] || oldD;
          const incomingT = incomingTimesArr[i] || oldT;

          if (isPastDate_(oldD)) {
            mergedDates[i] = oldD;
            mergedTimes[i] = oldT;
          } else {
            mergedDates[i] = incomingD;
            mergedTimes[i] = incomingT;
          }
        } else {
          mergedDates[i] = incomingDatesArr[i] || "";
          mergedTimes[i] = incomingTimesArr[i] || "";
        }
      }

      const existingExtrasObj = normalizeExtrasObj_(safeParseJson_(existingRow[extrasCol] || "", {}));
      const incomingExtrasObj = normalizeExtrasObj_(payload.schedule?.extras || {});

      const mergedExtras = {};
      for (let i = 1; i <= targetN; i++) {
        const key = `Cleaning ${i}`;
        if (i <= existingN) {
          const oldD = existingDatesArr[i - 1] || "";
          if (isPastDate_(oldD)) {
            mergedExtras[key] = existingExtrasObj[key] || [];
          } else {
            mergedExtras[key] = incomingExtrasObj[key] || existingExtrasObj[key] || [];
          }
        } else {
          mergedExtras[key] = incomingExtrasObj[key] || [];
        }
      }

      updates.push(
        { col: col("Duration Hours"), val: payload.plan?.durationHours || "" },
        { col: col("Number of Cleanings"), val: String(targetN || "") },
        { col: col("Auto Renew"), val: payload.plan?.autoRenew || "" },

        { col: col("Schedule Date"), val: joinCSV_(mergedDates) },
        { col: col("Schedule Time"), val: joinCSV_(mergedTimes) },
        { col: col("Time Window"), val: payload.schedule?.timeWindow || "" },
        { col: col("Extras (JSON)"), val: JSON.stringify(mergedExtras) }
      );
    }

    // ✅ ADDITIONAL
    if (updateMode === "additional" || updateMode === "all") {
      updates.push(
        { col: col("Cleaning Instructions"), val: payload.additional?.cleaningInstructions || "" },
        { col: col("Favorite Duo0"), val: payload.additional?.favoriteDuo || "" },
        { col: col("Type of service to be performed"), val: payload.additional?.serviceType || "" }
      );
    }

    // ✅ CLEANINGS JSON sync
    const cleaningCol = col("Cleanings (JSON)");
    const shouldSync = updateMode === "plan_full" || updateMode === "all";
    if (cleaningCol >= 0 && numCleanCol >= 0 && shouldSync) {
      const targetN = payload.plan?.numberCleanings ?? existingRow[numCleanCol] ?? "";
      const existingJson = existingRow[cleaningCol] || "";
      const existingArr = safeParseJson_(existingJson, []);
      const synced = syncCleaningObjects_(existingArr, targetN);
      updates.push({ col: cleaningCol, val: JSON.stringify(synced) });
    }

    // ✅ PRICE RECALC (simple + safe)
    // We recalc when any relevant section changes:
    const shouldRecalcPrice =
      updateMode === "all" ||
      updateMode === "address" ||
      updateMode === "plan" ||
      updateMode === "schedule" ||
      updateMode === "plan_full";

    if (shouldRecalcPrice) {
      const [mobilityByCity, planPriceMap, extraPriceByName] = await Promise.all([
        loadMobilityByCity_(sheets, spreadsheetId),
        loadPlanPriceMap_(sheets, spreadsheetId),
        loadExtraPriceMap_(sheets, spreadsheetId),
      ]);

      // Determine FINAL values (use payload override if provided, else existing row)
      const getExisting_ = (headerName) => {
        const c = col(headerName);
        if (c < 0) return "";
        return existingRow[c] ?? "";
      };

      const finalCity =
        String(payload.address?.city ?? "").trim() || String(getExisting_("City/Town") || "").trim();

      const finalDuration =
        String(payload.plan?.durationHours ?? "").trim() || String(getExisting_("Duration Hours") || "").trim();

      const finalN =
        toNumber_(payload.plan?.numberCleanings ?? "") || toNumber_(getExisting_("Number of Cleanings"));

      // extras: if plan_full or schedule or all, use payload.schedule.extras (or merged in plan_full update above)
      // easiest: prefer the value we are writing into "Extras (JSON)" if present, else existing
      let finalExtrasObj = {};
      const pendingExtrasUpdate = updates.find((u) => u.col === col("Extras (JSON)"));
      if (pendingExtrasUpdate) {
        finalExtrasObj = safeParseJson_(pendingExtrasUpdate.val, {});
      } else {
        finalExtrasObj = safeParseJson_(getExisting_("Extras (JSON)"), {});
      }

      const mobilityPerCleaning = toNumber_(mobilityByCity[finalCity] ?? 0);
      const mobilityTotal = mobilityPerCleaning * finalN;

      const planPrice = toNumber_(planPriceMap[`${finalDuration}|${finalN}`] ?? 0);
      const extrasTotal = sumExtrasTotal_(finalExtrasObj, extraPriceByName);
      const totalPrice = planPrice + mobilityTotal + extrasTotal;

      updates.push(
        { col: col("Mobility Cost (per cleaning)"), val: mobilityPerCleaning },
        { col: col("Mobility Cost (total)"), val: mobilityTotal },
        { col: col("Plan Price"), val: planPrice },
        { col: col("Extras Price (total)"), val: extrasTotal },
        { col: col("Total Price"), val: totalPrice }
      );
    }

    // batch update
    const data = updates
      .filter((u) => u.col >= 0)
      .map((u) => ({
        range: `${SHEET}!${colToA1_(u.col)}${rowNumber}`,
        values: [[u.val]],
      }));

    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId,
      requestBody: { valueInputOption: "RAW", data },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message || "Update failed" }, { status: 500 });
  }
}
