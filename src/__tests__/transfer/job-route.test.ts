/** @jest-environment node */

import { GET } from "@/app/api/transfer/[jobId]/route";
import { getSession } from "@/lib/auth/session";
import { getJob } from "@/lib/db/jobs";
import { NextRequest } from "next/server";

jest.mock("@/lib/auth/session", () => ({
  getSession: jest.fn(),
}));

jest.mock("@/lib/db/jobs", () => ({
  getJob: jest.fn(),
}));

const job = {
  id: "job-123",
  userId: "user-123",
  sourcePlatform: "spotify",
  destinationPlatform: "ytmusic",
  sourcePlaylistId: "playlist-123",
  status: "completed" as const,
  totalTracks: 3,
  matchedCount: 2,
  unmatchedCount: 1,
  unmatchedTracks: [{ title: "Unknown song", artist: "Unknown artist" }],
  error: null,
  playlistName: "Favorites",
  createdAt: "2026-01-01T12:00:00.000Z",
  updatedAt: "2026-01-01T12:05:00.000Z",
};

function createRequest(jobId = "job-123") {
  return new NextRequest(`http://localhost:3000/api/transfer/${jobId}`);
}

function createContext(jobId = "job-123") {
  return { params: Promise.resolve({ jobId }) };
}

describe("GET /api/transfer/[jobId]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(getSession).mockResolvedValue({
      userId: "user-123",
      email: "user@example.com",
    });
  });

  it("returns transfer progress for the job owner", async () => {
    jest.mocked(getJob).mockResolvedValue(job);

    const response = await GET(createRequest(), createContext());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      jobId: "job-123",
      status: "completed",
      totalTracks: 3,
      matchedCount: 2,
      unmatchedCount: 1,
      matchPercent: 67,
      unmatchedTracks: [
        { title: "Unknown song", artist: "Unknown artist" },
      ],
      error: null,
      createdAt: "2026-01-01T12:00:00.000Z",
    });
    expect(getJob).toHaveBeenCalledWith("job-123");
  });

  it("returns 401 when the request is unauthenticated", async () => {
    jest.mocked(getSession).mockResolvedValue(null);

    const response = await GET(createRequest(), createContext());

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
    expect(getJob).not.toHaveBeenCalled();
  });

  it("returns 404 when the job does not exist", async () => {
    jest.mocked(getJob).mockResolvedValue(null);

    const response = await GET(createRequest(), createContext());

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "Job not found" });
  });

  it("does not return a job owned by another user", async () => {
    jest.mocked(getJob).mockResolvedValue({
      ...job,
      userId: "another-user",
    });

    const response = await GET(createRequest(), createContext());

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Forbidden" });
  });

  it("reports zero percent when the job has no tracks", async () => {
    jest.mocked(getJob).mockResolvedValue({
      ...job,
      totalTracks: 0,
      matchedCount: 0,
      unmatchedCount: 0,
    });

    const response = await GET(createRequest(), createContext());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.matchPercent).toBe(0);
  });
});
