import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { sendVerificationEmail } from "@/lib/email";
import { generateToken } from "@/lib/auth/tokens";
import { UserRole, UserStatus } from "@prisma/client";

export const dynamic = 'force-dynamic';

interface RegisterBody {
  email: string;
  password: string;
  name?: string;
  username?: string;
  company?: string;
  phone?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: RegisterBody = await req.json();
    const { email, password, name, username, company, phone } = body;

    // Basic validation
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Password strength validation
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.users.findFirst({
      where: {
        OR: [
          { email },
          ...(username ? [{ username }] : [])
        ]
      }
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return NextResponse.json(
          { error: "Email already registered" },
          { status: 400 }
        );
      }
      if (username && existingUser.username === username) {
        return NextResponse.json(
          { error: "Username already taken" },
          { status: 400 }
        );
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.users.create({
      data: {
        id: crypto.randomUUID(),
        email,
        password: hashedPassword,
        name: name || email.split('@')[0],
        username,
        company,
        phone,
        status: UserStatus.PENDING,
        role: UserRole.USER,
        credits: 100, // Initial credits
        created_at: new Date(),
        updated_at: new Date()
      }
    });

    // Generate verification token
    const verificationToken = generateToken();
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.email_verifications.create({
      data: {
        id: crypto.randomUUID(),
        user_id: user.id,
        email: user.email,
        token: verificationToken,
        expires,
        created_at: new Date()
      }
    });

    // Send verification email
    await sendVerificationEmail(user.email, verificationToken);

    // Create welcome notification
    await prisma.notifications.create({
      data: {
        user_id: user.id,
        type: "INFO",
        title: "Welcome to Verbio AI!",
        message: "Please verify your email to get started."
      }
    });

    // Create audit log
    await createAuditLog({
      user_id: user.id,
      action: "REGISTER",
      entity: "User",
      entityId: user.id,
      metadata: {
        method: "email",
        ip: req.headers.get("x-forwarded-for") || req.ip
      }
    });

    // Track analytics
    await prisma.analytics.create({
      data: {
        user_id: user.id,
        event: "user.registered",
        properties: {
          method: "email",
          hasCompany: !!company,
          hasPhone: !!phone
        },
        ip: req.headers.get("x-forwarded-for") || req.ip,
        user_agent: req.headers.get("user-agent")
      }
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      message: "Registration successful. Please check your email to verify your account.",
      user: userWithoutPassword
    });

  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Registration failed. Please try again." },
      { status: 500 }
    );
  }
}