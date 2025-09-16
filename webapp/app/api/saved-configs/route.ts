import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// GET saved configurations
export async function GET(_request: NextRequest) {
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

    // Fetch saved configurations for the user
    const savedConfigs = await prisma.saved_configurations.findMany({
      where: {
        userId
      },
      orderBy: [
        { last_used_at: "desc" },
        { created_at: "desc" }
      ]
    });

    return NextResponse.json(savedConfigs);
  } catch (error: any) {
    console.error("Error fetching saved configs:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch saved configurations" },
      { status: 500 }
    );
  }
}

// POST - Save a new configuration
export async function POST(request: NextRequest) {
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

    const { name, description, configuration } = await request.json();

    if (!name || !configuration) {
      return NextResponse.json(
        { error: "Name and configuration are required" },
        { status: 400 }
      );
    }

    // Create saved configuration
    const savedConfig = await prisma.saved_configurations.create({
      data: {
        userId,
        name,
        description: description || null,
        configuration
      }
    });

    return NextResponse.json(savedConfig);
  } catch (error: any) {
    console.error("Error saving configuration:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save configuration" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a saved configuration
export async function DELETE(request: NextRequest) {
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

    const searchParams = request.nextUrl.searchParams;
    const configId = searchParams.get("id");

    if (!configId) {
      return NextResponse.json(
        { error: "Configuration ID is required" },
        { status: 400 }
      );
    }

    // Delete the configuration (only if it belongs to the user)
    await prisma.saved_configurations.deleteMany({
      where: {
        id: configId,
        userId
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting configuration:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete configuration" },
      { status: 500 }
    );
  }
}