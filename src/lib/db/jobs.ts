import { pool } from "./pool";

export interface TransferJobRecord {
  id: string;
  userId: string;
  sourcePlatform: string;
  destinationPlatform: string;
  sourcePlaylistId: string;
  status: "pending" | "running" | "completed" | "failed";
  totalTracks: number;
  matchedCount: number;
  unmatchedCount: number;
  unmatchedTracks: { title: string; artist: string }[];
  error: string | null;
  createdAt: string;
  updatedAt: string;
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
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createJob(params: {
  userId: string;
  sourcePlatform: string;
  destinationPlatform: string;
  sourcePlaylistId: string;
}): Promise<TransferJobRecord> {
  const result = await pool.query(
    `
            INSERT INTO transfer_jobs 
            (user_id, source_platform, destination_platform, source_playlist_id)
            VALUES ($1, $2, $3, $4)
            RETURNING *`,
    [
      params.userId,
      params.sourcePlatform,
      params.destinationPlatform,
      params.sourcePlaylistId,
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
): Promise<TransferJobRecord[]> {
  const result = await pool.query(
    `
        SELECT * FROM transfer_jobs
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT 20
        `,
    [userId],
  );

  return result.rows.map(mapRow);
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
