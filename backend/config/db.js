const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

let Pool;
try {
  ({ Pool } = require('pg'));
} catch {
  ({ Pool } = require('../authenticationService/node_modules/pg'));
}

const hasPgConfig = Boolean(process.env.PG_DATABASE || process.env.PG_USER || process.env.PG_HOST);
const connectionString = hasPgConfig ? "" : process.env.DATABASE_URL;

const pool = connectionString
  ? new Pool({ connectionString })
  : new Pool({
      user: (process.env.PG_USER || '').trim(),
      host: process.env.PG_HOST || 'localhost',
      database: process.env.PG_DATABASE,
      password: process.env.PG_PASSWORD,
      port: Number(process.env.PG_PORT || 5432),
    });

module.exports = {
  query: (text, params) => pool.query(text, params),
  connect: () => pool.connect(),
  pool,
};
