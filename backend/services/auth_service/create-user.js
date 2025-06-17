import bcrypt from 'bcrypt';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// I've done so we can only create users from the server side, not from the frontend.


// cd /var/www/resino-bc/Resino-BC/backend/services/auth_service
// node create-user.js

// Set password, username and company.
const username = '';
const plainPassword = '';
companyId = 1;

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
    'INSERT INTO users (username, password, company_id) VALUES (?, ?, ?)',
    [username, hashedPassword, companyId]
  );

  console.log(`User '${username}' created with ID:`, result.insertId);

  await db.end();
};

run().catch(err => {
  console.error('Error creating user:', err.message);
});
