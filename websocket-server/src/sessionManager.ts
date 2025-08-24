import { RawData, WebSocket } from "ws";
import functions from "./functionHandlers";

// µ-law decoding table
const MULAW_DECODE_TABLE = new Int16Array([
  -32124, -31100, -30076, -29052, -28028, -27004, -25980, -24956,
  -23932, -22908, -21884, -20860, -19836, -18812, -17788, -16764,
  -15996, -15484, -14972, -14460, -13948, -13436, -12924, -12412,
  -11900, -11388, -10876, -10364, -9852,  -9340,  -8828,  -8316,
  -7932,  -7676,  -7420,  -7164,  -6908,  -6652,  -6396,  -6140,
  -5884,  -5628,  -5372,  -5116,  -4860,  -4604,  -4348,  -4092,
  -3900,  -3772,  -3644,  -3516,  -3388,  -3260,  -3132,  -3004,
  -2876,  -2748,  -2620,  -2492,  -2364,  -2236,  -2108,  -1980,
  -1884,  -1820,  -1756,  -1692,  -1628,  -1564,  -1500,  -1436,
  -1372,  -1308,  -1244,  -1180,  -1116,  -1052,  -988,   -924,
  -876,   -844,   -812,   -780,   -748,   -716,   -684,   -652,
  -620,   -588,   -556,   -524,   -492,   -460,   -428,   -396,
  -372,   -356,   -340,   -324,   -308,   -292,   -276,   -260,
  -244,   -228,   -212,   -196,   -180,   -164,   -148,   -132,
  -120,   -112,   -104,   -96,    -88,    -80,    -72,    -64,
  -56,    -48,    -40,    -32,    -24,    -16,    -8,     0,
  32124,  31100,  30076,  29052,  28028,  27004,  25980,  24956,
  23932,  22908,  21884,  20860,  19836,  18812,  17788,  16764,
  15996,  15484,  14972,  14460,  13948,  13436,  12924,  12412,
  11900,  11388,  10876,  10364,  9852,   9340,   8828,   8316,
  7932,   7676,   7420,   7164,   6908,   6652,   6396,   6140,
  5884,   5628,   5372,   5116,   4860,   4604,   4348,   4092,
  3900,   3772,   3644,   3516,   3388,   3260,   3132,   3004,
  2876,   2748,   2620,   2492,   2364,   2236,   2108,   1980,
  1884,   1820,   1756,   1692,   1628,   1564,   1500,   1436,
  1372,   1308,   1244,   1180,   1116,   1052,   988,    924,
  876,    844,    812,    780,    748,    716,    684,    652,
  620,    588,    556,    524,    492,    460,    428,    396,
  372,    356,    340,    324,    308,    292,    276,    260,
  244,    228,    212,    196,    180,    164,    148,    132,
  120,    112,    104,    96,     88,     80,     72,     64,
  56,     48,     40,     32,     24,     16,     8,      0
]);

// Function to encode linear PCM to µ-law
function linearToMuLaw(sample: number): number {
  const MULAW_MAX = 0x1FFF;
  const MULAW_BIAS = 33;
  
  // Get the sign
  let sign = (sample >> 8) & 0x80;
  
  // Get magnitude
  if (sign !== 0) sample = -sample;
  
  // Clip the magnitude
  if (sample > MULAW_MAX) sample = MULAW_MAX;
  
  // Add bias
  sample = sample + MULAW_BIAS;
  
  // Get exponent
  let exponent = 7;
  for (let expMask = 0x4000; (sample & expMask) === 0; exponent--, expMask >>= 1) {}
  
  // Get mantissa
  let mantissa = (sample >> (exponent + 3)) & 0x0F;
  
  // Encode
  let mulaw = ~(sign | (exponent << 4) | mantissa);
  
  return mulaw & 0xFF;
}

// Function to amplify µ-law audio
function amplifyMuLawAudio(base64Audio: string, gainFactor: number): string {
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
      if (linearSample > 32767) linearSample = 32767;
      if (linearSample < -32768) linearSample = -32768;
      
      // Encode back to µ-law
      amplifiedBuffer[i] = linearToMuLaw(linearSample);
    }
    
    // Encode back to base64
    return amplifiedBuffer.toString('base64');
  } catch (error) {
    console.error("Error amplifying audio:", error);
    return base64Audio; // Return original if amplification fails
  }
}

interface OpenAISessionConfig {
  modalities: string[];
  turn_detection: { 
    type: 'none' | 'server_vad' | 'semantic_vad';
    threshold?: number;
    prefix_padding_ms?: number;
    silence_duration_ms?: number;
  };
  input_audio_format: string;
  output_audio_format: string;
  input_audio_transcription?: {
    model: 'whisper-1' | 'gpt-4o-transcribe' | 'gpt-4o-mini-transcribe';
  };
  voice?: 'alloy' | 'ash' | 'ballad' | 'coral' | 'echo' | 'sage' | 'shimmer' | 'verse';
  instructions?: string;
  tools?: any[];
  temperature?: number;
  max_response_output_tokens?: number | 'inf';
  recordCall?: boolean;
}

interface Session {
  twilioConn?: WebSocket;
  frontendConn?: WebSocket;
  modelConn?: WebSocket;
  streamSid?: string;
  callSid?: string;
  saved_config?: OpenAISessionConfig;
  lastAssistantItem?: string;
  responseStartTimestamp?: number;
  latestMediaTimestamp?: number;
  openAIApiKey?: string;
}

let session: Session = {};

export function handleCallConnection(ws: WebSocket, openAIApiKey: string) {
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
    if (!session.frontendConn) session = {};
  });
}

export function handleFrontendConnection(ws: WebSocket) {
  cleanupConnection(session.frontendConn);
  session.frontendConn = ws;

  ws.on("message", handleFrontendMessage);
  ws.on("close", () => {
    cleanupConnection(session.frontendConn);
    session.frontendConn = undefined;
    if (!session.twilioConn && !session.modelConn) session = {};
  });
}

async function handleFunctionCall(item: { name: string; arguments: string }) {
  console.log("Handling function call:", item);
  const fnDef = functions.find((f) => f.schema.name === item.name);
  if (!fnDef) {
    throw new Error(`No handler found for function: ${item.name}`);
  }

  let args: unknown;
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
  } catch {
    return JSON.stringify({
      error: "Invalid JSON arguments for function call.",
    });
  }

  try {
    console.log("Calling function:", fnDef.schema.name, args);
    const result = await fnDef.handler(args as any);
    
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
              await client.calls(session.callSid)
                .update({
                  twiml: `<Response><Play digits="${parsedResult.digits}"/></Response>`
                });
              
              console.log(`DTMF tones '${parsedResult.digits}' sent to call ${session.callSid}`);
            } catch (error) {
              console.error("Error sending DTMF tones:", error);
            }
          } else {
            console.error("Twilio credentials not configured for DTMF");
          }
        } else {
          console.error("No call SID available to send DTMF");
        }
      }
    } catch (e) {
      // Result is not JSON or doesn't contain special actions
      console.log("Function result is not a special action");
    }
    
    return result;
  } catch (err: any) {
    console.error("Error running function:", err);
    return JSON.stringify({
      error: `Error running function ${item.name}: ${err.message}`,
    });
  }
}

function handleTwilioMessage(data: RawData) {
  const msg = parseMessage(data);
  if (!msg) return;

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

function handleFrontendMessage(data: RawData) {
  const msg = parseMessage(data);
  if (!msg) return;

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

  // Use the latest model version as of August 2025
  const MODEL_URL = process.env.OPENAI_MODEL_URL || "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview";
  
  console.log("Connecting to OpenAI at:", MODEL_URL);
  console.log("Using API key:", session.openAIApiKey ? `${session.openAIApiKey.substring(0, 10)}...` : "NOT SET");
  
  session.modelConn = new WebSocket(
    MODEL_URL,
    {
      headers: {
        Authorization: `Bearer ${session.openAIApiKey}`,
        "OpenAI-Beta": "realtime=v1",
      },
    }
  );

  session.modelConn.on("open", () => {
    console.log("Connected to OpenAI Realtime API successfully");
    // Extract saved configuration and ensure it's properly typed
    const savedConfig = session.saved_config || {} as OpenAISessionConfig;
    console.log("Applying configuration to OpenAI session:", savedConfig);

    const sessionConfig: OpenAISessionConfig = {
      modalities: ["audio", "text"],  // Always enable both audio and text
      turn_detection: savedConfig.turn_detection,
      input_audio_format: "g711_ulaw",  // Twilio uses G.711 µ-law
      output_audio_format: "g711_ulaw", // Twilio expects G.711 µ-law
      instructions: savedConfig.instructions,  // Use EXACTLY what's configured in the interface
      voice: savedConfig.voice
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
    console.log("OpenAI WebSocket closed. Code:", code, "Reason:", reason?.toString());
    closeModel();
  });
}

function handleModelMessage(data: RawData) {
  const event = parseMessage(data);
  if (!event) return;

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
      console.log("Session created with ID:", event.session?.id);
      break;
      
    case "session.updated":
      console.log("Session updated successfully");
      // Trigger the initial greeting directly
      console.log("Triggering initial greeting");
      jsonSend(session.modelConn, {
        type: "response.create"
      });
      break;

    case "input_audio_buffer.speech_started":
      handleTruncation();
      break;
      
    case "input_audio_buffer.speech_stopped":
      console.log("User stopped speaking");
      break;
      
    case "conversation.item.created":
      console.log("Conversation item created:", event.item?.id);
      break;
      
    case "response.created":
      console.log("Response generation started");
      break;
      
    case "response.done":
      console.log("Response generation completed:", {
        status: event.response?.status,
        usage: event.response?.usage
      });
      break;
      
    case "response.output_item.added":
      console.log("Output item added:", event.item?.type);
      break;

    case "response.audio.delta":
      if (session.twilioConn && session.streamSid) {
        if (session.responseStartTimestamp === undefined) {
          session.responseStartTimestamp = session.latestMediaTimestamp || 0;
        }
        if (event.item_id) session.lastAssistantItem = event.item_id;

        // Debug logging to verify audio data is being received
        console.log("Sending audio delta to Twilio", {
          hasData: !!event.delta,
          dataLength: event.delta ? event.delta.length : 0,
          streamSid: session.streamSid
        });

        // Amplify the audio before sending
        let amplifiedAudio = event.delta;
        if (event.delta) {
          amplifiedAudio = amplifyMuLawAudio(event.delta, 2.5); // Amplify by 2.5x for stronger volume
        }

        jsonSend(session.twilioConn, {
          event: "media",
          streamSid: session.streamSid,
          media: { payload: amplifiedAudio },
        });

        jsonSend(session.twilioConn, {
          event: "mark",
          streamSid: session.streamSid,
        });
      } else {
        console.error("Cannot send audio: Missing Twilio connection or streamSid", {
          hasTwilioConn: !!session.twilioConn,
          hasStreamSid: !!session.streamSid
        });
      }
      break;

    case "response.audio.done":
      console.log("Audio response completed");
      break;
      
    case "response.text.delta":
      if (event.delta) {
        console.log("Text delta:", event.delta);
      }
      break;
      
    case "response.text.done":
      if (event.text) {
        console.log("Text response:", event.text);
      }
      break;

    case "response.output_item.done": {
      const { item } = event;
      if (item?.type === "function_call") {
        handleFunctionCall(item)
          .then((output) => {
            if (session.modelConn) {
              jsonSend(session.modelConn, {
                type: "conversation.item.create",
                item: {
                  type: "function_call_output",
                  call_id: item.call_id,
                  output: JSON.stringify(output),
                },
              });
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
  if (
    !session.lastAssistantItem ||
    session.responseStartTimestamp === undefined
  )
    return;

  const elapsedMs =
    (session.latestMediaTimestamp || 0) - (session.responseStartTimestamp || 0);
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
  if (!session.twilioConn && !session.frontendConn) session = {};
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

function cleanupConnection(ws?: WebSocket) {
  if (isOpen(ws)) ws.close();
}

function parseMessage(data: RawData): any {
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
  } catch (err) {
    console.error("Failed to parse message:", err);
    return null;
  }
}

function jsonSend(ws: WebSocket | undefined, obj: unknown) {
  if (!isOpen(ws)) return;
  ws.send(JSON.stringify(obj));
}

function isOpen(ws?: WebSocket): ws is WebSocket {
  return !!ws && ws.readyState === WebSocket.OPEN;
}

export function setSessionConfig(config: any) {
  // Store the complete config object
  session.saved_config = config;
  
  console.log("Updated session configuration:", session.saved_config);
  
  // If we already have an active model connection, update it with the new configuration
  if (isOpen(session.modelConn)) {
    console.log("Updating active OpenAI session with new configuration");
    
    const sessionUpdate: OpenAISessionConfig = {
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
      instructions: config.instructions
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
