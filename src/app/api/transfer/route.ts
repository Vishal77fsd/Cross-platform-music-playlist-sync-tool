import { getSession } from "@/lib/auth/session";
import { findAccount } from "@/lib/db/accounts";
import { createJob } from "@/lib/db/jobs";
import { runTransferJob } from "@/lib/transfer/worker";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { sourcePlatform, destinationPlatform, playlistId, playlistName } = body ?? {};

  if (!sourcePlatform || !destinationPlatform || !playlistId) {
    return NextResponse.json(
      { error: "sourcePlatform, destinationPlatform and playlistId are required." },
      { status: 400 }
    );
  }

  if (sourcePlatform === destinationPlatform) {
    return NextResponse.json(
      { error: "Source and destination platforms must be different." },
      { status: 400 }
    );
  }

  // Verify both accounts are connected before creating the job
  const [sourceAccount, destAccount] = await Promise.all([
    findAccount(session.userId, sourcePlatform),
    findAccount(session.userId, destinationPlatform),
  ]);

  if (!sourceAccount) {
    return NextResponse.json(
      { error: `${sourcePlatform} is not connected.` },
      { status: 400 }
    );
  }

  if (!destAccount) {
    return NextResponse.json(
      { error: `${destinationPlatform} is not connected.` },
      { status: 400 }
    );
  }

  // Create the job record — returns immediately with a jobId
  const job = await createJob({
    userId: session.userId,
    sourcePlatform,
    destinationPlatform,
    sourcePlaylistId: playlistId,
  });

  // Fire the worker without awaiting it
  // The HTTP response returns while this runs in the background
  runTransferJob({
    jobId: job.id,
    userId: session.userId,
    sourcePlatform,
    destinationPlatform,
    sourcePlaylistId: playlistId,
    playlistName: playlistName ?? "Transferred playlist",
  }).catch((err) => {
    // Last-resort catch — worker already handles its own errors internally
    console.error(`[transfer] worker crashed outside try/catch:`, err);
  });

  // Return immediately — frontend polls /api/transfer/[jobId] for progress
  return NextResponse.json({ jobId: job.id }, { status: 202 });
}