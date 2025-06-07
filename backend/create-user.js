import bcrypt from 'bcrypt';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const username = 'resino';
const plainPassword = 'resino123';

const run = async () => {
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  });
  console.log('Connected to database',username);

  const [result] = await db.execute(
    'INSERT INTO users (username, password) VALUES (?, ?)',
    [username, hashedPassword]
  );

  console.log(`User '${username}' created with ID:`, result.insertId);

  await db.end();
};

run().catch(err => {
  console.error('Error creating user:', err.message);
});
