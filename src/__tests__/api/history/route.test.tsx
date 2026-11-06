/** @jest-environment node */

import { GET } from "@/app/api/history/route";
import { NextRequest } from "next/server";

jest.mock("@/lib/auth/session", () => ({
  getSession: jest.fn().mockResolvedValue({
    userId: "mock-user-123",
    email: "vishal@example.com",
  }),
}));

jest.mock("@/lib/db/jobs", () => ({
  getUserJobs: jest.fn().mockResolvedValue({
    data: [],
    meta: {
      totalItems: 0,
      totalPages: 0,
      currentPage: 2,
      limit: 5,
    },
  }),
}));

import { getUserJobs } from "@/lib/db/jobs";

describe("GET /api/history handler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns paginated job lists for an authenticated request", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/history?page=2",
      {
        method: "GET",
        headers: {
          Authorization: "Bearer valid-token",
        },
      },
    );

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.jobs).toEqual({
      data: [],
      meta: {
        totalItems: 0,
        totalPages: 0,
        currentPage: 2,
        limit: 5,
      },
    });
    expect(getUserJobs).toHaveBeenCalledWith("mock-user-123", 2);
  });

  it("returns a 500 response when getUserJobs throws an error", async () => {
    jest.mocked(getUserJobs).mockRejectedValue(new Error("Database unavailable"));
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const request = new NextRequest("http://localhost:3000/api/history?page=2");

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: "Internal Server Error" });
    expect(consoleError).toHaveBeenCalledWith(
      "Failed to fetch user jobs:",
      expect.any(Error),
    );
  });
});
