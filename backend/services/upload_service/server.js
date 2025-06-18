import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import multer from 'multer';
import jwt from 'jsonwebtoken';
import { handleUpload } from './sftpUpload.js';

dotenv.config();

const app = express();
const port = 8000;

app.use(cors());
app.use(express.json());

const jwtSecret = process.env.JWT_SECRET;

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, jwtSecret, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
});

app.post('/upload', authenticateToken, upload.array('files'), handleUpload);

app.listen(port, () => {
  console.log(`Upload Service running on port ${port}`);
});