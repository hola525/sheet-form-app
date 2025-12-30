import { getSheetsClient } from "@/lib/googleSheet";
import { NextResponse } from "next/server";

const SHEET_NAME = "Config";

// We will ONLY use these header names (case-insensitive)
const REQUIRED_HEADERS = ["Department", "Category", "Priority", "Status"];

function norm(s) {
  return String(s || "").trim().toLowerCase();
}

function uniq(values) {
  return Array.from(new Set(values.map(v => String(v || "").trim()).filter(Boolean)));
}

export async function GET() {
  try {
    const sheets = getSheetsClient();
    const spreadsheetId = process.env.SPREADSHEET_ID;

    // 1) Read header row (row 1)
    const headerRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${SHEET_NAME}!1:1`,
    });

    const headers = (headerRes.data.values?.[0] || []).map(norm);

    // 2) Find column index by header name (works even if columns are moved)
    const colIndex = {};
    for (const h of REQUIRED_HEADERS) {
      colIndex[norm(h)] = headers.indexOf(norm(h)); // -1 if not found (deleted/renamed)
    }

    // 3) Read all data rows (wide range so movement doesn’t matter)
    const dataRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${SHEET_NAME}!A2:ZZ`,
    });

    const rows = dataRes.data.values || [];

    // 4) Collect values safely (if column missing => empty list)
    const departments = [];
    const categories = [];
    const priorities = [];
    const statuses = [];

    for (const r of rows) {
      const iDept = colIndex["department"];
      const iCat = colIndex["category"];
      const iPri = colIndex["priority"];
      const iSta = colIndex["status"];

      if (iDept >= 0) departments.push(r[iDept]);
      if (iCat >= 0) categories.push(r[iCat]);
      if (iPri >= 0) priorities.push(r[iPri]);
      if (iSta >= 0) statuses.push(r[iSta]);
    }

    return NextResponse.json(
      {
        departments: uniq(departments),
        categories: uniq(categories),
        priorities: uniq(priorities),
        statuses: uniq(statuses),

        // debug info (helps if client renamed/deleted a column)
        meta: {
          sheet: SHEET_NAME,
          detectedColumns: colIndex, // shows index or -1
          note: "If any index is -1, that header is missing or renamed in the sheet.",
        },
      },
      {
        headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=300" },
      }
    );
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Failed to load config" },
      { status: 500 }
    );
  }
}
