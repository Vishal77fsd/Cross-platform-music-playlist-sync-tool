import { NextResponse } from "next/server";
import { clearSession } from "@/lib/auth/session";
import { logger } from "@/lib/logger";

export async function POST() {
  logger.info("[logout] POST request received");
  clearSession();
  return NextResponse.json({ message: "Logged out." });
}
