const { google } = require('googleapis');
require('dotenv').config();

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

// --- In-memory cache ---
const cache = new Map();
const CACHE_TTL = 60_000; // 60 seconds

function getCached(key) {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.time < CACHE_TTL) return entry.data;
  cache.delete(key);
  return null;
}

function setCache(key, data) {
  cache.set(key, { data, time: Date.now() });
}

function invalidateCache() {
  cache.clear();
}

// --- Retry logic ---
async function withRetry(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === maxRetries - 1) throw err;
      if (err.code === 429 || err.code >= 500) {
        await new Promise((r) => setTimeout(r, Math.pow(2, i) * 1000));
      } else {
        throw err;
      }
    }
  }
}

// --- Auth ---
async function getAuthClient() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: SCOPES,
  });
  return auth;
}

async function getSheetsClient() {
  const auth = await getAuthClient();
  return google.sheets({ version: 'v4', auth });
}

// --- Sheet operations ---
async function readSheet(sheetName) {
  const cached = getCached(`read:${sheetName}`);
  if (cached) return cached;

  const sheets = await getSheetsClient();
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;

  const response = await withRetry(() =>
    sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A1:Z1000`,
    })
  );

  const data = response.data.values || [];
  setCache(`read:${sheetName}`, data);
  return data;
}

async function appendRow(sheetName, row) {
  invalidateCache();
  const sheets = await getSheetsClient();
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;

  await withRetry(() =>
    sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A:Z`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [row],
      },
    })
  );

  return { success: true };
}

async function getBusinessOverview() {
  const cached = getCached('businesses');
  if (cached) return cached;

  const sheets = await getSheetsClient();
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;

  const response = await withRetry(() =>
    sheets.spreadsheets.get({
      spreadsheetId,
      fields: 'sheets.properties.title',
    })
  );

  const businessSheets = response.data.sheets
    .map((s) => s.properties.title)
    .filter(
      (name) =>
        !['Overview', 'Config', 'Auth'].includes(name) &&
        !name.toLowerCase().startsWith('temp')
    );

  setCache('businesses', businessSheets);
  return businessSheets;
}

module.exports = {
  readSheet,
  appendRow,
  getBusinessOverview,
};
