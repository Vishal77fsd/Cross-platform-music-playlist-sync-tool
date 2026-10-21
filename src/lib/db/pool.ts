import { Pool } from "pg";
import { logger } from "../logger";

declare global {
  var _pgPool: Pool | undefined;
}

function createPool(): Pool {
  logger.info("[db] Creating new PostgreSQL connection pool");
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not defined in the environment variables.",
    );
  }

  return new Pool({
    connectionString,
  });
}

export const pool = globalThis._pgPool ?? createPool();

if (process.env.NODE_ENV !== "production") {
  globalThis._pgPool = pool;
}
