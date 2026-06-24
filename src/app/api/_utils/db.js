import { Pool } from 'pg';

let pool = null;

function getPool() {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      // In build/prerender environments, environment variables might not be present.
      // We return a mock pool or warning instead of throwing instantly, to allow Next.js compilation.
      if (process.env.NEXT_PHASE === 'phase-production-build') {
        console.warn('Warning: DATABASE_URL is not defined in build phase. Using mock DB connection.');
        return {
          query: async () => ({ rows: [], rowCount: 0 })
        };
      }
      throw new Error('DATABASE_URL environment variable is missing.');
    }

    if (!global._postgresPool) {
      global._postgresPool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: false
        }
      });
    }
    pool = global._postgresPool;
  }
  return pool;
}

export default getPool;

export async function query(text, params) {
  const start = Date.now();
  try {
    const activePool = getPool();
    const res = await activePool.query(text, params);
    const duration = Date.now() - start;
    console.log(`Executed query: ${text.slice(0, 100)}... (${duration}ms)`);
    return res;
  } catch (error) {
    console.error(`Database query error: ${error.message} (Query: ${text})`);
    throw error;
  }
}
