import { getSession } from "@/lib/auth/session";
import { upsertAccount } from "@/lib/db/accounts";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { code } = await request.json();

    const session = await getSession();
    console.log("Retrieved session:", session);
    if (!session || !session.userId) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in first." },
        { status: 401 },
      );
    }

    if (!code) {
      return NextResponse.json(
        { error: "Missing authorization code" },
        { status: 400 },
      );
    }

    const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.error("Missing Spotify credentials in environment variables.");
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
      );
    }

    // Spotify requires application authentication credentials via Base64 Basic Auth
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString(
      "base64",
    );

    // Exchange authorization code for token payload
    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${basicAuth}`,
      },
      body: new URLSearchParams({
        code: code,
        redirect_uri: "http://127.0.0.1:3000/callback", // Must match dashboard exactly!
        grant_type: "authorization_code",
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("Spotify API error token payload response:", response);
      return NextResponse.json(
        { error: data.error_description || "Token swap failed" },
        { status: response.status },
      );
    }

    const appUserId = session.userId;

    //  Fetch user profile from Spotify to extract their providerAccountId
    const profileResponse = await fetch("https://api.spotify.com/v1/me", {
      headers: {
        Authorization: `Bearer ${data.access_token}`,
      },
    });

    const profileData = await profileResponse.json();
    if (!profileResponse.ok) {
      console.error("Failed to fetch Spotify user profile:", profileData);
      return NextResponse.json(
        { error: "Failed to verify platform profile identity" },
        { status: profileResponse.status },
      );
    }

    // 🕒 Calculate the absolute expiration date based on data.expires_in
    const expirySeconds = Number(data.expires_in) || 3600;
    const expiresAtDate = new Date(Date.now() + expirySeconds * 1000);

    // Convert the Date object into a clean ISO String format for PostgreSQL
    const expiresAtISOString = expiresAtDate.toISOString();

    // Save/Upsert everything securely into your PostgreSQL database
    const savedRecord = await upsertAccount({
      userId: appUserId,
      platform: "spotify",
      providerAccountId: profileData.id,
      accessToken: data.access_token,
      refreshToken: data.refresh_token || null,
      expiresAt: expiresAtISOString,
    });

    console.log("Successfully upserted account record:", savedRecord);
    // Return success payload back to your client
    return NextResponse.json({
      success: true,
      platform: savedRecord.platform,
      userId: savedRecord.userId,
      record: savedRecord,
    });
  } catch (error) {
    console.error("Network/Runtime Error during token exchange:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
