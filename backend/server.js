import express from "express";
import multer from "multer";
import SFTPClient from "ssh2-sftp-client";
import path from "path";
import dotenv from "dotenv";
import cors from 'cors';
import { fetchAccount } from './zoho.js';
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

  const sftp = new SFTPClient();
  const bcDataDir = `/root/uploads/2025/2025-06/bcdata`;

  try {
    await sftp.connect(sftpConfig);

    // Find most recent file
    const files = await sftp.list(bcDataDir);
    const targetFile = files
      .filter(f => f.name.endsWith(".csv") || f.name.endsWith(".xlsx"))
      .sort((a, b) => new Date(b.modifyTime) - new Date(a.modifyTime))[0];

    if (!targetFile) {
      await sftp.end();
      return res.status(404).json({ error: "No file found in bcdata folder." });
    }

    console.log(`Found target file: ${targetFile.name}`);
    const fullPath = `${bcDataDir}/${targetFile.name}`;
    const monthOrder = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December", "January"
    ];

    //CSV
    if (targetFile.name.endsWith(".csv")) {
      const fileBuffer = await sftp.get(fullPath);
      const readable = new stream.Readable();
      readable._read = () => {};
      readable.push(fileBuffer);
      readable.push(null);

      const parser = readable.pipe(csv({ separator: ";" }));
      for await (const row of parser) {
        if (row["Account no."] === konto && row["Annual Revenue"]) {
          const annualRevenue = parseFloat(row["Annual Revenue"]);
          const lastYearRevenue = parseFloat(row["Last years revenue"]);
          console.log(`Found account ${konto} with annual revenue: ${annualRevenue}`);
          console.log(`Found account ${konto} with last year's revenue: ${lastYearRevenue}`);
          await sftp.end();

          const monthlyStep = annualRevenue / monthOrder.length;
          const monthlyStepLast = lastYearRevenue / monthOrder.length;

          return res.json({
            labels: monthOrder,
            values: monthOrder.map((_, i) => monthlyStep * (i + 1)),
            valuesLastYear: monthOrder.map((_, i) => monthlyStepLast * (i + 1))
          });
        }
      }
    }


    //XLSX
    else if (targetFile.name.endsWith(".xlsx")) {
      const fileBuffer = await sftp.get(fullPath);
      const workbook = xlsx.read(fileBuffer, { type: "buffer" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = xlsx.utils.sheet_to_json(sheet, { defval: "" });

      for (const row of rows) {
        if (row["Account no."] === konto && row["Annual Revenue"]) {
          const annualRevenue = parseFloat(row["Annual Revenue"]);
          const lastYearRevenue = parseFloat(row["Last years revenue"]);
          console.log(`Found account ${konto} with annual revenue: ${lastYearRevenue}`);
          console.log(`Found account ${konto} with annual revenue: ${annualRevenue}`);
          await sftp.end();

          const monthlyAnnualStep = annualRevenue / monthOrder.length;
          const monthlyStepLast = lastYearRevenue / monthOrder.length;

          return res.json({
            labels: monthOrder,
            values: monthOrder.map((_, i) => monthlyAnnualStep * (i + 1)),
            valuesLastYear: monthOrder.map((_, i) => monthlyStepLast * (i + 1))
          });
        }
      }
    }

    await sftp.end();
    return res.status(404).json({ error: "No matching account found in data file." });

  } catch (error) {
    console.error("Chart generation failed:", error);
    res.status(500).json({ error: "Could not generate chart data" });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});