import { pool } from "./pool";

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
  const result = await pool.query(`SELECT * FROM transfer_jobs WHERE id = $1`, [
    jobId,
  ]);

  return result.rows[0] ? mapRow(result.rows[0]) : null;
}

export async function getUserJobs(
  userId: string,
  page: number = 1,
): Promise<PaginatedJobs> {
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

  return {
    data: dataResult.rows.map(mapRow),
    meta: {
      totalItems,
      totalPages,
      currentPage: page,
      limit: LIMIT,
    },
  };
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
