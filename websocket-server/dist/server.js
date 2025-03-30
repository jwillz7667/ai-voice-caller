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
const PORT = parseInt(process.env.PORT || "8081", 10);
const PUBLIC_URL = process.env.PUBLIC_URL || "";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
if (!OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY environment variable is required");
    process.exit(1);
}
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
const server = http_1.default.createServer(app);
const wss = new ws_1.WebSocketServer({ server });
app.use(express_1.default.urlencoded({ extended: false }));
const twimlPath = (0, path_1.join)(__dirname, "twiml.xml");
const twimlTemplate = (0, fs_1.readFileSync)(twimlPath, "utf-8");
const twimlHandlebars = handlebars_1.default.compile(twimlTemplate);
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
// Add recording status callback endpoint
app.post("/recording-status", express_1.default.json(), (req, res) => {
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
    }
    catch (error) {
        console.error("Error handling recording status:", error);
        res.status(500).json({ error: "Failed to process recording status" });
    }
});
let currentCall = null;
let currentLogs = null;
// Improved WebSocket connection handler
wss.on("connection", (ws, req) => {
    console.log(`New WebSocket connection: ${req.url}`);
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
        ws.close();
    }
});
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
