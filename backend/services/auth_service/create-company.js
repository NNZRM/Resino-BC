import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// cd /var/www/resino-bc/Resino-BC/backend/services/auth_service
// node create-company.js

// Set name, slug
const name = 'Resino';
const slug = 'resino';

const run = async () => {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  });

  const [result] = await db.execute(
    'INSERT INTO companies (name, slug) VALUES (?, ?)',
    [name, slug]
  );

  console.log(`Company '${name}' created with ID:`, result.insertId);

  await db.end();
};

run().catch(err => {
  console.error('Error creating company:', err.message);
});
