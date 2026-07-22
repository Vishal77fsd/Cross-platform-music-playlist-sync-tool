import { createSession } from "@/lib/auth/session";
import { NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth/password";
import { createUser, findUserByEmail } from "@/lib/db/users";

const PG_UNIQUE_VIOLATION = "23505";

interface PgError {
  code?: string;
}

function hasPgErrorCode(err: unknown): err is PgError {
  return typeof err === "object" && err !== null && "code" in err;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch (error) {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  const { name, email, password } = (body ?? {}) as Record<string, unknown>;

  if (
    typeof name !== "string" ||
    !name.trim() ||
    typeof email !== "string" ||
    !email.trim() ||
    typeof password !== "string" ||
    password.length < 8
  ) {
    return NextResponse.json(
      {
        error:
          "Please provide a valid name, email, and password (min 8 chars).",
      },
      { status: 400 },
    );
  }

  const trimmedName = name.trim();
  const trimmedEmail = email.trim();

  try {
    const existing = await findUserByEmail(trimmedEmail);

    if (existing) {
      return NextResponse.json(
        { error: "An account with that email already exists." },
        { status: 409 },
      );
    }

    const passwordHash = await hashPassword(password);
    const user = await createUser({
      email: trimmedEmail,
      name: trimmedName,
      passwordHash: passwordHash
    });

    await createSession({ userId: user.id, email: user.email });

    return NextResponse.json(
      {
        message: "Account Created",
        user: { id: user.id, name: user.name, email: user.email },
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    if (hasPgErrorCode(error) && error.code === PG_UNIQUE_VIOLATION) {
      return NextResponse.json(
        { error: "An account with that email already exists." },
        { status: 409 },
      );
    }

    console.error("[signup] unexpected error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
