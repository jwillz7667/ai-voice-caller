"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PORT = void 0;
const express_1 = __importDefault(require("express"));
const ws_1 = require("ws");
const dotenv_1 = __importDefault(require("dotenv"));
const http_1 = __importDefault(require("http"));
const fs_1 = require("fs");
const path_1 = require("path");
const cors_1 = __importDefault(require("cors"));
const handlebars_1 = __importDefault(require("handlebars"));
const sessionManager = __importStar(require("./sessionManager"));
const functionHandlers_1 = __importDefault(require("./functionHandlers"));
dotenv_1.default.config();
// Enable dynamic port switching
// Get port from environment variable or command line argument
const PORT = parseInt(process.env.PORT || process.argv[2] || "8081", 10);
exports.PORT = PORT;
const PUBLIC_URL = process.env.PUBLIC_URL || "";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
if (!OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY environment variable is required");
    process.exit(1);
}
const app = (0, express_1.default)();
// Security improvements
app.use((0, cors_1.default)({
    origin: process.env.NODE_ENV === 'production'
        ? [process.env.ALLOWED_ORIGIN || ''].filter(Boolean)
        : '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
// Add security headers
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    next();
});
// Use JSON body parser with limits
app.use(express_1.default.json({ limit: '100kb' }));
app.use(express_1.default.urlencoded({ extended: false, limit: '100kb' }));
const server = http_1.default.createServer(app);
const wss = new ws_1.WebSocketServer({ server });
const twimlPath = (0, path_1.join)(__dirname, "twiml.xml");
const twimlTemplate = (0, fs_1.readFileSync)(twimlPath, "utf-8");
const twimlHandlebars = handlebars_1.default.compile(twimlTemplate);
app.get("/public-url", (req, res) => {
    res.json({ publicUrl: PUBLIC_URL });
});
// Provide available voice list to the frontend
app.get("/voices", (req, res) => {
    try {
        // Allow override via env: comma-separated or JSON array
        const envJson = process.env.OPENAI_VOICES_JSON;
        const envCsv = process.env.OPENAI_VOICES;
        let voices;
        if (envJson) {
            try {
                voices = JSON.parse(envJson);
            }
            catch (_a) { }
        }
        if (!voices && envCsv) {
            voices = envCsv.split(",").map((v) => v.trim()).filter(Boolean);
        }
        // Default curated set; dedupe and sort alphabetically
        const defaultVoices = [
            "alloy",
            "ash",
            "ballad",
            "cedar",
            "coral",
            "echo",
            "marin",
            "sage",
            "shimmer",
            "verse",
        ];
        const set = new Set([...(voices || []), ...defaultVoices]);
        const merged = Array.from(set).sort((a, b) => a.localeCompare(b));
        res.json({ voices: merged, source: voices ? 'env' : 'default', updatedAt: new Date().toISOString() });
    }
    catch (e) {
        res.status(200).json({ voices: ["alloy", "ash", "ballad", "coral", "echo", "sage", "shimmer", "verse"], source: 'default', updatedAt: new Date().toISOString() });
    }
});
app.all("/twiml", (req, res) => {
    var _a, _b;
    // Compute the WebSocket URL for Twilio Media Streams
    // Priority: current request host; fallback to WS_PUBLIC_URL only if host missing
    const host = req.headers['x-forwarded-host'] || req.headers.host || '';
    let wsUrlStr = '';
    if (host) {
        wsUrlStr = `wss://${host}/call`;
    }
    else if (process.env.WS_PUBLIC_URL) {
        try {
            wsUrlStr = new URL('/call', process.env.WS_PUBLIC_URL).toString();
        }
        catch (_c) { }
    }
    // Enable recording based on last saved session config (default: true)
    let recordCall = true;
    try {
        // Prefer explicit user configuration if available
        const saved = (_b = (_a = sessionManager).getSavedConfig) === null || _b === void 0 ? void 0 : _b.call(_a);
        if (saved && typeof saved.recordCall === 'boolean') {
            recordCall = saved.recordCall;
        }
    }
    catch (e) {
        // Fallback to default on any error
        console.warn('Could not read saved session config for recording preference:', e);
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
        const callSid = (req.body && req.body.CallSid) || (req.query && req.query.CallSid) || undefined;
        if (recordCall && callSid && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
            const twilioClient = require("twilio")(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
            twilioClient.calls(callSid).recordings
                .create({
                recordingStatusCallback: recordingStatusUrl,
            })
                .then(() => {
                console.log(`Started recording for CallSid=${callSid}`);
            })
                .catch((err) => {
                console.error("Failed to start call recording:", (err === null || err === void 0 ? void 0 : err.message) || err);
            });
        }
    }
    catch (e) {
        console.error("Error attempting to start call recording:", (e === null || e === void 0 ? void 0 : e.message) || e);
    }
});
// Optional: TwiML endpoint to dial a SIP URI (e.g., OpenAI Realtime SIP)
// Requires OPENAI_SIP_URI env var like: sip:realtime.openai.com:5060;transport=tls?model=gpt-realtime&voice=verse
app.all("/twiml-sip", (req, res) => {
    var _a, _b;
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
        const saved = (_b = (_a = sessionManager).getSavedConfig) === null || _b === void 0 ? void 0 : _b.call(_a);
        if (saved && typeof saved.recordCall === 'boolean') {
            recordCall = saved.recordCall;
        }
    }
    catch (_c) { }
    const host = req.headers['x-forwarded-host'] || req.headers.host || '';
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
app.post("/sip-status", express_1.default.urlencoded({ extended: false }), (req, res) => {
    try {
        console.log("SIP status callback:", req.body);
    }
    catch (e) {
        console.error("Error logging SIP status:", e);
    }
    res.type("text/xml").send("<Response/>");
});
// Helper endpoint to compute a SIP URI using the latest saved config (model, voice)
app.get("/sip-uri", (req, res) => {
    var _a, _b;
    try {
        const saved = ((_b = (_a = sessionManager).getSavedConfig) === null || _b === void 0 ? void 0 : _b.call(_a)) || {};
        const model = (saved.model || process.env.OPENAI_MODEL || 'gpt-realtime');
        const voice = (saved.voice || 'verse');
        const base = 'sip:realtime.openai.com:5060;transport=tls';
        const params = new URLSearchParams({ model, voice });
        const uri = `${base}?${params.toString()}`;
        res.json({ uri, model, voice });
    }
    catch (e) {
        res.status(500).json({ error: e.message || 'Failed to compute SIP URI' });
    }
});
// New endpoint to list available tools (schemas)
app.get("/tools", (req, res) => {
    res.json(functionHandlers_1.default.map((f) => f.schema));
});
// Add endpoint for initiating outgoing calls
app.post("/make-call", express_1.default.json(), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { phoneNumber } = req.body;
        if (!phoneNumber) {
            res.status(400).json({ error: "Phone number is required" });
            return;
        }
        // Make sure we're using the secure public URL for production
        const twilioClient = require("twilio")(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        // Get the TwiML URL for the call
        const twimlUrl = new URL("/twiml", PUBLIC_URL).toString();
        // Place the outgoing call using Twilio
        const call = yield twilioClient.calls.create({
            to: phoneNumber,
            from: process.env.TWILIO_PHONE_NUMBER,
            url: twimlUrl,
        });
        res.json({ success: true, callSid: call.sid });
    }
    catch (error) {
        console.error("Error making outgoing call:", error);
        res.status(500).json({
            error: "Failed to make outgoing call",
            message: error.message
        });
    }
}));
// Add this new endpoint for handling configuration data
app.post("/config", express_1.default.json(), (req, res) => {
    try {
        const config = req.body;
        console.log("Received session configuration:", config);
        // Store the configuration in the session manager
        if (sessionManager.setSessionConfig) {
            sessionManager.setSessionConfig(config);
            res.status(200).json({ success: true });
        }
        else {
            res.status(500).json({ error: "Session manager not available" });
        }
    }
    catch (error) {
        console.error("Error handling configuration:", error);
        res.status(500).json({ error: "Failed to process configuration" });
    }
});
// Also handle /session-config endpoint (alias for /config)
app.post("/session-config", express_1.default.json(), (req, res) => {
    try {
        const config = req.body;
        console.log("Received session configuration:", config);
        // Store the configuration in the session manager
        if (sessionManager.setSessionConfig) {
            sessionManager.setSessionConfig(config);
            res.status(200).json({ success: true });
        }
        else {
            res.status(500).json({ error: "Session manager not available" });
        }
    }
    catch (error) {
        console.error("Error handling session configuration:", error);
        res.status(500).json({ error: "Failed to process configuration" });
    }
});
// Add call status callback endpoint (Twilio posts x-www-form-urlencoded)
app.all("/call-status", express_1.default.urlencoded({ extended: false }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("Call status update received:", req.body);
        // Forward to webapp for database updates
        try {
            const webappUrl = process.env.WEBAPP_URL || 'http://localhost:3000';
            yield fetch(`${webappUrl}/api/twilio/call-status`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams(req.body).toString()
            });
        }
        catch (error) {
            console.error('Failed to notify webapp of call status:', error);
        }
        // Send 204 No Content response for Twilio
        res.status(204).send();
    }
    catch (error) {
        console.error("Error handling call status:", error);
        res.status(204).send();
    }
}));
// Add recording status callback endpoint (Twilio posts x-www-form-urlencoded)
app.all("/recording-status", express_1.default.urlencoded({ extended: false }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("Recording status update received:", req.body);
        const { RecordingSid, RecordingUrl, RecordingStatus, RecordingDuration, CallSid } = req.body;
        if (RecordingStatus === 'completed' && RecordingUrl) {
            console.log(`Recording completed for call ${CallSid}:`);
            console.log(`  Recording SID: ${RecordingSid}`);
            console.log(`  Recording URL: ${RecordingUrl}`);
            console.log(`  Duration: ${RecordingDuration} seconds`);
            // Store recording info in database via webhook to webapp
            try {
                const webappUrl = process.env.WEBAPP_URL || 'http://localhost:3000';
                yield fetch(`${webappUrl}/api/recordings/webhook`, {
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
            }
            catch (error) {
                console.error('Failed to notify webapp of recording:', error);
            }
        }
        // Example of recording data from Twilio:
        // - RecordingSid: The unique ID of the recording
        // - RecordingUrl: The URL where the recording can be accessed
        // - RecordingStatus: The status of the recording (completed, failed, etc.)
        // - RecordingDuration: The duration of the recording in seconds
        // Send success response back to Twilio
        res.status(200).send();
    }
    catch (error) {
        console.error("Error handling recording status:", error);
        res.status(500).json({ error: "Failed to process recording status" });
    }
}));
let currentCall = null;
let currentLogs = null;
// Improved WebSocket connection handler
wss.on("connection", (ws, req) => {
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
    }
    else if (req.url === "/logs") {
        console.log("New frontend logs connection established");
        sessionManager.handleFrontendConnection(ws);
    }
    else {
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
