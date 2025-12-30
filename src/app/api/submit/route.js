import { NextResponse } from "next/server";
import { google } from "googleapis";
import { Readable } from "stream";
import { getSheetsClient } from "@/lib/googleSheet";
// import { getSheetsClient } from "@/lib/googleSheet";

export const runtime = "nodejs"; // IMPORTANT: googleapis + streams need Node runtime

const SUBMISSIONS_SHEET = "Submissions";

function norm(s) {
  return String(s || "").trim().toLowerCase();
}

function getDriveClient() {
  const email = process.env.GOOGLE_CLIENT_EMAIL;
  const key = (process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n");

  const auth = new google.auth.JWT({
    email,
    key,
    scopes: [
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/drive",
    ],
  });

  return google.drive({ version: "v3", auth });
}

async function uploadToDrive(file) {
    if (!file || !file.name) return "";
  
    const drive = getDriveClient();
    const folderId = process.env.DRIVE_UPLOAD_FOLDER_ID;
    if (!folderId) throw new Error("Missing DRIVE_UPLOAD_FOLDER_ID in env.");
  
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const stream = Readable.from(buffer);
  
    // 1) Upload into Shared Drive folder
    const created = await drive.files.create({
      requestBody: {
        name: file.name,
        parents: [folderId], // folder inside Shared Drive
      },
      media: {
        mimeType: file.type || "application/octet-stream",
        body: stream,
      },
      fields: "id, webViewLink",
      supportsAllDrives: true, // ✅ REQUIRED for Shared Drives
    });
  
    const fileId = created?.data?.id;
    if (!fileId) throw new Error("Drive upload failed: no file id returned.");
  
    // 2) Set permission (also must support Shared Drives)
    await drive.permissions.create({
      fileId,
      requestBody: { role: "reader", type: "anyone" },
      supportsAllDrives: true, // ✅ REQUIRED for Shared Drives
    });
  
    // 3) Return link
    return created.data.webViewLink || `https://drive.google.com/file/d/${fileId}/view`;
  }
  
  
export async function POST(req) {
  try {
    const sheets = getSheetsClient();
    const spreadsheetId = process.env.SPREADSHEET_ID;

    // Read multipart form-data
    const form = await req.formData();

    const name = String(form.get("name") || "").trim();
    const email = String(form.get("email") || "").trim();
    const phone = String(form.get("phone") || "").trim();
    const department = String(form.get("department") || "").trim();
    const category = String(form.get("category") || "").trim();
    const priority = String(form.get("priority") || "").trim();
    const notes = String(form.get("notes") || "").trim();
    const status = String(form.get("status") || "Pending").trim();

    const file = form.get("file"); // File or null

    // Basic validation
    if (!name) return NextResponse.json({ ok: false, error: "Name is required" }, { status: 400 });
    if (!email) return NextResponse.json({ ok: false, error: "Email is required" }, { status: 400 });

    // Upload file (if exists)
    let attachmentUrl = "";
    if (file && typeof file === "object" && file.name) {
      attachmentUrl = await uploadToDrive(file);
    }

    // Read headers of Submissions dynamically
    const headerRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${SUBMISSIONS_SHEET}!1:1`,
    });

    const headersRaw = headerRes.data.values?.[0] || [];
    const headers = headersRaw.map(norm);

    // Map values by header name (dynamic)
    const payload = {
      timestamp: new Date().toISOString(),
      "full name": name,
      email,
      phone,
      department,
      category,
      priority,
      notes,
      status,
      "attachment url": attachmentUrl,
    };

    const row = headers.map((h) => payload[h] ?? "");

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${SUBMISSIONS_SHEET}!A:ZZ`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [row] },
    });

    return NextResponse.json({ ok: true, attachmentUrl });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Failed to submit" },
      { status: 500 }
    );
  }
}
