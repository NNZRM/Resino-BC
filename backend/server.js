import express from "express";
import multer from "multer";
import SFTPClient from "ssh2-sftp-client";
import path from "path";
import dotenv from "dotenv";
import cors from 'cors';
import { fetchAccount } from './zoho.js';
import { extractChartData } from "./chartData.js";
import csv from "csv-parser";
import xlsx from "xlsx";
import stream from "stream";


dotenv.config();

const app = express();
const port = 8000;

//CORS config
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

//Store uploads in memory - 10 MB
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

app.use((req, res, next) => {
  console.log("Received request:", req.method, req.url);
  next();
});

//SFTP config
const sftpConfig = {
  host: process.env.SFTP_HOST,
  port: process.env.SFTP_PORT,
  username: process.env.SFTP_USER,
  password: process.env.SFTP_PASS,
};

const allowedMimeTypes = [
  "text/csv",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
];

//Endpoint to handle file uploads
app.post("/upload", upload.array("files"), async (req, res) => {
  const sftp = new SFTPClient();
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const folderName = `${year}/${year}-${month}`;
  const remoteBasePath = `/root/uploads/${folderName}`;

  try {
    await sftp.connect(sftpConfig);

    // Ensure folders exist
    try { await sftp.mkdir(`/root/uploads/${year}`, true); } catch (e) {}
    try { await sftp.mkdir(remoteBasePath, true); } catch (e) {}

    const uploadedFiles = [];

    const types = req.body.types; // Should align index-wise with files
    const typeArray = Array.isArray(types) ? types : [types]; // Handle single vs multi

    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const fileType = typeArray[i];

      if (!allowedMimeTypes.includes(file.mimetype)) continue;

      const newFileName = file.originalname;
      const typeFolder = fileType === "budget" ? "budget" : "bcdata";
      const remotePath = `${remoteBasePath}/${typeFolder}/${newFileName}`;

      // Ensure type folder exists
      try { await sftp.mkdir(`${remoteBasePath}/${typeFolder}`, true); } catch (e) {}

      console.log(`Uploading ${newFileName} to ${typeFolder}`);
      await sftp.put(Buffer.from(file.buffer), remotePath);
      uploadedFiles.push({ file: newFileName, type: fileType });
    }

    await sftp.end();

    res.status(200).json({
      message: "Filer uploadet korrekt og kategoriseret",
      files: uploadedFiles,
    });
  } catch (err) {
    console.error("Upload failed:", err);
    res.status(500).json({ error: "Upload mislykkedes" });
  }
});

//Endpoint to fetch Konto_Nummer1 from Zoho CRM
app.post("/get-kontonummer", express.json(), async (req, res) => {
  const { accountId } = req.body;

  if (!accountId) {
    return res.status(400).json({ error: "Missing accountId in request body" });
  }

  try {
    const kontoNummer = await fetchAccount(accountId);
    console.log("BACKEND Fetched Konto_Nummer1:", kontoNummer);

    if (!kontoNummer) {
      return res.status(404).json({ error: "Account not found or Konto_Nummer1 is empty" });
    }

    res.json({ kontoNummer });
  } catch (error) {
    console.error("BACKEND Error fetching account:", error);
    res.status(500).json({ error: "Failed to fetch account data" });
  }
});


//Get chart data for a specific Konto
app.get("/get-chart-data", async (req, res) => {
  const konto = req.query.konto;
  if (!konto) return res.status(400).json({ error: "Missing konto parameter" });

  try {
    const bcDataDir = `/root/uploads/2025/2025-06/bcdata`;
    const budgetDir = `/root/uploads/2025/2025-06/budget`;
    const data = await extractChartData(konto, bcDataDir, budgetDir);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message || "Could not generate chart data" });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});