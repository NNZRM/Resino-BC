import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import multer from 'multer';
import { handleUpload } from './sftpUpload.js';
import { authenticateToken } from '../auth_service/auth.js';

dotenv.config({ path: '../../.env' });

const app = express();
const port = 8000;

app.use(cors());
app.use(express.json());

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
});

app.post('/upload', authenticateToken, upload.array('files'), handleUpload);

app.listen(port, () => {
  console.log(`Upload Service running on port ${port}`);
});
