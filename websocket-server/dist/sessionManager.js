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
    cleanupConnection(session.twilioConn);
    session.twilioConn = ws;
    session.openAIApiKey = openAIApiKey;
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
                    // Send transfer instruction to Twilio via TwiML update
                    // Note: Actual Twilio transfer would require updating the call with new TwiML
                    // For now, we'll log the transfer request
                    if (session.twilioConn && session.streamSid) {
                        // In a real implementation, you would make an API call to Twilio to update the call
                        console.log("Transfer requested to:", parsedResult.phone_number);
                        // The AI will announce the transfer based on the returned message
                    }
                }
                // Handle DTMF dial tones
                if (parsedResult.action === "dial" && parsedResult.digits) {
                    console.log("Sending DTMF tones:", parsedResult.digits);
                    if (session.callSid) {
                        // Use Twilio REST API to send DTMF tones
                        // Import twilio at the top of the file
                        const accountSid = process.env.TWILIO_ACCOUNT_SID;
                        const authToken = process.env.TWILIO_AUTH_TOKEN;
                        if (accountSid && authToken) {
                            try {
                                // We'll need to import twilio client
                                const twilio = require('twilio');
                                const client = twilio(accountSid, authToken);
                                // Send DTMF tones via Twilio API
                                yield client.calls(session.callSid)
                                    .update({
                                    twiml: `<Response><Play digits="${parsedResult.digits}"/></Response>`
                                });
                                console.log(`DTMF tones '${parsedResult.digits}' sent to call ${session.callSid}`);
                            }
                            catch (error) {
                                console.error("Error sending DTMF tones:", error);
                            }
                        }
                        else {
                            console.error("Twilio credentials not configured for DTMF");
                        }
                    }
                    else {
                        console.error("No call SID available to send DTMF");
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
            console.log("Call started with SID:", session.callSid);
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
        case "close":
            closeAllConnections();
            break;
    }
}
function handleFrontendMessage(data) {
    const msg = parseMessage(data);
    if (!msg)
        return;
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
        console.log("Connected to OpenAI Realtime API successfully");
        // Extract saved configuration and ensure it's properly typed
        const savedConfig = session.saved_config || {};
        console.log("Applying configuration to OpenAI session:", savedConfig);
        const sessionConfig = {
            modalities: ["audio", "text"],
            // Default to server VAD if not provided
            turn_detection: savedConfig.turn_detection || {
                type: "server_vad",
                threshold: 0.5,
                prefix_padding_ms: 400,
                silence_duration_ms: 800,
            },
            // Twilio expects G.711 µ-law at 8kHz for both input and output
            input_audio_format: "g711_ulaw",
            output_audio_format: "g711_ulaw",
            instructions: savedConfig.instructions,
            prompt: savedConfig.prompt,
            voice: savedConfig.voice,
            output_audio_gain: savedConfig.output_audio_gain,
        };
        // Apply user-specified tools if provided
        if (savedConfig.tools && Array.isArray(savedConfig.tools) && savedConfig.tools.length > 0) {
            sessionConfig.tools = savedConfig.tools;
        }
        // Apply advanced configuration options - clamp temperature to max of 1.2
        if (savedConfig.temperature !== undefined) {
            sessionConfig.temperature = Math.min(savedConfig.temperature, 1.2);
        }
        if (savedConfig.max_response_output_tokens !== undefined) {
            sessionConfig.max_response_output_tokens = savedConfig.max_response_output_tokens;
        }
        // Apply audio transcription settings if provided
        if (savedConfig.input_audio_transcription) {
            sessionConfig.input_audio_transcription = savedConfig.input_audio_transcription;
        }
        // Apply enhanced audio processing parameters
        if (savedConfig.input_audio_noise_reduction) {
            sessionConfig.input_audio_noise_reduction = savedConfig.input_audio_noise_reduction;
        }
        // Removed: input_audio_gain_control (unsupported by API)
        // Removed: response_eagerness (unsupported by API)
        if (savedConfig.response_presence_penalty !== undefined) {
            sessionConfig.response_presence_penalty = savedConfig.response_presence_penalty;
        }
        if (savedConfig.response_frequency_penalty !== undefined) {
            sessionConfig.response_frequency_penalty = savedConfig.response_frequency_penalty;
        }
        if (savedConfig.response_output_audio_sample_rate) {
            sessionConfig.response_output_audio_sample_rate = savedConfig.response_output_audio_sample_rate;
        }
        if (savedConfig.response_output_audio_channels) {
            sessionConfig.response_output_audio_channels = savedConfig.response_output_audio_channels;
        }
        jsonSend(session.modelConn, {
            type: "session.update",
            session: sessionConfig,
        });
        // Don't trigger initial response here - wait for session.updated event
    });
    session.modelConn.on("message", handleModelMessage);
    session.modelConn.on("error", (error) => {
        console.error("OpenAI WebSocket error:", error);
        closeModel();
    });
    session.modelConn.on("close", (code, reason) => {
        console.log("OpenAI WebSocket closed. Code:", code, "Reason:", reason === null || reason === void 0 ? void 0 : reason.toString());
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
    var _a, _b, _c, _d, _e;
    const event = parseMessage(data);
    if (!event)
        return;
    console.log("Received from OpenAI:", event.type);
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
            console.log("Session updated successfully");
            // Do not auto-greet; wait for user speech and a commit
            break;
        case "input_audio_buffer.speech_started":
            // Track user speech to avoid empty commits
            session.hadSpeechSinceLastCommit = true;
            session.userSpeechStartTimestamp = session.latestMediaTimestamp || 0;
            // Cancel any in-flight response to enable barge-in
            if (isOpen(session.modelConn)) {
                jsonSend(session.modelConn, { type: "response.cancel" });
            }
            handleTruncation();
            break;
        case "input_audio_buffer.speech_stopped":
            console.log("User stopped speaking");
            const speechStart = session.userSpeechStartTimestamp || 0;
            const speechEnd = session.latestMediaTimestamp || 0;
            const speechDurationMs = speechEnd - speechStart;
            const hadSpeech = !!session.hadSpeechSinceLastCommit;
            if (isOpen(session.modelConn) && hadSpeech && speechDurationMs >= 120) {
                jsonSend(session.modelConn, { type: "input_audio_buffer.commit" });
                jsonSend(session.modelConn, { type: "response.create" });
            }
            else {
                console.log("Skip commit: too-short or no speech detected", { hadSpeech, speechDurationMs });
            }
            session.hadSpeechSinceLastCommit = false;
            break;
        case "conversation.item.created":
            console.log("Conversation item created:", (_b = event.item) === null || _b === void 0 ? void 0 : _b.id);
            break;
        case "response.created":
            console.log("Response generation started");
            break;
        case "response.done":
            console.log("Response generation completed:", {
                status: (_c = event.response) === null || _c === void 0 ? void 0 : _c.status,
                usage: (_d = event.response) === null || _d === void 0 ? void 0 : _d.usage
            });
            break;
        case "response.output_item.added":
            console.log("Output item added:", (_e = event.item) === null || _e === void 0 ? void 0 : _e.type);
            break;
        case "response.audio.delta":
        case "response.output_audio.delta":
            if (session.twilioConn && session.streamSid) {
                if (session.responseStartTimestamp === undefined) {
                    session.responseStartTimestamp = session.latestMediaTimestamp || 0;
                }
                if (event.item_id)
                    session.lastAssistantItem = event.item_id;
                // Debug logging to verify audio data is being received
                console.log("Sending audio delta to Twilio", {
                    hasData: !!event.delta,
                    dataLength: event.delta ? event.delta.length : 0,
                    streamSid: session.streamSid
                });
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
    // Store the complete config object
    session.saved_config = config;
    console.log("Updated session configuration:", session.saved_config);
    // If we already have an active model connection, update it with the new configuration
    if (isOpen(session.modelConn)) {
        console.log("Updating active OpenAI session with new configuration");
        const sessionUpdate = {
            modalities: ["audio", "text"],
            turn_detection: config.turn_detection || {
                type: "server_vad",
                threshold: 0.5,
                prefix_padding_ms: 300,
                silence_duration_ms: 500
            },
            input_audio_format: "g711_ulaw",
            output_audio_format: "g711_ulaw",
            voice: config.voice || "ash",
            instructions: config.instructions,
            prompt: config.prompt,
            output_audio_gain: config.output_audio_gain
        };
        // Clamp temperature to maximum allowed value
        if (config.temperature !== undefined) {
            sessionUpdate.temperature = Math.min(config.temperature, 1.2);
        }
        if (config.max_response_output_tokens !== undefined) {
            sessionUpdate.max_response_output_tokens = config.max_response_output_tokens;
        }
        if (config.input_audio_transcription) {
            sessionUpdate.input_audio_transcription = config.input_audio_transcription;
        }
        // Apply enhanced audio processing parameters
        if (config.input_audio_noise_reduction) {
            sessionUpdate.input_audio_noise_reduction = config.input_audio_noise_reduction;
        }
        // Removed: input_audio_gain_control (unsupported by API)
        // Removed: response_eagerness (unsupported by API)
        if (config.response_presence_penalty !== undefined) {
            sessionUpdate.response_presence_penalty = config.response_presence_penalty;
        }
        if (config.response_frequency_penalty !== undefined) {
            sessionUpdate.response_frequency_penalty = config.response_frequency_penalty;
        }
        if (config.response_output_audio_sample_rate) {
            sessionUpdate.response_output_audio_sample_rate = config.response_output_audio_sample_rate;
        }
        if (config.response_output_audio_channels) {
            sessionUpdate.response_output_audio_channels = config.response_output_audio_channels;
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
