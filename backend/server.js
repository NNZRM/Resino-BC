import express from "express";
import multer from "multer";
import SFTPClient from "ssh2-sftp-client";
import path from "path";
import dotenv from "dotenv";
import cors from 'cors';
import { fetchAccount } from './zoho.js';
import { extractChartData } from "./chartData.js";
import authRoutes, { authenticateToken } from './login/auth.js';


dotenv.config();

const app = express();
const port = 8000;

//Parse JSON request bodies
app.use(express.json());

//CORS config
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

//Body parser middleware
app.use('/auth', authRoutes);



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

// Endpoint to handle file uploads
app.post("/upload", authenticateToken, upload.array("files"), async (req, res) => {
  const sftp = new SFTPClient();
  const remoteBasePath = `/root/uploads/resino`;

  try {
    await sftp.connect(sftpConfig);

    // Ensure base folder exists
    try { await sftp.mkdir(remoteBasePath, true); } catch (e) {}

    const uploadedFiles = [];

    const types = req.body.types;
    const typeArray = Array.isArray(types) ? types : [types];

    // Track which folders we've already cleaned
    const cleanedFolders = new Set();

    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const fileType = typeArray[i];

      if (!allowedMimeTypes.includes(file.mimetype)) continue;

      const typeFolder = fileType === "budget" ? "budget" : "bcdata";
      const folderPath = `${remoteBasePath}/${typeFolder}`;
      const newFileName = file.originalname;
      const remotePath = `${folderPath}/${newFileName}`;

      // Ensure type folder exists
      try { await sftp.mkdir(folderPath, true); } catch (e) {}

      // Only clean the folder once per type
      if (!cleanedFolders.has(typeFolder)) {
        try {
          const existingFiles = await sftp.list(folderPath);
          for (const f of existingFiles) {
            if (f.name.endsWith(".csv") || f.name.endsWith(".xlsx")) {
              await sftp.delete(`${folderPath}/${f.name}`);
              console.log(`Deleted old file: ${folderPath}/${f.name}`);
            }
          }
        } catch (err) {
          console.error(`Error cleaning ${typeFolder} folder:`, err);
          throw err;
        }

        cleanedFolders.add(typeFolder);
      }

      // Upload file
      console.log(`Uploading ${newFileName} to ${typeFolder}`);
      await sftp.put(file.buffer, remotePath);
      uploadedFiles.push({ file: newFileName, type: fileType });
    }

    await sftp.end();

    res.status(200).json({
      message: "Files were uploaded correctly",
      files: uploadedFiles,
    });
  } catch (err) {
    console.error("Upload failed:", err);
    res.status(500).json({ error: "Upload failed" });
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
    const bcDataDir = `/root/uploads/resino/bcdata`;
    const budgetDir = `/root/uploads/resino/budget`;
    const data = await extractChartData(konto, bcDataDir, budgetDir);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message || "Could not generate chart data" });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});