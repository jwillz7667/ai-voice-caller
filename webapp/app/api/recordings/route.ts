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
    const recordings = await prisma.recordings.findMany({
      where: {
        call_logs: { user_id }
      },
      include: {
        call_logs: {
          select: {
            phone_number: true,
            direction: true,
            duration: true,
            started_at: true,
            status: true
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
    const total = await prisma.recordings.count({
      where: {
        call_logs: { user_id }
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
