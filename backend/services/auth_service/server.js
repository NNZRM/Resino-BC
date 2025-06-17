import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import authRoutes from './auth.js';

dotenv.config({ path: '../../.env' });

const app = express();
const port = 8000;

app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);

app.listen(port, () => {
  console.log(`Auth Service running on port ${port}`);
});
//Test Docker
