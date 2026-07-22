import { providerRegistry } from "./ProviderRegistry";
import { SpotifyProvider } from "../adapters/spotify/SpotifyProvider";
import { YtMusicProvider } from "../adapters/ytmusic/YtMusicProvider";

/**
 * Registers every available adapter with the provider registry.
 *
 * This is the ONLY place new providers get wired in. To add a new
 * platform later (Apple Music, Tidal, ...):
 *   1. Write a class in src/lib/adapters/<name>/ that implements MusicProvider
 *   2. Import it here and call providerRegistry.register(new YourProvider())
 * No other file needs to change.
 *
 * Call this once, lazily, the first time anything needs the registry —
 * see getProviderRegistry() below. Next.js can load API route modules
 * multiple times in dev, so registration is guarded to avoid
 * "already registered" errors on hot reload.
 */
let registered = false;

export function getProviderRegistry() {
  if (!registered) {
    providerRegistry.register(new SpotifyProvider());
    providerRegistry.register(new YtMusicProvider());
    registered = true;
  }
  return providerRegistry;
}
