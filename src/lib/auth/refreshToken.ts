import { SpotifyProvider } from "@/lib/adapters/spotify/SpotifyProvider";
import { YtMusicProvider } from "@/lib/adapters/ytmusic/YtMusicProvider";
import { upsertAccount } from "@/lib/db/accounts";
import type { ProviderAuthToken } from "@/lib/types/domain";
import type { AccountRecord } from "@/lib/db/accounts";

/**
 * Checks if a token is expired (or expiring within 5 minutes)
 * and refreshes it if needed. Saves the new token to the DB
 * and returns the fresh token ready to use.
 */

export async function getValidToken(
  account: AccountRecord,
): Promise<ProviderAuthToken> {
  const expiresAt = account.expiresAt
    ? new Date(account.expiresAt).getTime()
    : null;

  const fiveMinutes = 5 * 60 * 1000;

  const isExpired = expiresAt ? Date.now() >= expiresAt - fiveMinutes : false;

  const token: ProviderAuthToken = {
    provider: account.platform as ProviderAuthToken["provider"],
    accessToken: account.accessToken,
    refreshToken: account.refreshToken ?? undefined,
    expiresAt: expiresAt ?? undefined,
  };

  // Token is still valid — return as-is
  if (!isExpired) {
    return token;
  }

  console.log(`[token] ${account.platform} token expired, refreshing...`);

  let refreshed: ProviderAuthToken;
  if (account.platform === "spotify") {
    const provider = new SpotifyProvider();
    refreshed = await provider.refreshToken(token);
  } else if (account.platform === "ytmusic") {
    const provider = new YtMusicProvider();
    refreshed = await provider.refreshToken(token);
  } else {
    throw new Error(`No refresh logic for platform: ${account.platform}`);
  }

  // Save the new token back to the DB
  await upsertAccount({
    userId: account.userId,
    platform: account.platform,
    providerAccountId: account.providerAccountId,
    accessToken: refreshed.accessToken,
    refreshToken: refreshed.refreshToken ?? account.refreshToken,
    expiresAt: refreshed.expiresAt
      ? new Date(refreshed.expiresAt).toISOString()
      : new Date(Date.now() + 3600 * 1000).toISOString(),
  });

  return refreshed;
}
