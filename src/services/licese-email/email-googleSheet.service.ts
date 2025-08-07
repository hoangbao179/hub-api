import axios from "axios";
import jwt from "jsonwebtoken";

// Lấy từ .env
const SHEET_ID = process.env.SHEET_ID!;
const SHEET_NAME_EMAIL = "email"; // Sheet name
const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!;
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, '\n');

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const SCOPE = "https://www.googleapis.com/auth/spreadsheets";

let cachedAccessToken: string | null = null;
let cachedExpire = 0;

// Tạo access token
async function getAccessToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  if (cachedAccessToken && cachedExpire > now + 60) return cachedAccessToken;

  const payload = {
    iss: GOOGLE_SERVICE_ACCOUNT_EMAIL,
    scope: SCOPE,
    aud: GOOGLE_TOKEN_URL,
    exp: now + 3600,
    iat: now,
  };

  const jwtToken = jwt.sign(payload, GOOGLE_PRIVATE_KEY, { algorithm: "RS256" });

  const res = await axios.post(GOOGLE_TOKEN_URL, new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion: jwtToken,
  }));

  cachedAccessToken = res.data.access_token;
  cachedExpire = now + res.data.expires_in;
  return cachedAccessToken;
}

// Get user theo username (trả về username và count nếu tồn tại)
export async function getUserByUsername(username: string) {
  const accessToken = await getAccessToken();
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET_NAME_EMAIL}!A:B`;
  const res = await axios.get(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const rows = res.data.values || [];
  for (let i = 1; i < rows.length; i++) { // Bỏ dòng tiêu đề
    if (rows[i][0] && rows[i][0].trim() === username.trim()) {
      return {
        row: i + 1,
        username: rows[i][0],
        count: parseInt(rows[i][1], 10) || 0,
      };
    }
  }
  return null;
}

// Update count (chỉ dùng cho create)
export async function updateCount(username: string, newCount: number) {
  const accessToken = await getAccessToken();
  const urlGet = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET_NAME_EMAIL}!A:B`;
  const res = await axios.get(urlGet, { headers: { Authorization: `Bearer ${accessToken}` } });
  const rows = res.data.values || [];
  let rowIdx = -1;
  for (let i = 1; i < rows.length; i++) { // Bỏ dòng tiêu đề
    if (rows[i][0] && rows[i][0].trim() === username.trim()) {
      rowIdx = i;
      break;
    }
  }
  if (rowIdx !== -1) {
    const range = `${SHEET_NAME_EMAIL}!B${rowIdx + 1}`;
    const urlUpdate = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${range}?valueInputOption=USER_ENTERED`;
    await axios.put(
      urlUpdate,
      { values: [[newCount]] },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
  }
}