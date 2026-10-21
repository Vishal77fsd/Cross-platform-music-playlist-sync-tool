import { logger } from "../logger";
import { pool } from "./pool";

export interface AccountRecord {
  id: string;
  userId: string;
  platform: string;
  providerAccountId: string;
  accessToken: string;
  refreshToken: string | null;
  expiresAt: string;
}
function mapAccountRow(row: {
  id: string;
  user_id: string;
  platform: string;
  provider_account_id: string;
  access_token: string;
  refresh_token: string | null;
  expires_at: string | Date;
}): AccountRecord {
  return {
    id: row.id,
    userId: row.user_id,
    platform: row.platform,
    providerAccountId: row.provider_account_id,
    accessToken: row.access_token,
    refreshToken: row.refresh_token,
    expiresAt:
      typeof row.expires_at === "string"
        ? row.expires_at
        : row.expires_at.toISOString(),
  };
}

export async function upsertAccount(params: {
  userId: string;
  platform: string;
  providerAccountId: string;
  accessToken: string;
  refreshToken: string | null;
  expiresAt: string;
}): Promise<AccountRecord> {
  logger.info(`[accounts] upserting account for userId: ${params.userId}, platform: ${params.platform}`
  );
  const result = await pool.query(
    `
    INSERT INTO accounts (user_id, platform, provider_account_id, access_token, refresh_token, expires_at)
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (user_id, platform) 
    DO UPDATE SET 
      access_token = EXCLUDED.access_token,
      refresh_token = COALESCE(EXCLUDED.refresh_token, accounts.refresh_token),
      expires_at = EXCLUDED.expires_at
    RETURNING id, user_id, platform, provider_account_id, access_token, refresh_token, expires_at
    `,
    [
      params.userId,
      params.platform,
      params.providerAccountId,
      params.accessToken,
      params.refreshToken,
      params.expiresAt,
    ],
  );

  return mapAccountRow(result.rows[0]);
}

export async function findAccount(
  userId: string,
  platform: string,
): Promise<AccountRecord | null> {
  logger.info(`[accounts] finding account for userId: ${userId}, platform: ${platform}`);
  const result = await pool.query(
    `
    SELECT id, user_id, platform, provider_account_id, access_token, refresh_token, expires_at
    FROM accounts
    WHERE user_id = $1 AND platform = $2`,
    [userId, platform],
  );

  if (result.rows.length === 0) {
    return null;
  }
  return mapAccountRow(result.rows[0]);
}
