import { NextRequest, NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000/api/auth/google/callback"
);

export async function POST(_request: NextRequest) {
  try {
    // Generate the Google OAuth URL
    const scopes = [
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
    ];

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: scopes,
      prompt: "consent",
    });

    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error("Google OAuth error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to initialize Google OAuth" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.json(
        { error: "Authorization code not provided" },
        { status: 400 }
      );
    }

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user info from Google
    const userInfoResponse = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      }
    );

    const googleUser = await userInfoResponse.json();

    // Check if user exists in database
    let user = await prisma.users.findUnique({
      where: { email: googleUser.email },
    });

    if (!user) {
      // Create new user
      user = await prisma.users.create({ data: {
        id: crypto.randomUUID(),
          email: googleUser.email,
          name: googleUser.name,
          avatar_url: googleUser.picture,
          credits: 10, // Give initial credits,
        created_at: new Date(),
        updated_at: new Date()
      },
      });
    } else {
      // Update existing user with Google info
      user = await prisma.users.update({
        where: { email: googleUser.email },
        data: {
          avatar_url: googleUser.picture,
          name: googleUser.name,
        },
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      process.env.JWT_SECRET || "your-jwt-secret",
      { expiresIn: "7d" }
    );

    // Set cookie and redirect to dashboard
    const response = NextResponse.redirect(new URL("/ai-dashboard", request.url));
    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error("Google OAuth callback error:", error);
    return NextResponse.redirect(
      new URL(`/auth/signin?error=${encodeURIComponent((error as Error).message)}`, request.url)
    );
  }
}