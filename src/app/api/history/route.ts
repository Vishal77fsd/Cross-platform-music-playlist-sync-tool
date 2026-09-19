import { getSession } from "@/lib/auth/session";
import { getUserJobs } from "@/lib/db/jobs";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);

    if (!session || !session.userId) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        { status: 401 },
      );
    }

    const jobs = await getUserJobs(session.userId);

    return NextResponse.json({ jobs });
  } catch (error) {
    console.error("Failed to fetch user jobs:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
