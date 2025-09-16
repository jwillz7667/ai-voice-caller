import { NextRequest, NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

export const dynamic = 'force-dynamic';

const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000/api/auth/google/callback"
);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      return NextResponse.redirect(
        new URL(`/auth/signin?error=${encodeURIComponent(error)}`, request.url)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL("/auth/signin?error=No authorization code provided", request.url)
      );
    }

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user info from Google
    const response = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to get user info from Google");
    }

    const googleUser = await response.json();

    // Check if user exists in database
    let user = await prisma.users.findUnique({
      where: { email: googleUser.email },
    });

    if (!user) {
      // Create new user
      user = await prisma.users.create({
        data: {
          email: googleUser.email,
          name: googleUser.name || googleUser.email.split("@")[0],
          avatar_url: googleUser.picture,
          credits: 10, // Give initial credits for new users
          email_verified: true, // Google accounts are pre-verified
        },
      });
    } else {
      // Update existing user with Google info
      user = await prisma.users.update({
        where: { email: googleUser.email },
        data: {
          avatar_url: googleUser.picture || user.avatar_url,
          name: googleUser.name || user.name,
          email_verified: true,
          last_login_at: new Date(),
        },
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar_url,
      },
      process.env.JWT_SECRET || "your-jwt-secret",
      { expiresIn: "7d" }
    );

    // Create response with redirect to dashboard
    const redirectResponse = NextResponse.redirect(new URL("/ai-dashboard", request.url));

    // Set auth cookie
    redirectResponse.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return redirectResponse;
  } catch (error: any) {
    console.error("Google OAuth callback error:", error);
    return NextResponse.redirect(
      new URL(`/auth/signin?error=${encodeURIComponent(error.message || "Authentication failed")}`, request.url)
    );
  }
}