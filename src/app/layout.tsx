import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://cross-platform-music-playlist-sync.vercel.app/"),
  
  title: {
    default: "music-migrate — Move Your Playlists Between Spotify & YouTube",
    template: "%s | music-migrate",
  },
  
  description:
    "Transfer playlists between Spotify and YouTube Music in minutes. " +
    "Matches every track by ISRC, title, and artist. Free, no credit card required.",

  keywords: [
    "playlist transfer",
    "spotify to youtube music",
    "youtube to spotify",
    "migrate playlist",
    "copy playlist",
    "music transfer tool",
    "playlist converter",
    "spotify playlist export",
    "youtube music import",
    "cross platform music",
  ],

  authors: [{ name: "music-migrate" }],
  creator: "music-migrate",

  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://cross-platform-music-playlist-sync.vercel.app/",
    siteName: "music-migrate",
    title: "music-migrate — Move Your Playlists Between Spotify & YouTube",
    description:
      "Transfer playlists between Spotify and YouTube Music in minutes. " +
      "Matches every track by ISRC, title, and artist. Free to use.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "music-migrate — Cross-platform playlist transfer",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "music-migrate — Move Your Playlists Between Spotify & YouTube",
    description:
      "Transfer playlists between Spotify and YouTube Music in minutes. Free to use.",
    images: ["/og-image.png"],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600&family=Fraunces:opsz,wght@9..144,500;9..144,600&family=IBM+Plex+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
