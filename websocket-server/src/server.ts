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
import { errorHandler, notFoundHandler, asyncHandler } from "./middleware/errorHandler";
import redisService from "./services/redis";
import { initializeSentry, Sentry } from "./services/sentry";
import logger, { logError, logWebSocketEvent, logCallEvent } from "./services/logger";
import { requestLogger } from "./middleware/requestLogger";

// Only load .env in development
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

// Enable dynamic port switching
// Get port from environment variable or command line argument
const PORT = parseInt(process.env.PORT || process.argv[2] || "8081", 10);
const PUBLIC_URL = process.env.PUBLIC_URL || "";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";

if (!OPENAI_API_KEY) {
  logger.error("OPENAI_API_KEY environment variable is required");
  process.exit(1);
}

const app = express();

// Initialize Sentry before other middleware
initializeSentry(app);

// Sentry request handler must be first middleware
// Note: Sentry v10 doesn't have request middleware, it's automatic

// Request logging middleware
app.use(requestLogger);

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

// Health check endpoint for monitoring
app.get("/health", asyncHandler(async (req: express.Request, res: express.Response) => {
  const redisHealth = await redisService.healthCheck();

  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    uptime: process.uptime(),
    services: {
      redis: redisHealth
    }
  });
}));

// Provide available voice list to the frontend
app.get("/voices", (req: express.Request, res: express.Response) => {
  try {
    // Allow override via env: comma-separated or JSON array
    const envJson = process.env.OPENAI_VOICES_JSON;
    const envCsv = process.env.OPENAI_VOICES;
    let voices: string[] | undefined;
    if (envJson) {
      try { voices = JSON.parse(envJson); } catch {}
    }
    if (!voices && envCsv) {
      voices = envCsv.split(",").map((v) => v.trim()).filter(Boolean);
    }
    // Enhanced voice set with Sept 2025 updates; dedupe and sort alphabetically
    const defaultVoices = [
      "alloy",
      "ash",
      "ballad",
      "cedar", // New Sept 2025 voice
      "coral",
      "echo",
      "marin", // New Sept 2025 voice (featured)
      "sage",
      "shimmer",
      "verse",
    ];
    const set = new Set([...(voices || []), ...defaultVoices]);
    const merged = Array.from(set).sort((a, b) => a.localeCompare(b));
    res.json({ voices: merged, source: voices ? 'env' : 'default', updatedAt: new Date().toISOString() });
  } catch (e: any) {
    res.status(200).json({ voices: ["alloy","ash","ballad","coral","echo","sage","shimmer","verse"], source: 'default', updatedAt: new Date().toISOString() });
  }
});

app.all("/twiml", (req: express.Request, res: express.Response) => {
  // Compute the WebSocket URL for Twilio Media Streams
  // Priority: current request host; fallback to WS_PUBLIC_URL only if host missing
  const host = (req.headers['x-forwarded-host'] as string) || req.headers.host || '';
  let wsUrlStr = '';
  if (host) {
    wsUrlStr = `wss://${host}/call`;
  } else if (process.env.WS_PUBLIC_URL) {
    try { wsUrlStr = new URL('/call', process.env.WS_PUBLIC_URL).toString(); } catch {}
  }
  
  // Enable recording based on last saved session config (default: true)
  let recordCall = true;
  try {
    // Prefer explicit user configuration if available
    const saved = (sessionManager as any).getSavedConfig?.();
    if (saved && typeof saved.recordCall === 'boolean') {
      recordCall = saved.recordCall;
    }
  } catch (e) {
    // Fallback to default on any error
    logger.warn('Could not read saved session config for recording preference:', e);
  }
  // Build callback URLs relative to current request host for robustness
  const cbBase = host ? `https://${host}` : (PUBLIC_URL || '');
  const recordingStatusUrl = cbBase ? new URL("/recording-status", cbBase).toString() : '';
  
  // Use Handlebars to render the template with all variables
  const twimlContent = twimlHandlebars({
    WS_URL: wsUrlStr,
    RECORD_CALL: recordCall,
    RECORDING_STATUS_URL: recordingStatusUrl
  });
  
  // Respond to Twilio immediately with TwiML
  res.type("text/xml").send(twimlContent);

  // If recording is enabled, start call recording via REST API (supported way)
  try {
    const callSid = (req.body && (req.body as any).CallSid) || (req.query && (req.query as any).CallSid) || undefined;
    if (recordCall && callSid && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      const twilioClient = require("twilio")(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      twilioClient.calls(callSid).recordings
        .create({
          recordingStatusCallback: recordingStatusUrl,
        })
        .then(() => {
          logCallEvent(callSid, 'Recording started');
        })
        .catch((err: any) => {
          logError(new Error(`Failed to start call recording: ${err?.message || err}`), { callSid });
        });
    }
  } catch (e: any) {
    logError(new Error(`Error attempting to start call recording: ${e?.message || e}`), { callSid: recordCall });
  }
});

// Optional: TwiML endpoint to dial a SIP URI (e.g., OpenAI Realtime SIP)
// Requires OPENAI_SIP_URI env var like: sip:realtime.openai.com:5060;transport=tls?model=gpt-realtime&voice=verse
app.all("/twiml-sip", (req: express.Request, res: express.Response) => {
  const sipUri = process.env.OPENAI_SIP_URI;
  if (!sipUri) {
    return res
      .status(500)
      .type("text/plain")
      .send("Missing OPENAI_SIP_URI env var for SIP dialing");
  }

  // Respect recording preference similar to /twiml
  let recordCall = true;
  try {
    const saved = (sessionManager as any).getSavedConfig?.();
    if (saved && typeof saved.recordCall === 'boolean') {
      recordCall = saved.recordCall;
    }
  } catch {}
  const host = (req.headers['x-forwarded-host'] as string) || req.headers.host || '';
  const cbBase = host ? `https://${host}` : (PUBLIC_URL || '');
  const statusUrl = cbBase ? new URL("/sip-status", cbBase).toString() : '';
  const recordingStatusUrl = cbBase ? new URL("/recording-status", cbBase).toString() : '';
  // For SIP dialing, TwiML <Dial> supports call recording via the 'record' attribute
  const recordAttr = recordCall
    ? ` record=\"record-from-answer\" recordingStatusCallback=\"${recordingStatusUrl}\"`
    : '';
  const twiml = `<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<Response>\n  <Dial action=\"${statusUrl}\" method=\"POST\"${recordAttr}>\n    <Sip>${sipUri}</Sip>\n  </Dial>\n</Response>`;
  res.type("text/xml").send(twiml);
});

// SIP status callback to observe Twilio <Dial> lifecycle for SIP calls
app.post("/sip-status", express.urlencoded({ extended: false }), (req: express.Request, res: express.Response) => {
  try {
    logger.info("SIP status callback", req.body);
  } catch (e) {
    logError(e as Error, { context: 'SIP status callback' });
  }
  res.type("text/xml").send("<Response/>");
});

// Helper endpoint to compute a SIP URI using the latest saved config (model, voice)
app.get("/sip-uri", (req: express.Request, res: express.Response) => {
  try {
    const saved = (sessionManager as any).getSavedConfig?.() || {};
    const model = (saved.model || process.env.OPENAI_MODEL || 'gpt-realtime') as string;
    const voice = (saved.voice || 'verse') as string;
    const base = 'sip:realtime.openai.com:5060;transport=tls';
    const params = new URLSearchParams({ model, voice });
    const uri = `${base}?${params.toString()}`;
    res.json({ uri, model, voice });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Failed to compute SIP URI' });
  }
});

// New endpoint to list available tools (schemas)
app.get("/tools", (req: express.Request, res: express.Response) => {
  res.json(functions.map((f) => f.schema));
});

// Add endpoint for initiating outgoing calls
app.post("/make-call", express.json(), async (req: express.Request, res: express.Response) => {
  const { phoneNumber } = req.body;

  try {

    if (!phoneNumber) {
      res.status(400).json({ error: "Phone number is required" });
      return;
    }

    // Validate phone number format
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phoneNumber.replace(/[\s()-]/g, ''))) {
      res.status(400).json({ error: "Invalid phone number format" });
      return;
    }

    // Check environment variables
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
      logger.error("Missing Twilio credentials");
      res.status(500).json({ error: "Server configuration error: Missing Twilio credentials" });
      return;
    }

    if (!PUBLIC_URL) {
      logger.error("Missing PUBLIC_URL configuration");
      res.status(500).json({ error: "Server configuration error: Missing PUBLIC_URL" });
      return;
    }

    // Make sure we're using the secure public URL for production
    const twilioClient = require("twilio")(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    // Get the TwiML URL for the call
    const twimlUrl = new URL("/twiml", PUBLIC_URL).toString();
    logger.info(`[make-call] Using TwiML URL: ${twimlUrl}`);

    // Place the outgoing call using Twilio
    const call = await twilioClient.calls.create({
      to: phoneNumber,
      from: process.env.TWILIO_PHONE_NUMBER,
      url: twimlUrl,
      statusCallback: new URL("/call-status", PUBLIC_URL).toString(),
      statusCallbackEvent: ["initiated", "ringing", "answered", "completed"]
    });

    logCallEvent(call.sid, 'Call initiated', { phoneNumber: phoneNumber, twimlUrl });
    res.json({
      success: true,
      callSid: call.sid,
      message: "Call initiated successfully"
    });
  } catch (error: any) {
    logError(error, { context: 'make-call', phoneNumber: phoneNumber });

    // Provide more specific error messages
    let errorMessage = "Failed to make outgoing call";
    let statusCode = 500;

    if (error.code === 20003) {
      errorMessage = "Authentication failed. Please check Twilio credentials.";
      statusCode = 401;
    } else if (error.code === 21211) {
      errorMessage = "Invalid phone number format";
      statusCode = 400;
    } else if (error.code === 21214) {
      errorMessage = "The 'To' phone number is not a valid phone number";
      statusCode = 400;
    } else if (error.code === 21217) {
      errorMessage = "The 'From' phone number is not a valid phone number or is not verified";
      statusCode = 400;
    }

    res.status(statusCode).json({
      error: errorMessage,
      details: error.message,
      code: error.code
    });
  }
});

// Call status webhook for Twilio
app.post("/call-status", express.urlencoded({ extended: false }), (req: express.Request, res: express.Response) => {
  try {
    const { CallSid, CallStatus, To, From, Direction } = req.body;
    logCallEvent(CallSid, `Call status: ${CallStatus}`, { Direction, From, To });

    // You can add additional logic here to update call status in database
    // or notify connected WebSocket clients

    res.status(200).send("OK");
  } catch (error) {
    logError(error as Error, { context: 'call-status webhook' });
    res.status(500).send("Error");
  }
});

// Add this new endpoint for handling configuration data
app.post("/config", express.json(), (req: express.Request, res: express.Response) => {
  try {
    const config = req.body;
    logger.info("Received session configuration", config);
    
    // Store the configuration in the session manager
    if (sessionManager.setSessionConfig) {
      sessionManager.setSessionConfig(config);
      res.status(200).json({ success: true });
    } else {
      res.status(500).json({ error: "Session manager not available" });
    }
  } catch (error) {
    logError(error as Error, { context: 'configuration endpoint' });
    res.status(500).json({ error: "Failed to process configuration" });
  }
});

// Also handle /session-config endpoint (alias for /config)
app.post("/session-config", express.json(), (req: express.Request, res: express.Response) => {
  try {
    const config = req.body;
    logger.info("Received session configuration", config);
    
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

// Add call status callback endpoint (Twilio posts x-www-form-urlencoded)
app.all("/call-status", express.urlencoded({ extended: false }), async (req, res) => {
  try {
    logger.info("Call status update received", req.body);
    
    // Forward to webapp for database updates
    try {
      const webappUrl = process.env.WEBAPP_URL || 'https://verbio.app';
      await fetch(`${webappUrl}/api/twilio/call-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(req.body).toString()
      });
    } catch (error) {
      logError(error as Error, { context: 'webapp notification' });
    }
    
    // Send 204 No Content response for Twilio
    res.status(204).send();
  } catch (error) {
    logError(error as Error, { context: 'call-status webhook' });
    res.status(204).send();
  }
});

// Add recording status callback endpoint (Twilio posts x-www-form-urlencoded)
app.all("/recording-status", express.urlencoded({ extended: false }), async (req, res) => {
  try {
    logger.info("Recording status update received", req.body);
    
    const {
      RecordingSid,
      RecordingUrl,
      RecordingStatus,
      RecordingDuration,
      CallSid
    } = req.body;
    
    if (RecordingStatus === 'completed' && RecordingUrl) {
      logCallEvent(CallSid, 'Recording completed', {
        RecordingSid,
        RecordingUrl,
        RecordingDuration
      });
      
      // Store recording info in database via webhook to webapp
      try {
        const webappUrl = process.env.WEBAPP_URL || 'https://verbio.app';
        await fetch(`${webappUrl}/api/recordings/webhook`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            callSid: CallSid,
            recordingSid: RecordingSid,
            recordingUrl: RecordingUrl,
            duration: RecordingDuration,
            status: RecordingStatus
          })
        });
      } catch (error) {
        logError(error as Error, { context: 'webapp recording notification' });
      }
    }
    
    // Example of recording data from Twilio:
    // - RecordingSid: The unique ID of the recording
    // - RecordingUrl: The URL where the recording can be accessed
    // - RecordingStatus: The status of the recording (completed, failed, etc.)
    // - RecordingDuration: The duration of the recording in seconds
    
    // Send success response back to Twilio
    res.status(200).send();
  } catch (error) {
    logError(error as Error, { context: 'recording-status webhook' });
    res.status(500).json({ error: "Failed to process recording status" });
  }
});

let currentCall: WebSocket | null = null;
let currentLogs: WebSocket | null = null;

// Add 404 handler for undefined routes
app.use(notFoundHandler);

// Sentry error handler must be before any other error middleware
app.use(Sentry.expressErrorHandler());

// Add global error handler (must be last)
app.use(errorHandler);

// WebSocket heartbeat configuration
const HEARTBEAT_INTERVAL = 30000; // 30 seconds
const HEARTBEAT_TIMEOUT = 60000; // 60 seconds (if no pong received)

// Track WebSocket connections with heartbeat
const wsClients = new Map<WebSocket, {
  isAlive: boolean;
  heartbeatTimer?: NodeJS.Timeout;
  timeoutTimer?: NodeJS.Timeout;
  connectionInfo: string;
}>();

// Heartbeat function
function heartbeat(ws: WebSocket) {
  const client = wsClients.get(ws);
  if (!client) return;

  // Clear existing timers
  if (client.heartbeatTimer) clearInterval(client.heartbeatTimer);
  if (client.timeoutTimer) clearTimeout(client.timeoutTimer);

  client.isAlive = true;

  // Set up periodic ping
  client.heartbeatTimer = setInterval(() => {
    if (!client.isAlive) {
      logWebSocketEvent('heartbeat', 'Connection dead, terminating', { connectionInfo: client.connectionInfo });
      ws.terminate();
      wsClients.delete(ws);
      return;
    }

    client.isAlive = false;
    ws.ping();

    // Set timeout for pong response
    client.timeoutTimer = setTimeout(() => {
      logWebSocketEvent('heartbeat', 'No pong received, terminating', { connectionInfo: client.connectionInfo });
      ws.terminate();
      wsClients.delete(ws);
    }, HEARTBEAT_TIMEOUT);
  }, HEARTBEAT_INTERVAL);
}

// Improved WebSocket connection handler
wss.on("connection", (ws: WebSocket, req: IncomingMessage) => {
  // Add basic rate limiting
  const clientIp = req.socket.remoteAddress || 'unknown';

  // Validate URLs and origin for security
  if (!req.url) {
    logger.error("WebSocket connection without URL");
    ws.close(1008, "Invalid connection");
    return;
  }

  // Prevent connections from unauthorized origins in production
  if (process.env.NODE_ENV === 'production') {
    const origin = req.headers.origin;
    const allowedOrigins = [process.env.ALLOWED_ORIGIN, process.env.PUBLIC_URL].filter(Boolean);

    if (allowedOrigins.length > 0 && origin && !allowedOrigins.includes(origin)) {
      logger.error(`Rejected WebSocket from unauthorized origin: ${origin}`);
      ws.close(1008, "Unauthorized origin");
      return;
    }
  }

  const connectionInfo = `${req.url} from ${clientIp}`;
  logWebSocketEvent('connection', 'New WebSocket connection', { connectionInfo });

  // Register client for heartbeat
  wsClients.set(ws, {
    isAlive: true,
    connectionInfo
  });

  // Start heartbeat
  heartbeat(ws);

  // Handle pong responses
  ws.on('pong', () => {
    const client = wsClients.get(ws);
    if (client) {
      client.isAlive = true;
      if (client.timeoutTimer) {
        clearTimeout(client.timeoutTimer);
        client.timeoutTimer = undefined;
      }
    }
  });

  // Add connection timeout
  const connectionTimeout = setTimeout(() => {
    logWebSocketEvent('timeout', 'Closing inactive connection', { url: req.url });
    ws.close(1001, "Connection timeout");
  }, 30 * 60 * 1000); // 30 minutes timeout

  ws.on('close', () => {
    clearTimeout(connectionTimeout);

    // Clean up heartbeat
    const client = wsClients.get(ws);
    if (client) {
      if (client.heartbeatTimer) clearInterval(client.heartbeatTimer);
      if (client.timeoutTimer) clearTimeout(client.timeoutTimer);
      wsClients.delete(ws);
    }
  });

  if (req.url === "/call") {
    logWebSocketEvent('twilio', 'New Twilio call connection established');
    sessionManager.handleCallConnection(ws, OPENAI_API_KEY).catch(err => {
      logError(err as Error, { context: 'Twilio call connection' });
    });
  } else if (req.url === "/logs") {
    logWebSocketEvent('logs', 'New frontend logs connection established');
    sessionManager.handleFrontendConnection(ws);
  } else {
    logger.error(`Unknown WebSocket connection type: ${req.url}`);
    ws.close(1008, "Invalid endpoint");
  }
});

server.listen(PORT, '0.0.0.0', () => {
  logger.info(`Server running on http://0.0.0.0:${PORT}`);

  if (PUBLIC_URL) {
    logger.info(`Public URL: ${PUBLIC_URL}`);
  }
});

// Export port for external use (e.g., in scripts)
export { PORT };
