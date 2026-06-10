const express = require('express');
const cors = require('cors');
const path = require('path');
const { readSheet, appendRow, getBusinessOverview } = require('./sheets');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

const corsOptions =
  process.env.NODE_ENV === 'production'
    ? { origin: process.env.ALLOWED_ORIGIN || true }
    : {};
app.use(cors(corsOptions));
app.use(express.json());

// --- API Routes ---

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get list of all businesses (sheets)
app.get('/api/businesses', async (req, res) => {
  try {
    const businesses = await getBusinessOverview();
    res.json({ businesses });
  } catch (error) {
    console.error('Error fetching businesses:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get all data for a specific business (sheet)
app.get('/api/business/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const rows = await readSheet(name);
    const headers = rows[0] || [];
    const data = rows.slice(1).filter((row) =>
      row.some((cell) => cell !== null && cell !== '')
    );
    res.json({ headers, data, name });
  } catch (error) {
    console.error(`Error fetching sheet ${req.params.name}:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

// Add a new entry (row) to a business sheet
app.post('/api/business/:name/entry', async (req, res) => {
  try {
    const { name } = req.params;
    const { row } = req.body;
    if (!row || !Array.isArray(row)) {
      return res.status(400).json({ error: 'Row data is required' });
    }
    await appendRow(name, row);
    res.json({ success: true });
  } catch (error) {
    console.error(`Error appending to ${req.params.name}:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

// Dashboard aggregated data
app.get('/api/dashboard', async (req, res) => {
  try {
    const businessNames = await getBusinessOverview();
    const businesses = [];

    for (const name of businessNames) {
      const rows = await readSheet(name);
      if (!rows || rows.length < 2) continue;

      const headers = rows[0];
      const data = rows.slice(1).filter((row) =>
        row.some((c) => c !== null && c !== '')
      );

      let totalInvestment = 0;
      let totalProfit = 0;
      let lastMonth = '';
      const investorShares = {};

      // Parse summary from known label positions in first ~10 rows
      for (const row of rows.slice(0, 10)) {
        for (let i = 0; i < row.length; i++) {
          const cell = String(row[i] || '').trim().toLowerCase();
          if (cell === 'total investment' && row[i + 1]) {
            totalInvestment =
              parseFloat(String(row[i + 1]).replace(/,/g, '')) || 0;
          }
          if (cell === 'total profit' && row[i + 1]) {
            totalProfit =
              parseFloat(String(row[i + 1]).replace(/,/g, '')) || 0;
          }
        }
      }

      // Fallback: compute totals from data rows if summary labels not found
      if (totalInvestment === 0) {
        for (const row of data) {
          const type = String(row[3] || '').toLowerCase();
          if (type === 'capital') {
            totalInvestment += parseFloat(String(row[0]).replace(/,/g, '')) || 0;
          }
        }
      }
      if (totalProfit === 0) {
        for (const row of data) {
          // Monthly profit in column 10 (K)
          const profitVal = parseFloat(String(row[10] || '').replace(/,/g, ''));
          if (!isNaN(profitVal)) {
            totalProfit += profitVal;
          }
        }
      }

      // Find the latest month from monthly data section
      const lastDataRow = data[data.length - 1];
      if (lastDataRow) {
        lastMonth = lastDataRow[12] || lastDataRow[5] || '';
      }

      // Investor share percentages from summary
      for (const row of rows.slice(0, 20)) {
        for (let i = 0; i < row.length; i++) {
          const cell = String(row[i] || '');
          const match = cell.match(/Share %\s*\(([^)]+)\)/i);
          if (match && row[i + 1]) {
            investorShares[match[1]] = parseFloat(row[i + 1]) || 0;
          }
        }
      }

      businesses.push({
        name,
        totalInvestment,
        totalProfit,
        lastMonth,
        investorShares,
        entryCount: data.length,
      });
    }

    res.json({ businesses });
  } catch (error) {
    console.error('Error building dashboard:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// --- Serve Frontend (production) ---
app.use(express.static(path.join(__dirname, '../dist')));
app.get('/{*splat}', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// --- Error handling middleware ---
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
