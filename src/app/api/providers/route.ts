import { NextResponse } from "next/server";
import { getProviderRegistry } from "@/lib/core/registerProviders";

/**
 * GET /api/providers
 * Returns the list of registered provider adapters, e.g.
 *   { "providers": [{ "name": "spotify" }, { "name": "ytmusic" }] }
 *
 * The transfer app page calls this instead of hardcoding platform
 * names, so adding a new adapter automatically shows up in the UI.
 */
export async function GET() {
  const registry = getProviderRegistry();
  const providers = registry.listNames().map((name) => ({ name }));
  return NextResponse.json({ providers });
}
