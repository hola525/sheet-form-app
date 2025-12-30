import { NextResponse } from "next/server";
import { getSheetsClient } from "@/lib/googleSheet";

const SHEET_NAME = "Submissions";

// Normalize headers for matching (case-insensitive)
function norm(s) {
  return String(s || "").trim().toLowerCase();
}

export async function POST(req) {
  try {
    const sheets = getSheetsClient();
    const spreadsheetId = process.env.SPREADSHEET_ID;

    // 1) Get data from frontend
    const body = await req.json();
    const payload = {
      timestamp: new Date().toISOString(),
      "full name": String(body?.name || "").trim(), // map name -> Full Name
      email: String(body?.email || "").trim(),
      phone: String(body?.phone || "").trim(),
      department: String(body?.department || "").trim(),
      category: String(body?.category || "").trim(),
      priority: String(body?.priority || "").trim(),
      notes: String(body?.notes || "").trim(),
      status: String(body?.status || "Pending").trim(), // default
    };

    // 2) Basic validation
    if (!payload["full name"]) {
      return NextResponse.json({ ok: false, error: "Name is required" }, { status: 400 });
    }
    if (!payload.email) {
      return NextResponse.json({ ok: false, error: "Email is required" }, { status: 400 });
    }

    // 3) Read Submissions header row (to detect correct column order)
    const headerRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${SHEET_NAME}!1:1`,
    });

    const headersRaw = headerRes.data.values?.[0] || [];
    const headers = headersRaw.map(norm);

    // 4) Build row in the SAME order as headers
    // If a header exists in sheet but not in payload -> empty string
    const row = headers.map((h) => payload[h] ?? "");

    // 5) Append row (wide range so it never breaks)
    // We use A:ZZ to allow any number of columns
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${SHEET_NAME}!A:ZZ`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [row] },
    });

    return NextResponse.json({
      ok: true,
      meta: {
        usedHeaders: headersRaw,
      },
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Failed to submit" },
      { status: 500 }
    );
  }
}
