import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { findUserByEmail } from "@/lib/db/users";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch (err) {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  const { email, password } = (body ?? {}) as Record<string, unknown>;

  // FIX: Do not trim passwords, spaces are valid characters in passwords
  if (
    typeof email !== "string" ||
    !email.trim() ||
    typeof password !== "string" ||
    !password
  ) {
    return NextResponse.json(
      { error: "Please provide a valid email and password." },
      { status: 400 },
    );
  }

  const normalizedEmail = email.trim().toLowerCase();

  const userInDb = await findUserByEmail(normalizedEmail);

  // FIX: Prevent User Enumeration. Use a generic message for missing users OR wrong passwords.
  if (!userInDb) {
    return NextResponse.json(
      { message: "Invalid email or password.", status: "error" },
      { status: 401 }, // 401 Unauthorized
    );
  }

  // FIX: Added proper 403 Forbidden status code for unverified accounts
  if (!!userInDb.isVerified) {
    return NextResponse.json(
      {
        message: "Please verify your email before logging in.",
        status: "error",
      },
      { status: 403 },
    );
  }

  const isPasswordValid = await verifyPassword(password, userInDb.passwordHash);

  // FIX: Added proper 401 Unauthorized status code
  if (!isPasswordValid) {
    return NextResponse.json(
      { message: "Invalid email or password.", status: "error" },
      { status: 401 },
    );
  }

  await createSession({
    userId: userInDb.id,
    email: userInDb.email,
  });

  // FIX: Data Leak. Explicitly pick only safe public fields to return.
  return NextResponse.json({
    user: {
      id: userInDb.id,
      email: userInDb.email,
      name: userInDb.name, // optional field example
    },
    status: "success",
  });
}
