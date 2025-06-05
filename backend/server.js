import express from "express";
import multer from "multer";
import SFTPClient from "ssh2-sftp-client";
import path from "path";
import dotenv from "dotenv";
import cors from 'cors';
import { fetchAccount } from './zoho.js';

dotenv.config();

const app = express();
const port = 8000;

// CORS configuration
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));
//Store uploads in memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
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
app.post("/upload", upload.array("files"), async (req, res) => {
  const sftp = new SFTPClient();
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const folderName = `${year}/${year}-${month}`;
  const remoteBasePath = `/root/uploads/${folderName}`;

  try {
    await sftp.connect(sftpConfig);

    // Ensure year/month folders exist
    try { await sftp.mkdir(`/root/uploads/${year}`, true); } catch (e) {}
    try { await sftp.mkdir(remoteBasePath, true); } catch (e) {}

    const uploadedFiles = [];

    for (const file of req.files) {
      if (!allowedMimeTypes.includes(file.mimetype)) continue;

      const ext = path.extname(file.originalname);
      const baseName = path.basename(file.originalname, ext);

      // Timestamp in Danish format
      const formatter = new Intl.DateTimeFormat("da-DK", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
        timeZone: "Europe/Copenhagen"
      });

      const parts = formatter.formatToParts(new Date()).reduce((acc, part) => {
        acc[part.type] = part.value;
        return acc;
      }, {});

      const timestamp = `${parts.year}-${parts.month}-${parts.day}_${parts.hour}-${parts.minute}-${parts.second}`;
      const newFileName = `${baseName}_${timestamp}${ext}`;
      const remotePath = `${remoteBasePath}/${newFileName}`;

      console.log(`Uploading ${newFileName}`);
      await sftp.put(Buffer.from(file.buffer), remotePath);
      uploadedFiles.push(newFileName);
    }

    await sftp.end();

    res.status(200).json({
      message: "Filer uploadet korrekt",
      files: uploadedFiles
    });
  } catch (err) {
    console.error("Upload failed:", err);
    res.status(500).json({ error: "Upload mislykkedes" });
  }
});

// Endpoint to fetch Konto_Nummer1 from Zoho
import { fetchAccount } from './zoho.js';

app.post("/api/get-kontonummer", express.json(), async (req, res) => {
  const { accountId } = req.body;

  if (!accountId) {
    return res.status(400).json({ error: "Missing accountId in request body" });
  }

  try {
    const kontoNummer = await fetchAccount(accountId);

    if (!kontoNummer) {
      return res.status(404).json({ error: "Account not found or Konto_Nummer1 is empty" });
    }

    res.json({ kontoNummer });
  } catch (error) {
    console.error("Error fetching account:", error);
    res.status(500).json({ error: "Failed to fetch account data" });
  }
});


app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});