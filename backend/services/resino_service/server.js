import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { fetchAccount } from './zoho.js';
import { extractChartData } from './chartData.js';

dotenv.config({ path: '../../.env' });

const app = express();
const port = 8000;

app.use(cors());
app.use(express.json());

app.post('/get-kontonummer', async (req, res) => {
  const { accountId } = req.body;
  if (!accountId) return res.status(400).json({ error: "Missing accountId" });

  try {
    const kontoNummer = await fetchAccount(accountId);
    if (!kontoNummer) return res.status(404).json({ error: "Not found" });
    res.json({ kontoNummer });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch account" });
  }
});

app.get('/get-chart-data', async (req, res) => {
  const konto = req.query.konto;
  if (!konto) return res.status(400).json({ error: "Missing konto" });

  try {
    const bcDataDir = `/root/uploads/resino/bcdata`;
    const budgetDir = `/root/uploads/resino/budget`;
    const data = await extractChartData(konto, bcDataDir, budgetDir);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message || "Chart generation failed" });
  }
});

app.listen(port, () => {
  console.log(`Resino Service running on port ${port}`);
});
