import type { ProviderName } from "../types/domain";
import type { MusicProvider } from "./MusicProvider";

/**
 * Central registry of available provider adapters.
 *
 * Every other part of the app (routes, job queue, matcher) asks this
 * registry for a provider by name instead of importing adapter classes
 * directly. To add a new platform: write the adapter, call `register()`
 * once at startup. Nothing else needs to change.
 */
class ProviderRegistry {
  private providers = new Map<ProviderName, MusicProvider>();

  register(provider: MusicProvider): void {
    if (this.providers.has(provider.name)) {
      throw new Error(`Provider "${provider.name}" is already registered`);
    }
    this.providers.set(provider.name, provider);
  }

  get(name: ProviderName): MusicProvider {
    const provider = this.providers.get(name);
    if (!provider) {
      throw new Error(
        `No adapter registered for provider "${name}". Available: ${this.listNames().join(", ") || "none"}`
      );
    }
    return provider;
  }

  has(name: ProviderName): boolean {
    return this.providers.has(name);
  }

  listNames(): ProviderName[] {
    return [...this.providers.keys()];
  }

  list(): MusicProvider[] {
    return [...this.providers.values()];
  }
}

/** Singleton instance used throughout the app. */
export const providerRegistry = new ProviderRegistry();
