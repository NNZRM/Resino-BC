import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();
const jwtSecret = process.env.JWT_SECRET;

const db = await mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
});

// Authenticate JWT token
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401); // No token provided

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    // Invalid token
    if (err) return res.sendStatus(403); 

    req.user = user;
    next();
  });
}

// login endpoint - verifies user credentials and returns a JWT token
router.post('/login', async (req, res) => {
  console.log('📥 Login request received:', req.body);

  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Missing username or password" });
    }

    const [rows] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);
    console.log('🧑‍💻 Matching user(s):', rows);

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials (user not found)' });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    console.log('🔒 Password match?', match);

    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials (wrong password)' });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, jwtSecret, { expiresIn: '1h' });
    console.log('✅ JWT token generated:', token);

    res.json({ token });
  } catch (err) {
    console.error('❌ Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


export default router;
