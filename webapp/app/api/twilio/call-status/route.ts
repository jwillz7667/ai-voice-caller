import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Parse the form data from Twilio
    const formData = await request.formData();
    const body: any = {};
    formData.forEach((value, key) => {
      body[key] = value;
    });

    const {
      CallSid,
      CallStatus,
      CallDuration,
      Direction,
      _From,
      _To,
    } = body;

    // Log the call status update
    console.log("Call status webhook:", {
      CallSid,
      CallStatus,
      CallDuration,
      Direction,
    });

    // Update call log if it exists
    if (CallSid) {
      try {
        const callLog = await prisma.call_logs.findUnique({
          where: { call_sid: CallSid }
        });

        if (callLog) {
          const updateData: any = {
            status: CallStatus || callLog.status,
          };

          // Update duration if call completed
          if (CallStatus === 'completed' && CallDuration) {
            updateData.duration = parseInt(CallDuration);
            updateData.endedAt = new Date();
          }

          await prisma.call_logs.update({
            where: { call_sid: CallSid },
            data: updateData
          });

          console.log(`Call log updated for ${CallSid}: ${CallStatus}`);
        } else {
          console.warn(`Call log not found for call_sid: ${CallSid}`);
        }
      } catch (error) {
        console.error("Failed to update call log:", error);
      }
    }

    // Return success to Twilio
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error handling call status:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process call status" },
      { status: 500 }
    );
  }
}