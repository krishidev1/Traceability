const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const { Pool } = require('pg');

const hasPgConfig = Boolean(process.env.PG_DATABASE || process.env.PG_USER || process.env.PG_HOST);
const connectionString = hasPgConfig ? "" : process.env.DATABASE_URL;

const poolConfig = connectionString
  ? { connectionString }
  : {
      user: (process.env.PG_USER || '').trim(),
      host: process.env.PG_HOST || 'localhost',
      database: process.env.PG_DATABASE,
      password: process.env.PG_PASSWORD,
      port: Number(process.env.PG_PORT || 5432),
    };

if (process.env.PG_SSL === 'true' || process.env.NODE_ENV === 'production') {
  poolConfig.ssl = { rejectUnauthorized: false };
}

const pool = new Pool(poolConfig);

module.exports = {
  query: (text, params) => pool.query(text, params),
  connect: () => pool.connect(),
  pool,
};
