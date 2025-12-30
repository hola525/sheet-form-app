import { google } from "googleapis";

function getPrivateKey() {
  const key = process.env.GOOGLE_PRIVATE_KEY;
  if (!key) throw new Error("Missing GOOGLE_PRIVATE_KEY");
  return key.replace(/\\n/g, "\n"); // IMPORTANT for Vercel
}

export function getSheetsClient() {
  const email = process.env.GOOGLE_CLIENT_EMAIL;
  const key = getPrivateKey();

  if (!email) throw new Error("Missing GOOGLE_CLIENT_EMAIL");

  const auth = new google.auth.JWT({
    email,
    key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return google.sheets({ version: "v4", auth });
}
