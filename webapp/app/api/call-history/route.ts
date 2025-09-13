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
    let userId: string;
    try {
      const decoded = jwt.verify(token.value, JWT_SECRET) as any;
      userId = decoded.userId;
    } catch (error) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Fetch call history for the user
    const callLogs = await prisma.callLog.findMany({
      where: {
        userId
      },
      include: {
        recording: {
          select: {
            id: true,
            recordingUrl: true,
            duration: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      take: limit,
      skip: offset
    });

    // Get total count for pagination
    const total = await prisma.callLog.count({
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
  } catch (error: any) {
    console.error("Error fetching call history:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch call history" },
      { status: 500 }
    );
  }
}