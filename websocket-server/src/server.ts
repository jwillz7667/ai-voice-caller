import express from "express";
import { WebSocketServer, WebSocket } from "ws";
import { IncomingMessage, ServerResponse } from "http";
import dotenv from "dotenv";
import http from "http";
import { readFileSync } from "fs";
import { join } from "path";
import cors from "cors";
import Handlebars from "handlebars";
import * as sessionManager from "./sessionManager";
import functions from "./functionHandlers";

dotenv.config();

// Enable dynamic port switching
// Get port from environment variable or command line argument
const PORT = parseInt(process.env.PORT || process.argv[2] || "8081", 10);
const PUBLIC_URL = process.env.PUBLIC_URL || "";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";

if (!OPENAI_API_KEY) {
  console.error("OPENAI_API_KEY environment variable is required");
  process.exit(1);
}

const app = express();

// Security improvements
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.ALLOWED_ORIGIN || ''].filter(Boolean) 
    : '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Add security headers
app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

// Use JSON body parser with limits
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false, limit: '100kb' }));

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const twimlPath = join(__dirname, "twiml.xml");
const twimlTemplate = readFileSync(twimlPath, "utf-8");
const twimlHandlebars = Handlebars.compile(twimlTemplate);

app.get("/public-url", (req: express.Request, res: express.Response) => {
  res.json({ publicUrl: PUBLIC_URL });
});

app.all("/twiml", (req: express.Request, res: express.Response) => {
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
app.get("/tools", (req: express.Request, res: express.Response) => {
  res.json(functions.map((f) => f.schema));
});

// Add endpoint for initiating outgoing calls
app.post("/make-call", express.json(), async (req: express.Request, res: express.Response) => {
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
app.post("/config", express.json(), (req: express.Request, res: express.Response) => {
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

// Also handle /session-config endpoint (alias for /config)
app.post("/session-config", express.json(), (req: express.Request, res: express.Response) => {
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
    console.error("Error handling session configuration:", error);
    res.status(500).json({ error: "Failed to process configuration" });
  }
});

// Add call status callback endpoint
app.post("/call-status", express.json(), (req, res) => {
  try {
    console.log("Call status update received:", req.body);
    
    // Send 204 No Content response for Twilio
    res.status(204).send();
  } catch (error) {
    console.error("Error handling call status:", error);
    res.status(204).send();
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
  // Add basic rate limiting
  const clientIp = req.socket.remoteAddress || 'unknown';
  
  // Validate URLs and origin for security
  if (!req.url) {
    console.error("WebSocket connection without URL");
    ws.close(1008, "Invalid connection");
    return;
  }
  
  // Prevent connections from unauthorized origins in production
  if (process.env.NODE_ENV === 'production') {
    const origin = req.headers.origin;
    const allowedOrigins = [process.env.ALLOWED_ORIGIN, process.env.PUBLIC_URL].filter(Boolean);
    
    if (allowedOrigins.length > 0 && origin && !allowedOrigins.includes(origin)) {
      console.error(`Rejected WebSocket from unauthorized origin: ${origin}`);
      ws.close(1008, "Unauthorized origin");
      return;
    }
  }

  console.log(`New WebSocket connection: ${req.url} from ${clientIp}`);

  // Add connection timeout
  const connectionTimeout = setTimeout(() => {
    console.log(`Closing inactive WebSocket connection: ${req.url}`);
    ws.close(1001, "Connection timeout");
  }, 30 * 60 * 1000); // 30 minutes timeout
  
  ws.on('close', () => {
    clearTimeout(connectionTimeout);
  });

  if (req.url === "/call") {
    console.log("New Twilio call connection established");
    sessionManager.handleCallConnection(ws, OPENAI_API_KEY);
  } else if (req.url === "/logs") {
    console.log("New frontend logs connection established");
    sessionManager.handleFrontendConnection(ws);
  } else {
    console.error(`Unknown WebSocket connection type: ${req.url}`);
    ws.close(1008, "Invalid endpoint");
  }
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  
  // Display ngrok command suggestion if PUBLIC_URL is not set
  if (!PUBLIC_URL || PUBLIC_URL === "your-ngrok-url.ngrok-free.app") {
    console.log(`To expose this server to the internet, run: ngrok http ${PORT}`);
    console.log(`Then update PUBLIC_URL in your .env file with the ngrok URL`);
  }
});

// Export port for external use (e.g., in scripts)
export { PORT };
