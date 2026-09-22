import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

const COOKIE_NAME = "music-migrate-session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7; // 7 days

function getSecretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error(
      "SESSION_SECRET is not set. Add a long random string to .env.local.",
    );
  }
  return new TextEncoder().encode(secret);
}

export interface SessionPayload {
  userId: string;
  email: string;
}

/**
 * Creates a signed JWT and sets it as an httpOnly cookie on the
 * response. Call this right after a successful login or signup.
 */
export async function createSession(payload: SessionPayload): Promise<void> {
  const token = await new SignJWT({
    userId: payload.userId,
    email: payload.email,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecretKey());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true, // JS in the browser can't read this cookie
    secure: process.env.NODE_ENV === "production" ? true : false, // HTTPS only in prod
    sameSite: "lax", // sent on normal navigation, blocks most CSRF vectors
    maxAge: SESSION_DURATION_SECONDS,
    path: "/",
  });
}

/**
 * Reads and verifies the session cookie on the current request.
 * Returns null if there's no cookie, or it's invalid/expired/tampered.
 */
export async function getSession(
  req?: NextRequest,
): Promise<SessionPayload | null> {
  console.log("Session cookie value:", req?.cookies.get(COOKIE_NAME)?.value);
  const cookieStore = await cookies();
  const token = req
    ? req.cookies.get(COOKIE_NAME)?.value
    : cookieStore.get(COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, getSecretKey());

    return {
      userId: payload.userId as string,
      email: payload.email as string,
    };
  } catch (error) {
    // Invalid signature, expired, or malformed — treat as logged out.
    console.error("Error verifying session cookie:", error);
    return null;
  }
}

/** Clears the session cookie. Call this from a logout route. */
export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "", { maxAge: 0, path: "/" });
}
