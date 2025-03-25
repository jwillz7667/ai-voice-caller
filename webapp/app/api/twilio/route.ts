import { NextResponse } from "next/server";

export async function GET() {
  const credentialsSet = Boolean(
    process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  );
  return NextResponse.json({ credentialsSet });
}
