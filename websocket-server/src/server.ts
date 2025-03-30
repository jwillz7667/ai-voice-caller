import express from "express";
import { WebSocketServer, WebSocket } from "ws";
import { IncomingMessage } from "http";
import dotenv from "dotenv";
import http from "http";
import { readFileSync } from "fs";
import { join } from "path";
import cors from "cors";
import Handlebars from "handlebars";
import * as sessionManager from "./sessionManager";
import functions from "./functionHandlers";

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
const twimlHandlebars = Handlebars.compile(twimlTemplate);

app.get("/public-url", (req, res) => {
  res.json({ publicUrl: PUBLIC_URL });
});

app.all("/twiml", (req, res) => {
  const wsUrl = new URL(PUBLIC_URL);
  wsUrl.protocol = "wss:";
  wsUrl.pathname = `/call`;
  
  // Get recording configuration - check process.env or use session config
  const recordCall = process.env.RECORD_CALL === 'true';
  const recordingStatusUrl = recordCall ? 
    new URL("/recording-status", PUBLIC_URL).toString() : 
    '';
  
  // Use Handlebars to render the template with all variables
  const twimlContent = twimlHandlebars({
    WS_URL: wsUrl.toString(),
    RECORD_CALL: recordCall,
    RECORDING_STATUS_URL: recordingStatusUrl
  });
  
  res.type("text/xml").send(twimlContent);
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
    
    // Make sure we're using the secure public URL for production
    const twilioClient = require("twilio")(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    
    // Get the TwiML URL for the call
    const twimlUrl = new URL("/twiml", PUBLIC_URL).toString();
    
    // Place the outgoing call using Twilio
    const call = await twilioClient.calls.create({
      to: phoneNumber,
      from: process.env.TWILIO_PHONE_NUMBER,
      url: twimlUrl,
    });
    
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
    console.log("Received session configuration:", config);
    
    // Store the configuration in the session manager
    if (sessionManager.setSessionConfig) {
      sessionManager.setSessionConfig(config);
      res.status(200).json({ success: true });
    } else {
      res.status(500).json({ error: "Session manager not available" });
    }
  } catch (error) {
    console.error("Error handling configuration:", error);
    res.status(500).json({ error: "Failed to process configuration" });
  }
});

// Add recording status callback endpoint
app.post("/recording-status", express.json(), (req, res) => {
  try {
    console.log("Recording status update received:", req.body);
    
    // Here you would typically:
    // 1. Log the recording details
    // 2. Store recording info in your database
    // 3. Update the session with recording info
    
    // Example of recording data from Twilio:
    // - RecordingSid: The unique ID of the recording
    // - RecordingUrl: The URL where the recording can be accessed
    // - RecordingStatus: The status of the recording (completed, failed, etc.)
    // - RecordingDuration: The duration of the recording in seconds
    
    // Send success response back to Twilio
    res.status(200).send();
  } catch (error) {
    console.error("Error handling recording status:", error);
    res.status(500).json({ error: "Failed to process recording status" });
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
