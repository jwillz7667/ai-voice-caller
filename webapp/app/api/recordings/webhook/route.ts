import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { callSid, recordingSid, recording_url, duration, status } = await request.json();
    
    console.log("Recording webhook received:", {
      callSid,
      recordingSid,
      recording_url,
      duration,
      status
    });

    if (!callSid || !recordingSid || !recording_url) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Find the call log by callSid
    const callLog = await prisma.call_logs.findUnique({
      where: { call_sid }
    });

    if (!callLog) {
      console.warn(`Call log not found for call_sid: ${ call_sid }`);
      // Store the recording anyway, we might match it later
      // For now, return success to avoid Twilio retries
      return NextResponse.json({ success: true, warning: "Call log not found" });
    }

    // Check if recording already exists
    const existingRecording = await prisma.recordings.findUnique({
      where: { recording_sid }
    });

    if (existingRecording) {
      return NextResponse.json({ 
        success: true, 
        message: "Recording already exists" 
      });
    }

    // Create the recording record
    const recording = await prisma.recordings.create({ data: {
        id: crypto.randomUUID(),
        call_log_id: callLog.id,
        recordingSid,
        recording_url: recording_url + ".mp3", // Append .mp3 for direct download
        duration: parseInt(duration) || 0,
        status: status || "completed",
        created_at: new Date(),
        updated_at: new Date()
      }
    });

    // Update call log duration if needed
    if (duration && callLog.duration === 0) {
      await prisma.call_logs.update({
        where: { id: callLog.id },
        data: { duration: parseInt(duration) }
      });
    }

    return NextResponse.json({
      success: true,
      recordingId: recording.id
    });
  } catch (error: any) {
    console.error("Error handling recording webhook:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process recording" },
      { status: 500 }
    );
  }
}
