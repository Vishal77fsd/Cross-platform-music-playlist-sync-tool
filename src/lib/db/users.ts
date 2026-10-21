import { logger } from "../logger";
import { pool } from "./pool";

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  isVerified: boolean;
  createdAt: string;
}

function mapRow(row: {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  is_verified: boolean;
  created_at: string;
}): UserRecord {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    passwordHash: row.password_hash,
    isVerified: row.is_verified,
    createdAt: row.created_at,
  };
}

export async function createUser(params: {
  email: string;
  name: string;
  passwordHash: string;
}): Promise<UserRecord> {
  logger.info(`[users] creating user with email: ${params.email}, name: ${params.name}`);
  const result = await pool.query(
    `INSERT INTO users (email, name, password_hash, is_verified)
        VALUES ($1, $2, $3, $4)
        RETURNING  id, email, name, password_hash, is_verified, created_at`,
    [params.email, params.name, params.passwordHash, false],
  );

  return mapRow(result.rows[0]);
}

export async function findUserByEmail(
  email: string,
): Promise<UserRecord | null> {
  logger.info(`[users] fetching user by email: ${email}`);
  const result = await pool.query(
    `
        SELECT id, name, email, password_hash, is_verified, created_at
        FROM users
        WHERE LOWER(email) = LOWER($1)
    `,
    [email],
  );
  return result.rows[0] ? mapRow(result.rows[0]) : null;
}
