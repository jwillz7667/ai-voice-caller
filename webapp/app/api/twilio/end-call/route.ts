import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

export async function POST(req: NextRequest) {
  try {
    const { callSid } = await req.json();

    if (!callSid) {
      return NextResponse.json(
        { error: "Call SID is required" },
        { status: 400 }
      );
    }

    if (!client) {
      console.error("Twilio client not configured");
      return NextResponse.json(
        { error: "Twilio configuration missing" },
        { status: 500 }
      );
    }

    // Update the call to complete it
    const call = await client.calls(callSid).update({
      status: "completed",
    });

    return NextResponse.json({
      success: true,
      callSid: call.sid,
      status: call.status,
    });
  } catch (error: any) {
    console.error("Error ending call:", error);
    return NextResponse.json(
      { 
        error: "Failed to end call", 
        details: error.message 
      },
      { status: 500 }
    );
  }
}