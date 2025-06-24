import SFTPClient from "ssh2-sftp-client";
import dotenv from "dotenv";

dotenv.config();

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

export async function handleUpload(req, res) {
  const sftp = new SFTPClient();
  const remoteBasePath = `/uploads/resino`;

  try {
    //Set up SFTP connection
    await sftp.connect(sftpConfig);
    try { await sftp.mkdir(remoteBasePath, true); } catch (e) {}

    const uploadedFiles = [];
    const types = req.body.types;
    const typeArray = Array.isArray(types) ? types : [types];
    const cleanedFolders = new Set();

    //For each all the files
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const fileType = typeArray[i];

      //Check for accepted file types
      if (!allowedMimeTypes.includes(file.mimetype)) continue;

      
      //Each file is assigned to a folder based on its type from the html (either "budget" or "bcdata"). This is currently hardcoded and could be made more dynamic.
      const typeFolder = fileType === "budget" ? "budget" : "bcdata";
      const folderPath = `${remoteBasePath}/${typeFolder}`;
      const remotePath = `${folderPath}/${file.originalname}`;

      try { await sftp.mkdir(folderPath, true); } catch (e) {}

      //Clean old files
      if (!cleanedFolders.has(typeFolder)) {
        const existingFiles = await sftp.list(folderPath);
        for (const f of existingFiles) {
          if (f.name.endsWith(".csv") || f.name.endsWith(".xlsx")) {
            await sftp.delete(`${folderPath}/${f.name}`);
          }
        }
        cleanedFolders.add(typeFolder);
      }
      //File uploaded to its folder
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
