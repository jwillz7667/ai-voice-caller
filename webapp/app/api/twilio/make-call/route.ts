import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, config } = await request.json();
    
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

    // Store the callSid in session or database for later reference
    // You might want to create a call log entry here
    try {
      // This is a placeholder - you should associate this with the current user
      // For now, we'll just log it
      console.log("Call initiated with SID:", call.sid);
      // TODO: Create call log entry with callSid
    } catch (error) {
      console.error("Failed to store call log:", error);
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