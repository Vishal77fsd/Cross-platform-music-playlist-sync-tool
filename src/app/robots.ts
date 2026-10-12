import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/login", "/signup"],
        disallow: ["/dashboard/", "/api/"],
      },
    ],
    sitemap: "https://cross-platform-music-playlist-sync.vercel.app/sitemap.xml",
  };
}