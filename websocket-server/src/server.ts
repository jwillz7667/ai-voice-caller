import express from "express";
import { WebSocketServer, WebSocket } from "ws";
import { IncomingMessage } from "http";
import dotenv from "dotenv";
import http from "http";
import { readFileSync } from "fs";
import { join } from "path";
import cors from "cors";
import * as sessionManager from "./sessionManager";
import functions from "./functionHandlers";
import handlebars from "handlebars";

dotenv.config();

const PORT = parseInt(process.env.PORT || "8081", 10);
const PUBLIC_URL = process.env.PUBLIC_URL || "";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";

if (!OPENAI_API_KEY) {
  console.error("OPENAI_API_KEY environment variable is required");
  process.exit(1);
}

const app = express();
app.use(cors());
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(express.urlencoded({ extended: false }));

const twimlPath = join(__dirname, "twiml.xml");
const twimlTemplate = readFileSync(twimlPath, "utf-8");
const twimlHandlebars = handlebars.compile(twimlTemplate);

app.get("/public-url", (req, res) => {
  res.json({ publicUrl: PUBLIC_URL });
});

app.all("/twiml", (req, res) => {
  const wsUrl = new URL(PUBLIC_URL);
  wsUrl.protocol = "wss:";
  wsUrl.pathname = `/call`;

  // Get recording configuration from session
  const recordingSession = sessionManager.session || {};
  const recordCall = recordingSession.recordCall !== undefined ? recordingSession.recordCall : true;
  const recordingType = recordingSession.recordingType || 'record-from-answer-dual';
  
  // Determine recording parameters based on session config
  const recording = recordCall ? 'true' : 'false';
  const recordingTrack = recordingType.includes('dual') ? 'both' : 'mono';
  const recordingStatusUrl = new URL("/recording-status", PUBLIC_URL).toString();
  
  // Logging for debugging
  console.log("=========== GENERATING TWIML ===========");
  console.log("Session recording settings:", {
    sessionHasRecordCall: recordingSession.recordCall !== undefined,
    recordCall, 
    recordingType,
    recordingTrack,
    recordingStatusUrl
  });
  
  // Use handlebars to render the template with all variables
  const twimlContent = twimlHandlebars({
    WS_URL: wsUrl.toString(),
    PUBLIC_URL: PUBLIC_URL,
    RECORDING: recording,
    RECORDING_TRACK: recordingTrack,
    RECORDING_TYPE: recordingType,
    RECORDING_STATUS_URL: recordingStatusUrl
  });
  
  console.log("Generated TwiML:", twimlContent);
  console.log("======================================");
  
  res.type("text/xml").send(twimlContent);
});

// Add new endpoint to handle recording status callbacks from Twilio
app.post("/recording-status", express.urlencoded({ extended: true }), (req, res) => {
  const recordingData = req.body;
  
  // Log EVERYTHING for debugging
  console.log("=========== RECORDING STATUS CALLBACK ===========");
  console.log("Recording status update received:", JSON.stringify(recordingData, null, 2));
  console.log("Request headers:", JSON.stringify(req.headers, null, 2));
  console.log("=================================================");
  
  // Log the recording URL and other details
  if (recordingData.RecordingUrl) {
    console.log("Recording URL:", recordingData.RecordingUrl);
    console.log("Recording SID:", recordingData.RecordingSid);
    console.log("Recording Status:", recordingData.RecordingStatus);
    console.log("Recording Duration:", recordingData.RecordingDuration, "seconds");
    
    // Store recording data
    const recording = sessionManager.addRecording(recordingData);
    
    // Send the recording information to any connected frontend clients
    sessionManager.broadcastToFrontend({
      type: "recording",
      data: recording
    });
  } else {
    console.error("No RecordingUrl found in callback data!");
    console.error("Full callback data:", recordingData);
  }
  
  res.status(200).send('Recording status received');
});

// Add API endpoint to get all recordings
app.get("/recordings", (req, res) => {
  try {
    const recordings = sessionManager.getRecordings();
    res.json(recordings);
  } catch (error) {
    console.error("Error fetching recordings:", error);
    res.status(500).json({ error: "Failed to fetch recordings" });
  }
});

// Add API endpoint to delete a recording
app.delete("/recordings/:sid", (req, res) => {
  try {
    const { sid } = req.params;
    const success = sessionManager.deleteRecording(sid);
    
    if (success) {
      res.status(200).json({ success: true });
    } else {
      res.status(404).json({ error: "Recording not found" });
    }
  } catch (error) {
    console.error("Error deleting recording:", error);
    res.status(500).json({ error: "Failed to delete recording" });
  }
});

// New endpoint to list available tools (schemas)
app.get("/tools", (req, res) => {
  res.json(functions.map((f) => f.schema));
});

// Add endpoint for initiating outgoing calls
app.post("/make-call", express.json(), async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    
    if (!phoneNumber) {
      res.status(400).json({ error: "Phone number is required" });
      return;
    }
    
    console.log("=========== MAKING OUTGOING CALL ===========");
    console.log("Phone number:", phoneNumber);
    
    // Verify Twilio credentials are available
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
      console.error("Missing Twilio credentials in environment variables");
      res.status(500).json({ error: "Missing Twilio credentials" });
      return;
    }
    
    console.log("Using Twilio credentials:", {
      accountSid: `${process.env.TWILIO_ACCOUNT_SID.substring(0, 5)}...`,
      authToken: "REDACTED",
      phoneNumber: process.env.TWILIO_PHONE_NUMBER
    });
    
    // Make sure we're using the secure public URL for production
    const twilioClient = require("twilio")(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    // Determine recording parameters based on session config (similar to /twiml logic)
    const recordingSession = sessionManager.session || {};
    const recordCall = recordingSession.recordCall !== undefined ? recordingSession.recordCall : true; // Default to true if not set
    const recordingType = recordingSession.recordingType || 'record-from-answer-dual'; // Default type
    const recordingTrack = recordingType.includes('dual') ? 'both' : 'inbound'; // 'both' for dual, 'inbound' or 'outbound' for mono

    // Construct the recording status callback URL
    const recordingStatusUrl = recordCall ? new URL("/recording-status", PUBLIC_URL).toString() : undefined;
    
    // Get the TwiML URL for the call
    const twimlUrl = new URL("/twiml", PUBLIC_URL).toString();
    console.log("TwiML URL:", twimlUrl);
    
    console.log("Call Creation Params:", {
        to: phoneNumber,
        from: process.env.TWILIO_PHONE_NUMBER,
        url: twimlUrl,
        record: recordCall,
        recordingChannels: recordCall ? recordingTrack : undefined,
        recordingStatusCallback: recordingStatusUrl,
        recordingStatusCallbackMethod: recordCall ? 'POST' : undefined,
        // Optional: specify events
        // recordingStatusCallbackEvent: recordCall ? ['in-progress', 'completed', 'failed'] : undefined
    });

    // *** ADDED LOGGING HERE ***
    console.log("Preparing to create call. Record setting:", recordCall);
    console.log("Transcribe parameter will be:", recordCall); 

    // Place the outgoing call using Twilio with recording parameters
    const call = await twilioClient.calls.create({
      to: phoneNumber,
      from: process.env.TWILIO_PHONE_NUMBER,
      url: twimlUrl,
      record: recordCall, // Tell Twilio to record the call leg
      recordingChannels: recordCall ? recordingTrack : undefined,
      recordingStatusCallback: recordingStatusUrl,
      recordingStatusCallbackMethod: recordCall ? 'POST' : undefined,
      transcribe: recordCall,
       // Optional: specify which events trigger the callback
       // recordingStatusCallbackEvent: recordCall ? ['in-progress', 'completed', 'failed'] : undefined
    });
    
    console.log("Call initiated:", {
      sid: call.sid,
      status: call.status
    });
    console.log("===========================================");
    
    res.json({ success: true, callSid: call.sid });
  } catch (error: any) {
    console.error("Error making outgoing call:", error);
    res.status(500).json({ 
      error: "Failed to make outgoing call", 
      message: error.message 
    });
  }
});

// Add this new endpoint for handling configuration data
app.post("/config", express.json(), (req: any, res: any) => {
  try {
    const config = req.body;
    console.log("=========== CONFIG UPDATE ===========");
    console.log("Received session configuration:", JSON.stringify(config, null, 2));
    
    // Store the configuration in the session manager
    if (sessionManager.setSessionConfig) {
      const result = sessionManager.setSessionConfig(config);
      console.log("Config update successful:", result);
      console.log("Updated session state:", {
        recordCall: sessionManager.session.recordCall,
        recordingType: sessionManager.session.recordingType
      });
      res.status(200).json({ success: true });
    } else {
      console.error("Session manager setSessionConfig not available");
      res.status(500).json({ error: "Session manager not available" });
    }
    console.log("===================================");
  } catch (error) {
    console.error("Error handling configuration:", error);
    res.status(500).json({ error: "Failed to process configuration" });
  }
});

let currentCall: WebSocket | null = null;
let currentLogs: WebSocket | null = null;

// Improved WebSocket connection handler
wss.on("connection", (ws: WebSocket, req: IncomingMessage) => {
  console.log(`New WebSocket connection: ${req.url}`);

  if (req.url === "/call") {
    console.log("New Twilio call connection established");
    sessionManager.handleCallConnection(ws, OPENAI_API_KEY);
  } else if (req.url === "/logs") {
    console.log("New frontend logs connection established");
    sessionManager.handleFrontendConnection(ws);
  } else {
    console.error(`Unknown WebSocket connection type: ${req.url}`);
    ws.close();
  }
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
