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
    let user = await prisma.user.findUnique({
      where: { email: googleUser.email },
    });

    if (!user) {
      // Create new user
      user = await prisma.user.create({
        data: {
          email: googleUser.email,
          name: googleUser.name || googleUser.email.split("@")[0],
          googleId: googleUser.id,
          avatar: googleUser.picture,
          credits: 10, // Give initial credits for new users
          emailVerified: true, // Google accounts are pre-verified
        },
      });
    } else {
      // Update existing user with Google info
      user = await prisma.user.update({
        where: { email: googleUser.email },
        data: {
          googleId: googleUser.id,
          avatar: googleUser.picture || user.avatar,
          name: googleUser.name || user.name,
          emailVerified: true,
          lastLogin: new Date(),
        },
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
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