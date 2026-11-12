import { RedisClient } from "redis";
import { logger } from "../logger";
import { pool } from "./pool";
import { getRedisClient } from "@/lib/redis"; // Your Redis client instance
const CACHE_TTL_SECONDS = 60 * 5; // 5 minutes
const LIMIT = 5; // Limit the number of jobs returned for a user
export interface TransferJobRecord {
  id: string;
  userId: string;
  sourcePlatform: string;
  destinationPlatform: string;
  sourcePlaylistId: string;
  status:
    | "pending"
    | "running"
    | "completed"
    | "failed"
    | "paused"
    | "partial_completed";
  totalTracks: number;
  matchedCount: number;
  unmatchedCount: number;
  unmatchedTracks: { title: string; artist: string }[];
  error: string | null;
  playlistName: string | null;
  createdAt: string;
  updatedAt: string;
}

interface PaginatedJobs {
  data: TransferJobRecord[];
  meta: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    limit: number;
  };
}

function mapRow(row: {
  id: string;
  user_id: string;
  source_platform: string;
  destination_platform: string;
  source_playlist_id: string;
  status: string;
  total_tracks: number;
  matched_count: number;
  unmatched_count: number;
  unmatched_tracks: { title: string; artist: string }[];
  error: string | null;
  playlist_name: string | null;
  created_at: string;
  updated_at: string;
}): TransferJobRecord {
  return {
    id: row.id,
    userId: row.user_id,
    sourcePlatform: row.source_platform,
    destinationPlatform: row.destination_platform,
    sourcePlaylistId: row.source_playlist_id,
    status: row.status as TransferJobRecord["status"],
    totalTracks: row.total_tracks,
    matchedCount: row.matched_count,
    unmatchedCount: row.unmatched_count,
    unmatchedTracks: row.unmatched_tracks ?? [],
    error: row.error,
    playlistName: row.playlist_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createJob(params: {
  userId: string;
  sourcePlatform: string;
  destinationPlatform: string;
  sourcePlaylistId: string;
  playlistName: string;
}): Promise<TransferJobRecord> {
  logger.info(
    `[jobs] creating job for userId: ${params.userId}, sourcePlatform: ${params.sourcePlatform}, destinationPlatform: ${params.destinationPlatform}, sourcePlaylistId: ${params.sourcePlaylistId}`,
  );
  const result = await pool.query(
    `
            INSERT INTO transfer_jobs 
            (user_id, source_platform, destination_platform, source_playlist_id, playlist_name)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *`,
    [
      params.userId,
      params.sourcePlatform,
      params.destinationPlatform,
      params.sourcePlaylistId,
      params.playlistName,
    ],
  );

  return mapRow(result.rows[0]);
}

export async function getJob(jobId: string): Promise<TransferJobRecord | null> {
  logger.info(`[jobs] fetching job with jobId: ${jobId}`);
  const result = await pool.query(`SELECT * FROM transfer_jobs WHERE id = $1`, [
    jobId,
  ]);

  return result.rows[0] ? mapRow(result.rows[0]) : null;
}

export async function getUserJobs(
  userId: string,
  page: number = 1,
): Promise<PaginatedJobs> {
  logger.info(`[jobs] fetching jobs for userId: ${userId}, page: ${page}`);

  // CREATE a unique, predictable key per user and page
  const cacheKey = `user:${userId}:jobs:page:${page}`;

  try {
    // Check redis first(cache hit)
    const redis = await getRedisClient();
    const cached = await redis.get(cacheKey);

    if (cached) {
      logger.debug({ userId, page }, "Cache hit for user jobs");
      return JSON.parse(cached);
    }
  } catch (err) {
    // Graceful degradation: log the error and fall through to the database
    logger.error(
      { err, userId, page },
      "Redis read failed, falling back to DB",
    );
  }

  const offset = (page - 1) * LIMIT;

  // 1. Fetch the total count of jobs for this specific user
  const countResult = await pool.query(
    `SELECT COUNT(*) FROM transfer_jobs WHERE user_id = $1`,
    [userId],
  );

  const totalItems = parseInt(countResult.rows[0].count, 10);

  // 2. Fetch the paginated rows
  const dataResult = await pool.query(
    `
        SELECT * FROM transfer_jobs
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT ${LIMIT} OFFSET $2
        `,
    [userId, offset],
  );

  // 3. Calculate total pages (math ceiling ensures a partial page counts as a full page)
  const totalPages = Math.ceil(totalItems / LIMIT);
  const response: PaginatedJobs = {
    data: dataResult.rows.map(mapRow),
    meta: {
      totalItems,
      totalPages,
      currentPage: page,
      limit: LIMIT,
    },
  };

  // SAVE THE result for redis for subsequent request
  try {
    const redis = await getRedisClient();
    await redis.set(cacheKey, JSON.stringify(response), {
      EX: CACHE_TTL_SECONDS,
    });
  } catch (err) {
    logger.error({ err, userId, page }, "Redis write failed");
  }
  return response;
}

export async function updateJob(
  jobId: string,
  updates: {
    status?: TransferJobRecord["status"];
    totalTracks?: number;
    matchedCount?: number;
    unmatchedCount?: number;
    unmatchedTracks?: { title: string; artist: string }[];
    error?: string | null;
  },
): Promise<void> {
  logger.info(
    `[jobs] updating job with jobId: ${jobId}, updates: ${JSON.stringify(updates)}`,
  );
  const fields: string[] = ["updated_at = now()"];
  const values: unknown[] = [];
  let i = 1;

  if (updates.status !== undefined) {
    fields.push(`status = $${i++}`);
    values.push(updates.status);
  }

  if (updates.totalTracks !== undefined) {
    fields.push(`total_tracks = $${i++}`);
    values.push(updates.totalTracks);
  }
  if (updates.matchedCount !== undefined) {
    fields.push(`matched_count = $${i++}`);
    values.push(updates.matchedCount);
  }
  if (updates.unmatchedCount !== undefined) {
    fields.push(`unmatched_count = $${i++}`);
    values.push(updates.unmatchedCount);
  }
  if (updates.unmatchedTracks !== undefined) {
    fields.push(`unmatched_tracks = $${i++}`);
    values.push(JSON.stringify(updates.unmatchedTracks));
  }
  if (updates.error !== undefined) {
    fields.push(`error = $${i++}`);
    values.push(updates.error);
  }

  values.push(jobId);

  await pool.query(
    `UPDATE transfer_jobs SET ${fields.join(", ")} WHERE id = $${i}`,
    values,
  );
}
