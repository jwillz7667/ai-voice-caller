import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, config, userId: requestUserId } = await request.json();
    
    if (!phoneNumber) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    // Get Twilio credentials from environment variables
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
    const backendUrl = process.env.BACKEND_URL || "http://localhost:8081";
    const publicUrl = process.env.PUBLIC_URL || backendUrl;

    if (!accountSid || !authToken || !twilioPhoneNumber) {
      return NextResponse.json(
        { error: "Twilio credentials not configured" },
        { status: 500 }
      );
    }

    // Initialize Twilio client
    const client = twilio(accountSid, authToken);

    // Save the configuration to the backend if provided
    if (config) {
      try {
        await fetch(`${backendUrl}/session-config`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(config),
        });
      } catch (error) {
        console.error('Failed to save session config:', error);
      }
    }

    // Make the outgoing call with recording enabled
    const call = await client.calls.create({
      to: phoneNumber,
      from: twilioPhoneNumber,
      url: `${publicUrl}/twiml`, // The WebSocket server handles the TwiML
      statusCallback: `${publicUrl}/call-status`,
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
      statusCallbackMethod: 'POST',
      record: true, // Enable recording
      recordingStatusCallback: `${publicUrl}/recording-status`,
      recordingStatusCallbackMethod: 'POST',
      recordingStatusCallbackEvent: ['completed']
    });

    // Get user ID from auth token or request
    let userId = requestUserId;
    if (!userId) {
      try {
        const cookieStore = cookies();
        const token = cookieStore.get("auth-token");
        if (token) {
          const decoded = jwt.verify(token.value, JWT_SECRET) as any;
          userId = decoded.userId;
        }
      } catch (error) {
        console.error("Failed to get user ID from token:", error);
      }
    }

    // Create call log entry with configuration
    if (userId) {
      try {
        await prisma.callLog.create({
          data: {
            userId,
            callSid: call.sid,
            phoneNumber,
            direction: "outbound",
            status: call.status || "initiated",
            startedAt: new Date(),
            duration: 0, // Will be updated when call completes
            configuration: config || null, // Store the configuration used
            sessionId: call.sid // Use callSid as sessionId initially
          }
        });
        console.log("Call log created for SID:", call.sid);
      } catch (error) {
        console.error("Failed to create call log:", error);
        // Don't fail the call, just log the error
      }
    } else {
      console.warn("No user ID available, call log not created");
    }

    return NextResponse.json({
      success: true,
      callSid: call.sid,
      status: call.status,
      message: `Call initiated to ${phoneNumber}`,
    });
  } catch (error: any) {
    console.error("Error making call:", error);
    
    // Handle specific Twilio errors
    if (error.code === 20003) {
      return NextResponse.json(
        { error: "Invalid Twilio credentials" },
        { status: 401 }
      );
    }
    
    if (error.code === 21211) {
      return NextResponse.json(
        { error: "Invalid phone number format" },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || "Failed to initiate call" },
      { status: 500 }
    );
  }
}