import { NextResponse } from "next/server";
import twilioClient from "@/lib/twilio";

export async function POST(request: Request) {
  try {
    const { phoneNumber, config } = await request.json();

    if (!phoneNumber) {
      return NextResponse.json(
        { error: "Phone number is required" },
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
        // Ensure recording settings are included in the config
        const fullConfig = {
          ...config,
          // Add recording config if not already present
          recordCall: config.recordCall !== undefined ? config.recordCall : false,
          recordingType: config.recordingType || 'record-from-answer-dual',
        };
        
        console.log("Sending configuration to backend with recording settings:", {
          recordCall: fullConfig.recordCall,
          recordingType: fullConfig.recordingType
        });
        
        // Send the configuration to the backend server
        const backendResponse = await fetch(`${backendUrl}/config`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(fullConfig),
        });
        
        if (!backendResponse.ok) {
          console.warn('Failed to send configuration to backend server');
        }
      } catch (configError) {
        console.error('Error sending configuration to backend:', configError);
      }
    }
    
    const twimlUrl = `${backendUrl}/twiml`;

    // Extract recording settings from the config received from frontend
    const recordCall = config?.recordCall === true; // Check explicitly for true
    const recordingType = config?.recordingType || 'record-from-answer-dual';
    // Correctly set recordingChannels for the calls.create API ('mono' or 'dual')
    const recordingChannelsValue = recordingType.includes('dual') ? 'dual' : 'mono'; 
    const recordingStatusUrl = recordCall ? new URL("/recording-status", backendUrl).toString() : undefined;

    console.log("API Route: Preparing Twilio Call with settings:", {
        recordCall,
        recordingType,
        recordingChannels: recordingChannelsValue, // Log the correct parameter value
        transcribe: recordCall, // Transcribe if recording is enabled
        recordingStatusUrl
    });

    // Make the outgoing call
    const call = await twilioClient.calls.create({
      to: phoneNumber,
      from: fromNumber,
      url: twimlUrl,
      // Add recording and transcription parameters here
      record: recordCall,
      // Use the corrected 'mono' or 'dual' value
      recordingChannels: recordCall ? recordingChannelsValue : undefined, 
      recordingStatusCallback: recordingStatusUrl,
      recordingStatusCallbackMethod: recordCall ? 'POST' : undefined,
      transcribe: recordCall // Enable transcription if recording is enabled
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
