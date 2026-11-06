/** @jest-environment node */
import { POST } from "@/app/api/transfer/route";
import { getSession } from "@/lib/auth/session";
import { NextRequest } from "next/server";

jest.mock("@/lib/auth/session", () => ({
  getSession: jest.fn(),
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

jest.mock("@/lib/db/jobs", () => ({
  createJob: jest.fn().mockResolvedValue({
    id: "mock-job-123",
    userId: "mock-user-123",
    sourcePlatform: "spotify",
    destinationPlatform: "ytmusic",
    playlistId: "playlist-123",
    playlistName: "My Playlist",
    status: "pending",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }),
}));

jest.mock("@/inngest/client", () => ({
  inngest: {
    send: jest.fn().mockResolvedValue({}),
  },
}));

describe("POST /api/transfer successfull request", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return 202 and jobId on valid request", async () => {
    (getSession as jest.Mock).mockResolvedValue({
      userId: "mock-user-123",
      email: "vishal@gmail.com",
    });

    const request = new NextRequest("http://localhost:3000/api/transfer", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sourcePlatform: "spotify",
        destinationPlatform: "ytmusic",
        playlistId: "playlist-123",
        playlistName: "My Playlist",
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(202);
    expect(body).toEqual({ jobId: "mock-job-123" });
  });
});

describe("POST /api/transfer in case of sourcePlatform, destinationPlatform or playlistId not provided", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return 400 when sourcePlatform is missing", async () => {
    (getSession as jest.Mock).mockResolvedValue({
      userId: "mock-user-123",
      email: "vishal@gmail.com",
    });

    const request = new NextRequest("http://localhost:3000/api/transfer", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      error: "sourcePlatform, destinationPlatform and playlistId are required.",
    });
  });
});

describe("POST /api/transfer in case of sourcePlatform and destinationPlatform are same", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return 500 when sourcePlatform and destinationPlatform are same", async () => {
    (getSession as jest.Mock).mockResolvedValue({
      userId: "mock-user-123",
      email: "vishal@gmail.com",
    });

    const request = new NextRequest("http://localhost:3000/api/transfer", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sourcePlatform: "spotify",
        destinationPlatform: "spotify",
        playlistId: "playlist-123",
        playlistName: "My Playlist",
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      error: "Source and destination platforms must be different.",
    });
  });
});
