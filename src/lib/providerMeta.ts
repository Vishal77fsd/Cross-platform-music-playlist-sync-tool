export interface ProviderMeta {
  label: string;
  /** Used as a small accent dot, not a full brand-color treatment. */
  dotColor: string;
}

export const PROVIDER_META: Record<string, ProviderMeta> = {
  spotify: { label: "Spotify", dotColor: "#1db954" },
  ytmusic: { label: "YouTube Music", dotColor: "#ff0033" },
  apple_music: { label: "Apple Music", dotColor: "#fa233b" },
};

export function providerLabel(name: string): string {
  return PROVIDER_META[name]?.label ?? name;
}
