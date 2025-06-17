import SFTPClient from "ssh2-sftp-client";
import dotenv from "dotenv";

//Yo

dotenv.config({path: '../../.env'});

const sftpConfig = {
  host: process.env.SFTP_HOST,
  port: process.env.SFTP_PORT,
  username: process.env.SFTP_USER,
  password: process.env.SFTP_PASS,
};
console.log("SFTP Config:", sftpConfig);

const allowedMimeTypes = [
  "text/csv",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
];

export async function handleUpload(req, res) {
  const sftp = new SFTPClient();
  const remoteBasePath = `/root/uploads/resino`; // You can make this dynamic later

  try {
    await sftp.connect(sftpConfig);
    try { await sftp.mkdir(remoteBasePath, true); } catch (e) {}

    const uploadedFiles = [];
    const types = req.body.types;
    const typeArray = Array.isArray(types) ? types : [types];
    const cleanedFolders = new Set();

    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const fileType = typeArray[i];

      if (!allowedMimeTypes.includes(file.mimetype)) continue;

      const typeFolder = fileType === "budget" ? "budget" : "bcdata";
      const folderPath = `${remoteBasePath}/${typeFolder}`;
      const remotePath = `${folderPath}/${file.originalname}`;

      try { await sftp.mkdir(folderPath, true); } catch (e) {}

      if (!cleanedFolders.has(typeFolder)) {
        const existingFiles = await sftp.list(folderPath);
        for (const f of existingFiles) {
          if (f.name.endsWith(".csv") || f.name.endsWith(".xlsx")) {
            await sftp.delete(`${folderPath}/${f.name}`);
          }
        }
        cleanedFolders.add(typeFolder);
      }

      await sftp.put(file.buffer, remotePath);
      uploadedFiles.push({ file: file.originalname, type: fileType });
    }

    await sftp.end();
    res.status(200).json({ message: "Files uploaded", files: uploadedFiles });
  } catch (err) {
    console.error("Upload failed:", err);
    res.status(500).json({ error: "Upload failed" });
  }
}
