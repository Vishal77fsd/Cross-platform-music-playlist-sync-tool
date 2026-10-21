import { getSession } from "@/lib/auth/session";
import { getUserJobs } from "@/lib/db/jobs";
import { NextResponse, type NextRequest } from "next/server";
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  // Creating a child logger attaches context (like a module name) to every message
  const log = logger.child({ module: 'history' }); 
  
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

    // 1. Extract search parameters from the request URL
    const { searchParams } = new URL(req.url);
    
    // 2. Parse the page query parameter (defaulting to 1 if missing or invalid)
    const pageParam = searchParams.get("page");
    const page = pageParam ? parseInt(pageParam, 10) : 1;
    
    // Safeguard against negative numbers or NaN values passed into the URL string
    const validatedPage = isNaN(page) || page < 1 ? 1 : page;

    // 3. Pass the validated page integer to your paginated database engine function
    const jobs = await getUserJobs(session.userId, validatedPage);
    log.info({ jobs: jobs }, 'Processing jobs');

    return NextResponse.json({ jobs });
  } catch (error) {
    console.error("Failed to fetch user jobs:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
