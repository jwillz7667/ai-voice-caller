"use strict";
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
exports.handleCallConnection = handleCallConnection;
exports.handleFrontendConnection = handleFrontendConnection;
exports.setSessionConfig = setSessionConfig;
exports.getSavedConfig = getSavedConfig;
const ws_1 = require("ws");
const functionHandlers_1 = __importDefault(require("./functionHandlers"));
const realtimeEvents_1 = require("./realtimeEvents");
const twilio_1 = __importDefault(require("twilio"));
const dtmfHandler_1 = require("./dtmfHandler");
// µ-law decoding table
const MULAW_DECODE_TABLE = new Int16Array([
    -32124, -31100, -30076, -29052, -28028, -27004, -25980, -24956,
    -23932, -22908, -21884, -20860, -19836, -18812, -17788, -16764,
    -15996, -15484, -14972, -14460, -13948, -13436, -12924, -12412,
    -11900, -11388, -10876, -10364, -9852, -9340, -8828, -8316,
    -7932, -7676, -7420, -7164, -6908, -6652, -6396, -6140,
    -5884, -5628, -5372, -5116, -4860, -4604, -4348, -4092,
    -3900, -3772, -3644, -3516, -3388, -3260, -3132, -3004,
    -2876, -2748, -2620, -2492, -2364, -2236, -2108, -1980,
    -1884, -1820, -1756, -1692, -1628, -1564, -1500, -1436,
    -1372, -1308, -1244, -1180, -1116, -1052, -988, -924,
    -876, -844, -812, -780, -748, -716, -684, -652,
    -620, -588, -556, -524, -492, -460, -428, -396,
    -372, -356, -340, -324, -308, -292, -276, -260,
    -244, -228, -212, -196, -180, -164, -148, -132,
    -120, -112, -104, -96, -88, -80, -72, -64,
    -56, -48, -40, -32, -24, -16, -8, 0,
    32124, 31100, 30076, 29052, 28028, 27004, 25980, 24956,
    23932, 22908, 21884, 20860, 19836, 18812, 17788, 16764,
    15996, 15484, 14972, 14460, 13948, 13436, 12924, 12412,
    11900, 11388, 10876, 10364, 9852, 9340, 8828, 8316,
    7932, 7676, 7420, 7164, 6908, 6652, 6396, 6140,
    5884, 5628, 5372, 5116, 4860, 4604, 4348, 4092,
    3900, 3772, 3644, 3516, 3388, 3260, 3132, 3004,
    2876, 2748, 2620, 2492, 2364, 2236, 2108, 1980,
    1884, 1820, 1756, 1692, 1628, 1564, 1500, 1436,
    1372, 1308, 1244, 1180, 1116, 1052, 988, 924,
    876, 844, 812, 780, 748, 716, 684, 652,
    620, 588, 556, 524, 492, 460, 428, 396,
    372, 356, 340, 324, 308, 292, 276, 260,
    244, 228, 212, 196, 180, 164, 148, 132,
    120, 112, 104, 96, 88, 80, 72, 64,
    56, 48, 40, 32, 24, 16, 8, 0
]);
// Function to encode linear PCM to µ-law
function linearToMuLaw(sample) {
    const MULAW_MAX = 0x1FFF;
    const MULAW_BIAS = 33;
    // Get the sign
    let sign = (sample >> 8) & 0x80;
    // Get magnitude
    if (sign !== 0)
        sample = -sample;
    // Clip the magnitude
    if (sample > MULAW_MAX)
        sample = MULAW_MAX;
    // Add bias
    sample = sample + MULAW_BIAS;
    // Get exponent
    let exponent = 7;
    for (let expMask = 0x4000; (sample & expMask) === 0; exponent--, expMask >>= 1) { }
    // Get mantissa
    let mantissa = (sample >> (exponent + 3)) & 0x0F;
    // Encode
    let mulaw = ~(sign | (exponent << 4) | mantissa);
    return mulaw & 0xFF;
}
// Function to amplify µ-law audio
function amplifyMuLawAudio(base64Audio, gainFactor) {
    try {
        // Decode base64 to buffer
        const audioBuffer = Buffer.from(base64Audio, 'base64');
        const amplifiedBuffer = Buffer.alloc(audioBuffer.length);
        for (let i = 0; i < audioBuffer.length; i++) {
            // Decode µ-law to linear PCM
            const muLawByte = audioBuffer[i];
            let linearSample = MULAW_DECODE_TABLE[muLawByte];
            // Amplify the linear sample
            linearSample = Math.round(linearSample * gainFactor);
            // Clip to prevent overflow
            if (linearSample > 32767)
                linearSample = 32767;
            if (linearSample < -32768)
                linearSample = -32768;
            // Encode back to µ-law
            amplifiedBuffer[i] = linearToMuLaw(linearSample);
        }
        // Encode back to base64
        return amplifiedBuffer.toString('base64');
    }
    catch (error) {
        console.error("Error amplifying audio:", error);
        return base64Audio; // Return original if amplification fails
    }
}
let session = {};
function handleCallConnection(ws, openAIApiKey) {
    return __awaiter(this, void 0, void 0, function* () {
        cleanupConnection(session.twilioConn);
        session.twilioConn = ws;
        session.openAIApiKey = openAIApiKey;
        // Fetch incoming call configuration from the webapp
        try {
            const webappUrl = process.env.WEBAPP_URL || 'https://verbio.app';
            const response = yield fetch(`${webappUrl}/api/incoming-config/fetch`);
            if (response.ok) {
                const data = yield response.json();
                if (data.config) {
                    console.log("Loaded incoming call configuration from database");
                    // Store the configuration in the session
                    session.saved_config = data.config;
                }
            }
            else {
                console.warn("Failed to fetch incoming call configuration, using defaults");
            }
        }
        catch (error) {
            console.error("Error fetching incoming call configuration:", error);
            // Continue with defaults if fetch fails
        }
        ws.on("message", handleTwilioMessage);
        ws.on("error", ws.close);
        ws.on("close", () => {
            cleanupConnection(session.modelConn);
            cleanupConnection(session.twilioConn);
            session.twilioConn = undefined;
            session.modelConn = undefined;
            session.streamSid = undefined;
            session.callSid = undefined;
            session.lastAssistantItem = undefined;
            session.responseStartTimestamp = undefined;
            session.latestMediaTimestamp = undefined;
            session.hadSpeechSinceLastCommit = undefined;
            session.userSpeechStartTimestamp = undefined;
            if (!session.frontendConn)
                session = {};
        });
        // Keep-alive pings for Twilio media stream connection
        const pingInterval = setInterval(() => {
            var _a, _b;
            try {
                if (isOpen(session.twilioConn)) {
                    (_b = (_a = session.twilioConn).ping) === null || _b === void 0 ? void 0 : _b.call(_a);
                }
                else {
                    clearInterval(pingInterval);
                }
            }
            catch (_c) {
                clearInterval(pingInterval);
            }
        }, 20000);
    });
}
function handleFrontendConnection(ws) {
    cleanupConnection(session.frontendConn);
    session.frontendConn = ws;
    ws.on("message", handleFrontendMessage);
    ws.on("close", () => {
        cleanupConnection(session.frontendConn);
        session.frontendConn = undefined;
        if (!session.twilioConn && !session.modelConn)
            session = {};
    });
}
function handleFunctionCall(item) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("Handling function call:", item);
        const fnDef = functionHandlers_1.default.find((f) => f.schema.name === item.name);
        if (!fnDef) {
            throw new Error(`No handler found for function: ${item.name}`);
        }
        let args;
        try {
            // Safely parse JSON to prevent prototype pollution
            const argumentString = item.arguments && typeof item.arguments === 'string'
                ? item.arguments
                : '{}';
            args = JSON.parse(argumentString);
            // Validate that args is a plain object and not null
            if (!args || typeof args !== 'object' || Array.isArray(args)) {
                return JSON.stringify({
                    error: "Arguments must be a valid object.",
                });
            }
        }
        catch (_a) {
            return JSON.stringify({
                error: "Invalid JSON arguments for function call.",
            });
        }
        try {
            console.log("Calling function:", fnDef.schema.name, args);
            const result = yield fnDef.handler(args);
            // Parse the result to check for special actions
            try {
                const parsedResult = JSON.parse(result);
                // Handle call transfer
                if (parsedResult.action === "transfer" && parsedResult.phone_number) {
                    console.log("Initiating call transfer to:", parsedResult.phone_number);
                    // Execute call transfer using Twilio REST API
                    if (session.twilioConn && session.callSid) {
                        const accountSid = process.env.TWILIO_ACCOUNT_SID;
                        const authToken = process.env.TWILIO_AUTH_TOKEN;
                        if (accountSid && authToken) {
                            try {
                                const client = (0, twilio_1.default)(accountSid, authToken);
                                // Update the call with TwiML to transfer to the new number
                                yield client.calls(session.callSid)
                                    .update({
                                    twiml: `<Response>
                    <Say>Transferring your call now.</Say>
                    <Dial>${parsedResult.phone_number}</Dial>
                  </Response>`
                                });
                                console.log(`Call ${session.callSid} transferred to ${parsedResult.phone_number}`);
                            }
                            catch (error) {
                                console.error("Error transferring call:", error);
                            }
                        }
                        else {
                            console.error("Twilio credentials not configured for call transfer");
                        }
                    }
                    else {
                        console.error("No call SID available for transfer");
                    }
                }
                // Handle DTMF dial tones using the DTMFHandler
                if (parsedResult.action === "dial" && parsedResult.digits) {
                    console.log("Sending DTMF tones:", parsedResult.digits);
                    if (session.callSid && session.streamSid) {
                        // Set the call context for the DTMF handler
                        dtmfHandler_1.dtmfHandler.setCallContext(session.callSid, session.streamSid);
                        // Send DTMF sequence with proper timing
                        const success = yield dtmfHandler_1.dtmfHandler.sendDTMFSequence(parsedResult.digits);
                        if (success) {
                            console.log(`DTMF tones '${parsedResult.digits}' sent successfully`);
                            // Notify frontend about DTMF being sent
                            if (session.frontendConn) {
                                jsonSend(session.frontendConn, {
                                    type: "dtmf_sent",
                                    digits: parsedResult.digits,
                                    timestamp: new Date().toISOString()
                                });
                            }
                        }
                        else {
                            console.error("Failed to send DTMF tones");
                        }
                    }
                    else {
                        console.error("No call SID or stream SID available to send DTMF");
                    }
                }
                // Handle IVR navigation if specified
                if (parsedResult.action === "navigate_ivr" && parsedResult.options) {
                    if (session.callSid && session.streamSid) {
                        dtmfHandler_1.dtmfHandler.setCallContext(session.callSid, session.streamSid);
                        yield dtmfHandler_1.dtmfHandler.navigateIVR(parsedResult.options);
                    }
                }
            }
            catch (e) {
                // Result is not JSON or doesn't contain special actions
                console.log("Function result is not a special action");
            }
            return result;
        }
        catch (err) {
            console.error("Error running function:", err);
            return JSON.stringify({
                error: `Error running function ${item.name}: ${err.message}`,
            });
        }
    });
}
function handleTwilioMessage(data) {
    const msg = parseMessage(data);
    if (!msg)
        return;
    console.log("Received from Twilio:", msg.event);
    switch (msg.event) {
        case "start":
            session.streamSid = msg.start.streamSid;
            session.callSid = msg.start.callSid; // Capture the call SID from the start message
            session.latestMediaTimestamp = 0;
            session.lastAssistantItem = undefined;
            session.responseStartTimestamp = undefined;
            console.log("Call started - StreamSID:", session.streamSid, "CallSID:", session.callSid);
            tryConnectModel();
            break;
        case "media":
            session.latestMediaTimestamp = msg.media.timestamp;
            if (isOpen(session.modelConn)) {
                jsonSend(session.modelConn, {
                    type: "input_audio_buffer.append",
                    audio: msg.media.payload,
                });
            }
            break;
        case "dtmf":
            // Handle incoming DTMF from Twilio (user pressed a key)
            console.log("Received DTMF from Twilio:", msg.dtmf);
            const dtmfData = dtmfHandler_1.dtmfHandler.handleIncomingDTMF(msg);
            // Forward to OpenAI if needed
            if (isOpen(session.modelConn)) {
                // Send as a user message to OpenAI
                jsonSend(session.modelConn, {
                    type: "conversation.item.create",
                    item: {
                        type: "message",
                        role: "user",
                        content: [{
                                type: "text",
                                text: `User pressed key: ${dtmfData.digit}`
                            }]
                    }
                });
            }
            // Notify frontend about received DTMF
            if (session.frontendConn) {
                jsonSend(session.frontendConn, {
                    type: "dtmf_received",
                    digit: dtmfData.digit,
                    timestamp: dtmfData.timestamp,
                    source: "twilio"
                });
            }
            break;
        case "close":
            closeAllConnections();
            break;
    }
}
function handleFrontendMessage(data) {
    const msg = parseMessage(data);
    if (!msg)
        return;
    // Handle DTMF messages with improved functionality
    if (msg.type === "dtmf" && msg.digit) {
        console.log("Processing DTMF request:", msg.digit);
        if (session.callSid && session.streamSid) {
            // Set the call context
            dtmfHandler_1.dtmfHandler.setCallContext(session.callSid, session.streamSid);
            // Validate DTMF input
            const formattedDigits = dtmfHandler_1.DTMFHandler.formatForDTMF(msg.digit);
            if (!dtmfHandler_1.DTMFHandler.isValidDTMF(formattedDigits)) {
                console.error("Invalid DTMF digits:", msg.digit);
                if (session.frontendConn) {
                    jsonSend(session.frontendConn, {
                        type: "dtmf_error",
                        error: "Invalid DTMF digits",
                        digit: msg.digit
                    });
                }
                return;
            }
            // Send DTMF based on type
            if (msg.sequence) {
                // Send as a sequence with timing
                dtmfHandler_1.dtmfHandler.sendDTMFSequence(formattedDigits).then(success => {
                    if (session.frontendConn) {
                        jsonSend(session.frontendConn, {
                            type: success ? "dtmf_sent" : "dtmf_error",
                            digits: formattedDigits,
                            timestamp: new Date().toISOString()
                        });
                    }
                });
            }
            else if (msg.queue) {
                // Queue for sequential sending
                dtmfHandler_1.dtmfHandler.queueDTMF(formattedDigits, msg.delayBetween || 100);
                if (session.frontendConn) {
                    jsonSend(session.frontendConn, {
                        type: "dtmf_queued",
                        digits: formattedDigits,
                        queueStatus: dtmfHandler_1.dtmfHandler.getQueueStatus()
                    });
                }
            }
            else {
                // Send immediately via API
                dtmfHandler_1.dtmfHandler.sendDTMFViaAPI(formattedDigits).then(success => {
                    if (session.frontendConn) {
                        jsonSend(session.frontendConn, {
                            type: success ? "dtmf_sent" : "dtmf_error",
                            digit: formattedDigits,
                            timestamp: new Date().toISOString()
                        });
                    }
                });
            }
        }
        else {
            console.error("No call context for DTMF");
            if (session.frontendConn) {
                jsonSend(session.frontendConn, {
                    type: "dtmf_error",
                    error: "No active call"
                });
            }
        }
        return;
    }
    // Handle IVR navigation requests
    if (msg.type === "navigate_ivr" && msg.options) {
        if (session.callSid && session.streamSid) {
            dtmfHandler_1.dtmfHandler.setCallContext(session.callSid, session.streamSid);
            dtmfHandler_1.dtmfHandler.navigateIVR(msg.options).then(success => {
                if (session.frontendConn) {
                    jsonSend(session.frontendConn, {
                        type: "ivr_navigation_complete",
                        success,
                        options: msg.options
                    });
                }
            });
        }
        return;
    }
    if (isOpen(session.modelConn)) {
        jsonSend(session.modelConn, msg);
    }
    if (msg.type === "session.update") {
        session.saved_config = msg.session;
    }
}
function tryConnectModel() {
    if (!session.twilioConn || !session.streamSid || !session.openAIApiKey) {
        console.log("Cannot connect to OpenAI - missing requirements:", {
            hasTwilioConn: !!session.twilioConn,
            hasStreamSid: !!session.streamSid,
            hasOpenAIApiKey: !!session.openAIApiKey
        });
        return;
    }
    if (isOpen(session.modelConn)) {
        console.log("OpenAI connection already open");
        return;
    }
    console.log("Using session configuration:", session.saved_config);
    // Resolve model URL/name per best practices
    // Priority: saved model_url > saved model > OPENAI_MODEL_URL > OPENAI_MODEL > default
    let MODEL_URL = process.env.OPENAI_MODEL_URL || "";
    let MODEL_NAME = process.env.OPENAI_MODEL || "";
    try {
        const cfg = session.saved_config || {};
        if (cfg.model_url && typeof cfg.model_url === 'string') {
            MODEL_URL = cfg.model_url;
        }
        else if (cfg.model && typeof cfg.model === 'string') {
            const modelName = encodeURIComponent(cfg.model);
            MODEL_NAME = cfg.model;
            MODEL_URL = `wss://api.openai.com/v1/realtime?model=${modelName}`;
        }
    }
    catch (_a) { }
    if (!MODEL_URL) {
        if (MODEL_NAME) {
            MODEL_URL = `wss://api.openai.com/v1/realtime?model=${encodeURIComponent(MODEL_NAME)}`;
        }
        else {
            MODEL_URL = `wss://api.openai.com/v1/realtime?model=${encodeURIComponent('gpt-realtime')}`;
        }
    }
    console.log("Connecting to OpenAI at:", MODEL_URL);
    console.log("Using API key:", session.openAIApiKey ? `${session.openAIApiKey.substring(0, 10)}...` : "NOT SET");
    session.modelConn = new ws_1.WebSocket(MODEL_URL, {
        headers: {
            Authorization: `Bearer ${session.openAIApiKey}`,
            "OpenAI-Beta": "realtime=v1",
        },
    });
    session.modelConn.on("open", () => {
        var _a;
        console.log("Connected to OpenAI Realtime API successfully");
        // Extract saved configuration and ensure it's properly typed
        const savedConfig = session.saved_config || {};
        console.log("Applying configuration to OpenAI session:", JSON.stringify(savedConfig, null, 2));
        // Build clean session config with only valid OpenAI fields
        const sessionConfig = {
            modalities: savedConfig.modalities || ["text", "audio"],
            // Turn detection - ensure we only send valid fields per API spec
            turn_detection: savedConfig.turn_detection ? Object.assign(Object.assign({ type: savedConfig.turn_detection.type }, (savedConfig.turn_detection.type === 'server_vad' ? {
                threshold: savedConfig.turn_detection.threshold || 0.5,
                prefix_padding_ms: savedConfig.turn_detection.prefix_padding_ms || 300,
                silence_duration_ms: savedConfig.turn_detection.silence_duration_ms || 500
            } : {})), (savedConfig.turn_detection.type === 'semantic_vad' ? {
                eagerness: savedConfig.turn_detection.eagerness || 'auto'
            } : {})) : {
                type: "server_vad", // Default to server_vad which is more stable
                threshold: 0.5,
                prefix_padding_ms: 300,
                silence_duration_ms: 500
            },
            // Audio formats - ensure we use correct format names
            input_audio_format: savedConfig.input_audio_format || "g711_ulaw",
            output_audio_format: savedConfig.output_audio_format || "g711_ulaw",
            // Voice selection - use a known working voice
            voice: savedConfig.voice || "alloy", // Use alloy as default (known to work)
        };
        // Remove any invalid fields that were accidentally added
        // The OpenAI Realtime API doesn't support create_response or interrupt_response fields
        // Store VAD mode for event handling logic
        session.vadMode = ((_a = sessionConfig.turn_detection) === null || _a === void 0 ? void 0 : _a.type) || 'server_vad';
        // Only add optional fields if they're defined
        if (savedConfig.instructions) {
            sessionConfig.instructions = savedConfig.instructions;
        }
        // Note: output_audio_gain is our local-only value, not sent to OpenAI
        // Apply user-specified tools if provided
        if (savedConfig.tools && Array.isArray(savedConfig.tools) && savedConfig.tools.length > 0) {
            sessionConfig.tools = savedConfig.tools;
        }
        // Apply advanced configuration options - clamp temperature to max of 1.2
        if (savedConfig.temperature !== undefined) {
            sessionConfig.temperature = Math.min(savedConfig.temperature, 1.2);
        }
        if (savedConfig.max_response_output_tokens !== undefined) {
            sessionConfig.max_output_tokens = savedConfig.max_response_output_tokens;
        }
        else if (savedConfig.max_output_tokens !== undefined) {
            sessionConfig.max_output_tokens = savedConfig.max_output_tokens;
        }
        // Apply enhanced audio transcription settings
        if (savedConfig.input_audio_transcription) {
            sessionConfig.input_audio_transcription = Object.assign(Object.assign({}, savedConfig.input_audio_transcription), { model: savedConfig.input_audio_transcription.model || 'gpt-4o-transcribe' });
        }
        // Support legacy transcription config
        if (savedConfig.transcription && !sessionConfig.input_audio_transcription) {
            sessionConfig.input_audio_transcription = {
                model: savedConfig.transcription.model || 'gpt-4o-transcribe'
            };
        }
        // Apply noise reduction settings
        if (savedConfig.input_audio_noise_reduction) {
            sessionConfig.input_audio_noise_reduction = savedConfig.input_audio_noise_reduction;
        }
        // Apply tool choice configuration
        if (savedConfig.tool_choice) {
            sessionConfig.tool_choice = savedConfig.tool_choice;
        }
        // Log the final config being sent
        console.log("Sending session.update with config:", JSON.stringify(sessionConfig, null, 2));
        jsonSend(session.modelConn, {
            type: "session.update",
            session: sessionConfig,
        });
        // Don't trigger initial response here - wait for session.updated event
    });
    session.modelConn.on("message", handleModelMessage);
    session.modelConn.on("error", (error) => {
        console.error("OpenAI WebSocket error:", error);
        console.error("Error details:", JSON.stringify(error, null, 2));
        console.error("Error stack:", error instanceof Error ? error.stack : 'No stack trace');
        closeModel();
    });
    session.modelConn.on("close", (code, reason) => {
        var _a;
        console.log("OpenAI WebSocket closed. Code:", code, "Reason:", reason === null || reason === void 0 ? void 0 : reason.toString());
        console.log("Close code details:");
        console.log("  1005: No status code present (usually means auth or protocol error)");
        console.log("  1006: Abnormal closure (no close frame received)");
        console.log("  1008: Policy violation");
        console.log("  1011: Internal server error");
        if (code === 1005) {
            console.error("Code 1005 likely indicates: Authentication failed, invalid API key, or model name issue");
            console.error("Current model URL:", MODEL_URL);
            console.error("API Key (first 10 chars):", (_a = session.openAIApiKey) === null || _a === void 0 ? void 0 : _a.substring(0, 10));
        }
        closeModel();
    });
    // Keep-alive pings to prevent idle disconnects
    const pingInterval = setInterval(() => {
        var _a, _b;
        try {
            if (isOpen(session.modelConn)) {
                (_b = (_a = session.modelConn).ping) === null || _b === void 0 ? void 0 : _b.call(_a);
            }
            else {
                clearInterval(pingInterval);
            }
        }
        catch (_c) {
            clearInterval(pingInterval);
        }
    }, 20000);
}
function handleModelMessage(data) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    const event = parseMessage(data);
    if (!event)
        return;
    console.log("Received from OpenAI:", event.type);
    if (!(0, realtimeEvents_1.isKnownRealtimeEvent)(String(event.type))) {
        // Keep forwarding unknown events, but flag in logs for visibility.
        console.warn("Unhandled/unknown Realtime event type:", event.type);
    }
    jsonSend(session.frontendConn, event);
    switch (event.type) {
        case "error":
            console.error("OpenAI API Error:", JSON.stringify(event.error, null, 2));
            break;
        case "response.function_call_arguments.done":
        case "response.content_part.done":
            console.log("Content part done:", event);
            break;
        case "session.created":
            console.log("Session created with ID:", (_a = event.session) === null || _a === void 0 ? void 0 : _a.id);
            break;
        case "session.updated":
            console.log("Session updated successfully with config:", JSON.stringify(event.session, null, 2));
            // Update VAD mode if changed
            if ((_c = (_b = event.session) === null || _b === void 0 ? void 0 : _b.turn_detection) === null || _c === void 0 ? void 0 : _c.type) {
                session.vadMode = event.session.turn_detection.type;
                console.log("VAD mode set to:", session.vadMode);
            }
            // Mark session as ready for audio
            session.sessionReady = true;
            // For semantic_vad with initiate instructions, trigger initial response with audio modality
            if (session.vadMode === 'semantic_vad' && isOpen(session.modelConn)) {
                const hasInitiateInstruction = (((_d = event.session) === null || _d === void 0 ? void 0 : _d.instructions) || '').toLowerCase().includes('initiate');
                if (hasInitiateInstruction) {
                    console.log("Triggering initial audio response for semantic_vad with initiate instruction");
                    jsonSend(session.modelConn, {
                        type: "response.create",
                        response: {
                            modalities: ["text", "audio"]
                        }
                    });
                }
            }
            break;
        // Input audio buffer lifecycle (server_vad)
        case "input_audio_buffer.cleared":
            console.log("Input buffer cleared by server");
            break;
        case "input_audio_buffer.timeout_triggered":
            console.log("Input buffer timeout triggered", {
                audio_start_ms: event.audio_start_ms,
                audio_end_ms: event.audio_end_ms,
                item_id: event.item_id,
            });
            // Often followed by a response.create on server side
            break;
        case "input_audio_buffer.speech_started":
            // Only handle for server VAD mode
            if (session.vadMode === 'server_vad') {
                // Track user speech to avoid empty commits
                session.hadSpeechSinceLastCommit = true;
                session.userSpeechStartTimestamp = session.latestMediaTimestamp || 0;
                // Cancel any in-flight response to enable barge-in
                if (isOpen(session.modelConn)) {
                    jsonSend(session.modelConn, { type: "response.cancel" });
                }
                handleTruncation();
            }
            else if (session.vadMode === 'semantic_vad') {
                // For semantic VAD, let OpenAI handle interruptions naturally
                console.log("Speech started (semantic_vad active - not interrupting)");
            }
            break;
        case "input_audio_buffer.speech_stopped":
            console.log("User stopped speaking");
            // Only manually handle for server VAD mode
            if (session.vadMode === 'server_vad') {
                const speechStart = session.userSpeechStartTimestamp || 0;
                const speechEnd = session.latestMediaTimestamp || 0;
                const speechDurationMs = speechEnd - speechStart;
                const hadSpeech = !!session.hadSpeechSinceLastCommit;
                if (isOpen(session.modelConn) && hadSpeech && speechDurationMs >= 120) {
                    jsonSend(session.modelConn, { type: "input_audio_buffer.commit" });
                    // Add small delay before response creation to prevent immediate responses
                    setTimeout(() => {
                        if (isOpen(session.modelConn)) {
                            jsonSend(session.modelConn, { type: "response.create" });
                        }
                    }, 200);
                }
                else {
                    console.log("Skip commit: too-short or no speech detected", { hadSpeech, speechDurationMs });
                }
                session.hadSpeechSinceLastCommit = false;
            }
            else if (session.vadMode === 'semantic_vad') {
                // Semantic VAD handles turn-taking automatically
                console.log("Speech stopped (semantic_vad will handle response timing)");
            }
            break;
        case "conversation.item.created":
            console.log("Conversation item created:", (_e = event.item) === null || _e === void 0 ? void 0 : _e.id);
            break;
        case "conversation.item.deleted":
            console.log("Conversation item deleted:", event.item_id);
            break;
        case "response.created":
            console.log("Response generation started");
            break;
        case "response.done":
            console.log("Response generation completed:", {
                status: (_f = event.response) === null || _f === void 0 ? void 0 : _f.status,
                usage: (_g = event.response) === null || _g === void 0 ? void 0 : _g.usage
            });
            break;
        case "response.output_item.added":
            console.log("Output item added:", (_h = event.item) === null || _h === void 0 ? void 0 : _h.type);
            break;
        case "response.audio.delta":
        case "response.output_audio.delta":
            // Streamed base64 g711_ulaw chunks
            if (!session.twilioConn || !session.streamSid) {
                console.error("Audio delta received but no Twilio connection:", {
                    hasTwilioConn: !!session.twilioConn,
                    hasStreamSid: !!session.streamSid,
                    streamSid: session.streamSid,
                    twilioReadyState: (_j = session.twilioConn) === null || _j === void 0 ? void 0 : _j.readyState
                });
            }
            if (session.twilioConn && session.streamSid) {
                if (session.responseStartTimestamp === undefined) {
                    session.responseStartTimestamp = session.latestMediaTimestamp || 0;
                }
                if (event.item_id)
                    session.lastAssistantItem = event.item_id;
                // Remove verbose logging to reduce overhead during audio streaming
                // Get base64 audio from either field name (compat for newer event types)
                const delta = (event.delta || event.audio);
                // Optional local output gain before sending to Twilio
                const gain = (session.saved_config && session.saved_config.output_audio_gain)
                    || Number(process.env.TWILIO_OUTPUT_GAIN || 1.0);
                let amplifiedAudio = delta;
                if (delta && gain && Number.isFinite(gain) && gain !== 1.0) {
                    amplifiedAudio = amplifyMuLawAudio(delta, Math.max(0.1, Math.min(Number(gain), 4.0)));
                }
                jsonSend(session.twilioConn, {
                    event: "media",
                    streamSid: session.streamSid,
                    media: { payload: amplifiedAudio },
                });
                // Add a proper mark payload per Twilio Media Streams spec
                jsonSend(session.twilioConn, {
                    event: "mark",
                    streamSid: session.streamSid,
                    mark: { name: `seg-${Date.now()}` },
                });
            }
            else {
                console.error("Cannot send audio: Missing Twilio connection or streamSid", {
                    hasTwilioConn: !!session.twilioConn,
                    hasStreamSid: !!session.streamSid
                });
            }
            break;
        case "response.audio.done":
        case "response.output_audio.done":
            console.log("Audio response completed");
            break;
        case "response.output_audio_transcript.delta":
        case "response.audio_transcript.delta":
            // Forwarded to client for live captions; server just logs.
            if (event.delta)
                console.log("Audio transcript delta:", event.delta);
            break;
        case "response.output_audio_transcript.done":
            console.log("Audio transcript done");
            break;
        case "response.text.delta":
        case "response.output_text.delta":
            if (event.delta) {
                console.log("Text delta:", event.delta);
            }
            break;
        case "response.text.done":
        case "response.output_text.done":
            if (event.text) {
                console.log("Text response:", event.text);
            }
            break;
        // Function/tool argument streaming
        case "response.function_call_arguments.delta":
        case "response.tool_call_arguments.delta":
            console.log("Fn/tool args delta:", event.delta);
            break;
        case "response.function_call_arguments.done":
        case "response.tool_call_arguments.done":
            console.log("Fn/tool args done for call:", event.call_id);
            break;
        // MCP tool calls and listing
        case "response.mcp_call.in_progress":
            console.log("MCP call started:", event.item_id);
            break;
        case "response.mcp_call.completed":
            console.log("MCP call completed:", event.item_id);
            break;
        case "response.mcp_call_arguments.delta":
            console.log("MCP call args delta:", event.delta);
            break;
        case "response.mcp_call_arguments.done":
            console.log("MCP call args done for item:", event.item_id);
            break;
        case "mcp_list_tools.in_progress":
            console.log("MCP list tools in progress:", event.item_id);
            break;
        case "mcp_list_tools.completed":
            ``;
            console.log("MCP list tools completed:", event.item_id);
            break;
        case "response.output_item.done": {
            const { item } = event;
            if ((item === null || item === void 0 ? void 0 : item.type) === "function_call" || (item === null || item === void 0 ? void 0 : item.type) === "tool_call") {
                handleFunctionCall(item)
                    .then((output) => {
                    if (session.modelConn) {
                        const isTool = item.type === "tool_call";
                        const resultItem = {
                            type: isTool ? "tool_result" : "function_call_output",
                            call_id: item.call_id || item.id,
                            tool_call_id: item.tool_call_id || item.call_id || item.id,
                            output: JSON.stringify(output),
                        };
                        jsonSend(session.modelConn, { type: "conversation.item.create", item: resultItem });
                        jsonSend(session.modelConn, { type: "response.create" });
                    }
                })
                    .catch((err) => {
                    console.error("Error handling function call:", err);
                });
            }
            break;
        }
    }
}
function handleTruncation() {
    if (!session.lastAssistantItem ||
        session.responseStartTimestamp === undefined)
        return;
    const elapsedMs = (session.latestMediaTimestamp || 0) - (session.responseStartTimestamp || 0);
    const audio_end_ms = elapsedMs > 0 ? elapsedMs : 0;
    if (isOpen(session.modelConn)) {
        jsonSend(session.modelConn, {
            type: "conversation.item.truncate",
            item_id: session.lastAssistantItem,
            content_index: 0,
            audio_end_ms,
        });
    }
    if (session.twilioConn && session.streamSid) {
        jsonSend(session.twilioConn, {
            event: "clear",
            streamSid: session.streamSid,
        });
    }
    session.lastAssistantItem = undefined;
    session.responseStartTimestamp = undefined;
}
function closeModel() {
    cleanupConnection(session.modelConn);
    session.modelConn = undefined;
    if (!session.twilioConn && !session.frontendConn)
        session = {};
}
function closeAllConnections() {
    if (session.twilioConn) {
        session.twilioConn.close();
        session.twilioConn = undefined;
    }
    if (session.modelConn) {
        session.modelConn.close();
        session.modelConn = undefined;
    }
    if (session.frontendConn) {
        session.frontendConn.close();
        session.frontendConn = undefined;
    }
    session.streamSid = undefined;
    session.callSid = undefined;
    session.lastAssistantItem = undefined;
    session.responseStartTimestamp = undefined;
    session.latestMediaTimestamp = undefined;
    session.saved_config = undefined;
}
function cleanupConnection(ws) {
    if (isOpen(ws))
        ws.close();
}
function parseMessage(data) {
    try {
        if (!data || !data.toString().trim()) {
            console.warn("Received empty or invalid message data");
            return null;
        }
        const msg = JSON.parse(data.toString());
        // Enhanced logging for audio data
        if (msg.type === "response.audio.delta") {
            console.log("OpenAI audio delta received:", {
                hasData: !!msg.delta,
                dataLength: msg.delta ? msg.delta.length : 0,
                itemId: msg.item_id || null
            });
        }
        return msg;
    }
    catch (err) {
        console.error("Failed to parse message:", err);
        return null;
    }
}
function jsonSend(ws, obj) {
    if (!isOpen(ws))
        return;
    ws.send(JSON.stringify(obj));
}
function isOpen(ws) {
    return !!ws && ws.readyState === ws_1.WebSocket.OPEN;
}
function setSessionConfig(config) {
    var _a;
    // Store the complete config object
    session.saved_config = config;
    console.log("Updated session configuration:", session.saved_config);
    // If we already have an active model connection, update it with the new configuration
    if (isOpen(session.modelConn)) {
        console.log("Updating active OpenAI session with new configuration");
        const sessionUpdate = {
            modalities: config.modalities || ["text", "audio"],
            turn_detection: config.turn_detection || {
                type: "semantic_vad", // Default to semantic VAD
                threshold: 0.5,
                prefix_padding_ms: 300,
                silence_duration_ms: 500,
                create_response: true,
                interrupt_response: true,
                eagerness: "auto"
            },
            // Support dynamic audio formats
            input_audio_format: config.input_audio_format || "g711_ulaw",
            output_audio_format: config.output_audio_format || "g711_ulaw",
            voice: (((_a = config === null || config === void 0 ? void 0 : config.audio) === null || _a === void 0 ? void 0 : _a.voice) || config.voice || "marin")
        };
        // Only add optional fields if defined
        if (config.instructions) {
            sessionUpdate.instructions = config.instructions;
        }
        // Clamp temperature to maximum allowed value
        if (config.temperature !== undefined) {
            sessionUpdate.temperature = Math.min(config.temperature, 1.2);
        }
        if (config.max_response_output_tokens !== undefined) {
            sessionUpdate.max_output_tokens = config.max_response_output_tokens;
        }
        else if (config.max_output_tokens !== undefined) {
            sessionUpdate.max_output_tokens = config.max_output_tokens;
        }
        // Enhanced transcription support
        if (config.input_audio_transcription) {
            sessionUpdate.input_audio_transcription = Object.assign(Object.assign({}, config.input_audio_transcription), { model: config.input_audio_transcription.model || 'gpt-4o-transcribe' });
        }
        // Support legacy transcription config
        if (config.transcription && !sessionUpdate.input_audio_transcription) {
            sessionUpdate.input_audio_transcription = {
                model: config.transcription.model || 'gpt-4o-transcribe'
            };
        }
        // Apply noise reduction settings
        if (config.input_audio_noise_reduction) {
            sessionUpdate.input_audio_noise_reduction = config.input_audio_noise_reduction;
        }
        // Apply tool choice configuration
        if (config.tool_choice) {
            sessionUpdate.tool_choice = config.tool_choice;
        }
        // Only add tools if they exist and are not empty
        if (config.tools && Array.isArray(config.tools) && config.tools.length > 0) {
            sessionUpdate.tools = config.tools;
        }
        jsonSend(session.modelConn, {
            type: "session.update",
            session: sessionUpdate
        });
    }
    return true;
}
function getSavedConfig() {
    return session.saved_config;
}
