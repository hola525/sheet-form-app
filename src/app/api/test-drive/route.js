import { NextResponse } from "next/server";
import { google } from "googleapis";

export const runtime = "nodejs";

function getDriveClient() {
  const email = process.env.GOOGLE_CLIENT_EMAIL;
  const key = (process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n");

  const auth = new google.auth.JWT({
    email,
    key,
    scopes: ["https://www.googleapis.com/auth/drive"],
  });

  return google.drive({ version: "v3", auth });
}

export async function GET() {
  try {
    const drive = getDriveClient();
    const folderId = process.env.DRIVE_UPLOAD_FOLDER_ID;

    // Try to read folder metadata (will fail if not shared)
    const res = await drive.files.get({
      fileId: folderId,
      fields: "id,name,mimeType",
    });

    return NextResponse.json({ ok: true, folder: res.data });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 });
  }
}
