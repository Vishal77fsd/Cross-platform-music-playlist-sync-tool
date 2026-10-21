import { getSession } from "@/lib/auth/session";
import { findAccount } from "@/lib/db/accounts";
import { NextResponse, type NextRequest } from "next/server";
import { pool } from "@/lib/db/pool";
import { logger } from "@/lib/logger";

export async function GET(req: NextRequest) {
  logger.info("[accounts] GET request received");
  const session = await getSession(req);

  if (!session) {
    return NextResponse.json(
      {
        error: "Unauthorized",
      },
      { status: 401 },
    );
  }

  // Check each platform
  const [spotify, ytmusic] = await Promise.all([
    findAccount(session.userId, "spotify"),
    findAccount(session.userId, "ytmusic"),
  ]);

  return NextResponse.json({
    connected: {
      spotify: !!spotify,
      ytmusic: !!ytmusic,
    },
  });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession(req);

  if (!session) {
    return NextResponse.json(
      {
        error: "Unauthorized",
      },
      { status: 401 },
    );
  }

  const { searchParams } = new URL(req.url);
  const platform = searchParams.get("platform");

  if (!platform) {
    return NextResponse.json({ error: "Platform required" }, { status: 400 });
  }

  await pool.query(
    "DELETE FROM accounts WHERE user_id = $1 AND platform = $2",
    [session.userId, platform],
  );

  return NextResponse.json({ message: "Disconnected." });
}
