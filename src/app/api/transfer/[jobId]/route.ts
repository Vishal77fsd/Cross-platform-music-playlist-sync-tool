import { getSession } from "@/lib/auth/session";
import { getJob } from "@/lib/db/jobs";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  context: {
    params: Promise<{ jobId: string }>;
  },
) {
  const session = await getSession(request);

  if (!session) {
    return NextResponse.json(
      {
        error: "Unauthorized",
      },
      { status: 401 },
    );
  }
  const { jobId } = await context.params;
  const job = await getJob(jobId);

  if (!job) {
    return NextResponse.json(
      {
        error: "Job not found",
      },
      { status: 404 },
    );
  }

  // Only the owner can see their job
  if (session.userId !== job.userId) {
    return NextResponse.json(
      {
        error: "Forbidden",
      },
      { status: 401 },
    );
  }

  return NextResponse.json({
    jobId: job.id,
    status: job.status,
    totalTracks: job.totalTracks,
    matchedCount: job.matchedCount,
    unmatchedCount: job.unmatchedCount,
    matchPercent:
      job.totalTracks > 0
        ? Math.round((job.matchedCount / job.totalTracks) * 100)
        : 0,
    unmatchedTracks: job.unmatchedTracks,
    error: job.error,
    createdAt: job.createdAt,
  });
}
