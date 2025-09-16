import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import speakeasy from "speakeasy";
import QRCode from "qrcode";
import { createAuditLog } from "@/lib/audit";

export async function GET(_req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.users.findUnique({
      where: { id: session.user.id },
      select: { email: true, two_factor_enabled: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    if (user.two_factor_enabled) {
      return NextResponse.json(
        { error: "2FA is already enabled" },
        { status: 400 }
      );
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `Verbio AI (${user.email})`,
      issuer: "Verbio AI",
      length: 32
    });

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url as string);

    // Store secret temporarily (you might want to use Redis for this)
    // For now, we'll store it in the database but not enable 2FA yet
    await prisma.users.update({
      where: { id: session.user.id },
      data: {
        two_factor_secret: secret.base32
      }
    });

    return NextResponse.json({
      secret: secret.base32,
      qrCode: qrCodeUrl,
      manualEntryKey: secret.base32
    });

  } catch (error) {
    console.error("2FA setup error:", error);
    return NextResponse.json(
      { error: "Failed to setup 2FA" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { token } = await req.json();

    if (!token) {
      return NextResponse.json(
        { error: "Verification token required" },
        { status: 400 }
      );
    }

    const user = await prisma.users.findUnique({
      where: { id: session.user.id },
      select: { two_factor_secret: true, two_factor_enabled: true }
    });

    if (!user?.two_factor_secret) {
      return NextResponse.json(
        { error: "2FA setup not initiated" },
        { status: 400 }
      );
    }

    if (user.two_factor_enabled) {
      return NextResponse.json(
        { error: "2FA is already enabled" },
        { status: 400 }
      );
    }

    // Verify token
    const verified = speakeasy.totp.verify({
      secret: user.two_factor_secret!,
      encoding: 'base32',
      token,
      window: 2
    });

    if (!verified) {
      return NextResponse.json(
        { error: "Invalid verification code" },
        { status: 400 }
      );
    }

    // Enable 2FA
    await prisma.users.update({
      where: { id: session.user.id },
      data: {
        two_factor_enabled: true
      }
    });

    // Generate backup codes
    const backupCodes = Array.from({ length: 10 }, () =>
      Math.random().toString(36).substring(2, 10).toUpperCase()
    );

    // Store backup codes (hashed in production)
    // You might want to create a separate table for this
    await prisma.users.update({
      where: { id: session.user.id },
      data: {
        metadata: {
          backupCodes: backupCodes // In production, hash these
        }
      }
    });

    // Create audit log
    await createAuditLog({
      user_id: session.user.id,
      action: "2FA_ENABLED",
      entity: "User",
      entityId: session.user.id,
      metadata: {
        ip: req.headers.get("x-forwarded-for") || req.ip
      }
    });

    return NextResponse.json({
      message: "2FA enabled successfully",
      backupCodes
    });

  } catch (error) {
    console.error("2FA verification error:", error);
    return NextResponse.json(
      { error: "Failed to enable 2FA" },
      { status: 500 }
    );
  }
}