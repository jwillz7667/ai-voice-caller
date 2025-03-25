import { NextResponse } from "next/server";
import twilioClient from "@/lib/twilio";

export async function POST(request: Request) {
  try {
    // Basic rate limiting - in production, you would use a more robust solution
    const requestHeaders = new Headers(request.headers);
    const clientIp = requestHeaders.get('x-forwarded-for') || 'unknown';
    
    const content = await request.json();
    const { phoneNumber, config, userId } = content;

    // Validate phone number format with regex (international format)
    if (!phoneNumber || typeof phoneNumber !== 'string') {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }
    
    // Validate phone number format with regex (international format)
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return NextResponse.json(
        { error: "Invalid phone number format. Please use international format (e.g., +12125551234)" },
        { status: 400 }
      );
    }

    // Validate config if provided
    if (config && typeof config !== 'object') {
      return NextResponse.json(
        { error: "Invalid configuration format" },
        { status: 400 }
      );
    }

    // Validate user ID
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    if (!twilioClient) {
      return NextResponse.json(
        { error: "Twilio client is not configured" },
        { status: 500 }
      );
    }

    // Check for from number
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;
    if (!fromNumber) {
      return NextResponse.json(
        { 
          error: "Missing Twilio phone number", 
          message: "Please set TWILIO_PHONE_NUMBER in your .env file. The number should include the country code (e.g., +12125551234)." 
        },
        { status: 400 }
      );
    }

    // Get the URL for the TwiML
    const backendUrl = process.env.BACKEND_URL || "";
    
    // Check if the backendUrl is valid for Twilio (must be public and https for production)
    if (!backendUrl || backendUrl.includes('localhost') || backendUrl.includes('127.0.0.1')) {
      return NextResponse.json(
        { 
          error: "Invalid backend URL for Twilio", 
          message: "Twilio requires a publicly accessible URL for webhooks. Please set a valid BACKEND_URL environment variable or use a service like ngrok to expose your local server." 
        },
        { status: 400 }
      );
    }
    
    // Save the configuration to the backend server before making the call
    if (config) {
      try {
        // Send the configuration to the backend server
        const backendResponse = await fetch(`${backendUrl}/config`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(config),
        });
        
        if (!backendResponse.ok) {
          console.warn('Failed to send configuration to backend server');
        }
      } catch (configError) {
        console.error('Error sending configuration to backend:', configError);
      }
    }
    
    const twimlUrl = `${backendUrl}/twiml`;
    
    // URL for status callbacks
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.PUBLIC_URL;
    if (!appUrl) {
      return NextResponse.json(
        { 
          error: "Missing application URL", 
          message: "Please set NEXT_PUBLIC_APP_URL in your environment variables." 
        },
        { status: 400 }
      );
    }
    const statusCallbackUrl = `${appUrl}/api/twilio/call-status?userId=${encodeURIComponent(userId)}`;

    // Make the outgoing call
    const call = await twilioClient.calls.create({
      to: phoneNumber,
      from: fromNumber,
      url: twimlUrl,
      statusCallback: statusCallbackUrl,
      statusCallbackEvent: ['completed'],
      statusCallbackMethod: 'POST',
      trim: 'do-not-trim',
      record: false,
      recordingStatusCallback: statusCallbackUrl,
      recordingStatusCallbackMethod: 'POST',
      recordingStatusCallbackEvent: ['completed'],
      sendDigits: undefined,
      sipAuthUsername: undefined,
      sipAuthPassword: undefined,
      fallbackUrl: undefined,
      fallbackMethod: 'POST',
    });

    return NextResponse.json({ success: true, callSid: call.sid });
  } catch (error: any) {
    console.error("Error making outgoing call:", error);
    
    // Provide more specific error messages for common Twilio errors
    let errorMessage = error.message;
    if (error.code === 21213) {
      errorMessage = "No 'From' number is specified. Please add TWILIO_PHONE_NUMBER to your environment variables.";
    } else if (error.code === 21214) {
      errorMessage = "Invalid 'To' phone number format. Make sure to include the country code (e.g., +12125551234).";
    } else if (error.code === 20003) {
      errorMessage = "Authentication Error. Check your Twilio credentials (TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN).";
    }
    
    return NextResponse.json(
      { error: "Failed to make outgoing call", message: errorMessage },
      { status: 500 }
    );
  }
}
