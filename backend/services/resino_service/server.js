import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { fetchAccount } from './zoho.js';
import { extractChartData } from './chartData.js';
import { authenticateToken } from '../../auth_service/auth.js';

dotenv.config({ path: '../../.env' });

const app = express();
const port = 8000;

app.use(cors());
app.use(express.json());

//Authenticate JWT token
app.use(authenticateToken);

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


app.get('/get-chart-data', authenticateToken, async (req, res) => {
  //Secure the endpoint to only resino company
  const { company_slug } = req.user;
  if (company_slug !== 'resino') {
    return res.status(403).json({ error: "Access denied" });
  }

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
