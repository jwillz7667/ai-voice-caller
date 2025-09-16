import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function GET(request: NextRequest) {
  try {
    // Get auth token from cookie
    const cookieStore = cookies();
    const token = cookieStore.get("auth-token");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify token
    let user_id: string;
    try {
      const decoded = jwt.verify(token.value, JWT_SECRET) as { user_id: string };
      userId = decoded.userId;
    } catch (_error) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Fetch call history for the user
    const callLogs = await prisma.call_logs.findMany({
      where: {
        userId
      },
      include: {
        recording: {
          select: {
            id: true,
            recording_url: true,
            duration: true
          }
        }
      },
      orderBy: {
        created_at: "desc"
      },
      take: limit,
      skip: offset
    });

    // Get total count for pagination
    const total = await prisma.call_logs.count({
      where: {
        userId
      }
    });

    return NextResponse.json({
      callLogs,
      total,
      limit,
      offset
    });
  } catch (error) {
    console.error("Error fetching call history:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch call history" },
      { status: 500 }
    );
  }
}