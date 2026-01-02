import { NextResponse } from "next/server";
import { getSheetsClient } from "@/lib/googleSheet";

const SHEET = "Submissions";

function norm(s) {
  return String(s || "").trim().toLowerCase();
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const email = String(searchParams.get("email") || "").trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ ok: false, error: "Email is required" }, { status: 400 });
    }

    const sheets = getSheetsClient();
    const spreadsheetId = process.env.SPREADSHEET_ID;

    // Read all rows
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${SHEET}!A1:ZZ`,
    });

    const values = res.data.values || [];
    if (values.length < 2) return NextResponse.json({ ok: true, plans: [] });

    const headers = values[0].map(norm);
    const rows = values.slice(1);

    const idxEmail = headers.indexOf("email");
    const idxStatus = headers.indexOf("status");

    const plans = rows
      .map((r) => {
        const obj = {};
        headers.forEach((h, i) => (obj[h] = r[i] ?? ""));
        return obj;
      })
      .filter((r) => {
        const e = String(r["email"] || "").toLowerCase();
        const status = String(r["status"] || "").toLowerCase();

        // Keep simple: show active + pending
        return e === email && (status === "active" || status === "pending");
      })
      .slice(-20)
      .reverse();

    return NextResponse.json({ ok: true, plans });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Failed to load plans" },
      { status: 500 }
    );
  }
}
