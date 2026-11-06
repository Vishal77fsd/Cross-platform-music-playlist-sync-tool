/** @jest-environment node */

jest.mock("@/lib/auth/session", () => ({
  getSession: jest.fn().mockResolvedValue({
    userId: "mock-user-123",
    email: "vishal@example.com",
  }),
}));

jest.mock("@/lib/db/accounts", () => ({
  findAccount: jest.fn().mockResolvedValue({
    id: "account-123",
    userId: "mock-user-123",
    platform: "spotify",
    providerAccountId: "spotify-user-123",
    accessToken: "stored-access-token",
    refreshToken: "stored-refresh-token",
    expiresAt: "2099-01-01T00:00:00.000Z",
  }),
}));

jest.mock("@/lib/auth/refreshToken", () => ({
  getValidToken: jest.fn().mockResolvedValue({
    provider: "spotify",
    accessToken: "valid-access-token",
    refreshToken: "refresh-token",
    expiresAt: Date.now() + 60_000,
  }),
}));

const mockGetPlaylists = jest.fn();

jest.mock("@/lib/adapters/spotify/SpotifyProvider", () => ({
  SpotifyProvider: jest.fn().mockImplementation(() => ({
    getPlaylists: mockGetPlaylists,
  })),
}));

jest.mock("@/lib/adapters/ytmusic/YtMusicProvider", () => ({
  YtMusicProvider: jest.fn(),
}));

import { GET } from "@/app/api/playlists/route";
import { getValidToken } from "@/lib/auth/refreshToken";
import { getSession } from "@/lib/auth/session";
import { findAccount } from "@/lib/db/accounts";
import { NextRequest } from "next/server";

describe("GET /api/playlists handler", () => {
 beforeEach(() => {
   jest.clearAllMocks();
   jest.mocked(getSession).mockResolvedValue({
     userId: "mock-user-123",
     email: "vishal@example.com",
   });
   jest.mocked(findAccount).mockResolvedValue({
     id: "account-123",
     userId: "mock-user-123",
     platform: "spotify",
     providerAccountId: "spotify-user-123",
     accessToken: "stored-access-token",
     refreshToken: "stored-refresh-token",
     expiresAt: "2099-01-01T00:00:00.000Z",
   });
   jest.mocked(getValidToken).mockResolvedValue({
     provider: "spotify",
     accessToken: "valid-access-token",
     refreshToken: "refresh-token",
     expiresAt: Date.now() + 60_000,
   });
   mockGetPlaylists.mockResolvedValue([
     {
        providerId: "playlist-123",
        provider: "spotify",
        name: "Favorites",
        description: "My favorite songs",
        trackCount: 12,
      },
    ]);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns playlists when the user has a valid Spotify token", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/playlists?platform=spotify",
    );

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.playlists).toEqual([
      {
        providerId: "playlist-123",
        provider: "spotify",
        name: "Favorites",
        description: "My favorite songs",
        trackCount: 12,
      },
    ]);
    expect(findAccount).toHaveBeenCalledWith("mock-user-123", "spotify");
    expect(getValidToken).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "mock-user-123",
        platform: "spotify",
      }),
    );
    expect(mockGetPlaylists).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: "spotify",
        accessToken: "valid-access-token",
      }),
    );
  });

  it("returns 401 when the user is not authenticated", async () => {
    jest.mocked(getSession).mockResolvedValue(null);

    const response = await GET(
      new NextRequest("http://localhost:3000/api/playlists?platform=spotify"),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
    expect(findAccount).not.toHaveBeenCalled();
  });

  it("returns 400 when the platform parameter is missing", async () => {
    const response = await GET(
      new NextRequest("http://localhost:3000/api/playlists"),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "platform param required",
    });
    expect(findAccount).not.toHaveBeenCalled();
  });

  it("returns 400 when the requested platform is not connected", async () => {
    jest.mocked(findAccount).mockResolvedValue(null);

    const response = await GET(
      new NextRequest("http://localhost:3000/api/playlists?platform=spotify"),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "spotify is not connected. Go to Platforms to connect it.",
    });
  });

  it("returns 400 when the platform is unsupported", async () => {
    const response = await GET(
      new NextRequest(
        "http://localhost:3000/api/playlists?platform=amazonmusic",
      ),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: 'Platform "amazonmusic" is not supported yet.',
    });
  });

  it("returns 500 when the provider fails to fetch playlists", async () => {
    mockGetPlaylists.mockRejectedValue(new Error("Spotify unavailable"));
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const response = await GET(
      new NextRequest("http://localhost:3000/api/playlists?platform=spotify"),
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Failed to fetch playlists. Try reconnecting the platform.",
    });
    expect(consoleError).toHaveBeenCalledWith(
      "[playlists] spotify fetch failed:",
      expect.any(Error),
    );
  });
});
