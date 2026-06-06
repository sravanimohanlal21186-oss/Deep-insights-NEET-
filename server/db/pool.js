const { Pool } = require('pg');
const logger = require('../utils/logger');

let pool = null;

const createPool = () => {
  if (pool) return pool;

  pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'neet_insights',
    max: 50, // Max connections per worker
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  pool.on('error', (err) => {
    logger.error('Unexpected error on idle client', err);
  });

  return pool;
};

const query = async (text, params) => {
  const pool = createPool();
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.debug(`Query executed in ${duration}ms: ${text.substring(0, 50)}...`);
    return result;
  } catch (error) {
    logger.error('Database query error:', error);
    throw error;
  }
};

const getPool = () => createPool();

module.exports = {
  query,
  getPool,
  createPool,
};
