import { google } from "googleapis";

const SHEET_ID = process.env.SHEET_ID || "";
const SHEET_NAME_INS = process.env.SHEET_NAME_INS || "Sheet1";

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

export interface LicenseInfo {
  row: number;
  key: string;
  expired: string;
  hwid: string;
}

export async function getLicenseByKey(key: string): Promise<LicenseInfo | null> {
  const range = `${SHEET_NAME_INS}!A:C`;
  const result = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range });
  const rows = result.data.values || [];
  for (let i = 0; i < rows.length; i++) {
    if (rows[i][0] && rows[i][0].trim() === key.trim()) {
      return {
        row: i + 1,
        key: rows[i][0],
        expired: rows[i][1],
        hwid: rows[i][2] || '',
      };
    }
  }
  return null;
}

export async function updateHWID(key: string, hwid: string): Promise<void> {
  const range = `${SHEET_NAME_INS}!A:C`;
  const result = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range });
  const rows = result.data.values || [];
  let rowIdx = -1;
  for (let i = 0; i < rows.length; i++) {
    if (rows[i][0] && rows[i][0].trim() === key.trim()) {
      rowIdx = i;
      break;
    }
  }
  if (rowIdx !== -1) {
    const cell = `${SHEET_NAME_INS}!C${rowIdx + 1}`;
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: cell,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[hwid]] },
    });
  }
}
