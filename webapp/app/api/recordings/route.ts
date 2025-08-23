import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";

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
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Fetch recordings for the user
    const recordings = await prisma.recording.findMany({
      where: {
        callLog: {
          userId
        }
      },
      include: {
        callLog: {
          select: {
            phoneNumber: true,
            direction: true,
            duration: true,
            startedAt: true,
            status: true
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
    const total = await prisma.recording.count({
      where: {
        callLog: {
          userId
        }
      }
    });

    return NextResponse.json({
      recordings,
      total,
      limit,
      offset
    });
  } catch (error: any) {
    console.error("Error fetching recordings:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch recordings" },
      { status: 500 }
    );
  }
}