"use client";

import React, { useState, useEffect, useCallback } from "react";
import TopBar from "@/components/top-bar";
import ChecklistAndConfig from "@/components/checklist-and-config";
import SessionConfigurationPanel from "@/components/session-configuration-panel";
import Transcript from "@/components/transcript";
import FunctionCallsPanel from "@/components/function-calls-panel";
import { Item } from "@/components/types";
import handleRealtimeEvent from "@/lib/handle-realtime-event";
import PhoneNumberChecklist from "@/components/phone-number-checklist";
import OutgoingCall from "@/components/outgoing-call";
import RealtimeLogs from "@/components/realtime-logs-panel";
import PhonePad from "@/components/phone-pad";
import { Button } from "@/components/ui/button";

interface LogEntry {
  timestamp: string;
  type: string;
  source: "client" | "server" | "twilio";
  data: any;
}

const CallInterface = () => {
  const [selectedPhoneNumber, setSelectedPhoneNumber] = useState("");
  const [allConfigsReady, setAllConfigsReady] = useState(true);
  const [items, setItems] = useState<Item[]>([]);
  const [callStatus, setCallStatus] = useState("disconnected");
  const [realtimeLogs, setRealtimeLogs] = useState<
    {
      timestamp: string;
      type: string;
      source: "client" | "server" | "twilio";
      data: any;
    }[]
  >([]);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [currentCallSid, setCurrentCallSid] = useState<string | null>(null);
  const [sessionConfig, setSessionConfig] = useState({
    instructions: "You are Jingle.AI, a helpful voice assistant in a phone call. You have the ability to transfer calls and dial extensions when needed.",
    voice: "ash", // Updated to use new expressive voice
    model: "gpt-realtime",
    tools: [
      {
        type: "function",
        name: "transfer_call",
        description: "Transfer the current call to another phone number",
        parameters: {
          type: "object",
          properties: {
            phone_number: { type: "string", description: "Phone number to transfer to (E.164 format)" },
            reason: { type: "string", description: "Reason for transfer" }
          },
          required: ["phone_number"]
        }
      },
      {
        type: "function",
        name: "dial_extension",
        description: "Dial extension numbers or navigate IVR menus",
        parameters: {
          type: "object",
          properties: {
            digits: { type: "string", description: "Digits to dial (0-9, *, #)" },
            purpose: { type: "string", description: "Purpose of dialing" }
          },
          required: ["digits"]
        }
      },
      {
        type: "function",
        name: "get_call_info",
        description: "Get information about the current call",
        parameters: {
          type: "object",
          properties: {},
          required: []
        }
      }
    ],
    turn_detection: {
      type: "server_vad" as const,
      threshold: 0.5,
      prefix_padding_ms: 300,
      silence_duration_ms: 500
    },
    temperature: 0.8,
    transcription: {
      model: "whisper-1" as const
    }
  });

  // Add log event handler for client-side events with enhanced verbosity
  const addLogEvent = (type: string, source: "client" | "server" | "twilio", data: any) => {
    // Enhance data with additional context depending on event type
    let enhancedData = { ...data };
    
    // Add additional verbose information based on event type
    if (type === "outgoing_call_initiated") {
      enhancedData = {
        ...enhancedData,
        callDetails: {
          timestamp: new Date().toISOString(),
          phoneNumber: enhancedData.phoneNumber || "unknown",
          config: sessionConfig,
          browserInfo: {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
          }
        }
      };
    }
    
    // Add additional context for connection events
    if (type.includes("connection")) {
      enhancedData = {
        ...enhancedData,
        connectionDetails: {
          url: process.env.NEXT_PUBLIC_WEBSOCKET_URL || "ws://localhost:8081/logs",
          timestamp: new Date().toISOString(),
          sessionActive: !!sessionConfig,
        }
      };
    }
    
    // Add more context for session updates
    if (type === "session.update") {
      enhancedData = {
        ...enhancedData,
        previousState: callStatus,
      };
    }
    
    // Create final log entry with enhanced data
    const logEntry = {
      timestamp: new Date().toLocaleTimeString(),
      type,
      source,
      data: enhancedData,
    };
    
    setRealtimeLogs((prev) => {
      const newLogs = [...prev, logEntry];
      // Store logs in localStorage with a limit to prevent excessive storage use
      const logsToStore = newLogs.slice(-500); // Keep last 500 logs
      localStorage.setItem("realtimeLogs", JSON.stringify(logsToStore));
      return newLogs;
    });
  };

  // Custom sendMessage function that also logs the message
  const sendMessage = (message: any) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      // Add to logs before sending
      addLogEvent(message.type || "client_message", "client", message);
      ws.send(JSON.stringify(message));
    }
  };

  // Handle DTMF digit press
  const handleDigitPress = (digit: string) => {
    if (ws && ws.readyState === WebSocket.OPEN && currentCallSid) {
      const dtmfMessage = {
        type: "dtmf",
        digit: digit,
        callSid: currentCallSid,
      };
      sendMessage(dtmfMessage);
      addLogEvent("dtmf_sent", "client", { digit, callSid: currentCallSid });
    }
  };

  // Handle ending the call
  const handleEndCall = async () => {
    if (currentCallSid) {
      try {
        const response = await fetch("/api/twilio/end-call", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ callSid: currentCallSid }),
        });
        
        if (response.ok) {
          addLogEvent("call_ended", "client", { callSid: currentCallSid });
          setCurrentCallSid(null);
          setCallStatus("disconnected");
        }
      } catch (error) {
        console.error("Error ending call:", error);
        addLogEvent("error", "client", { message: "Failed to end call", error: String(error) });
      }
    }
  };

  // Handle initiating an outgoing call
  const handleCallInitiated = (phoneNumber: string, details?: any) => {
    // Determine the event type based on the provided parameters
    const eventType = details ? 
      (details.error ? 'outgoing_call_error' : 'outgoing_call_success') : 
      'outgoing_call_initiated';
    
    // Create the log data
    const logData = details || { 
      phoneNumber, 
      config: sessionConfig,
      timestamp: new Date().toISOString()
    };
    
    addLogEvent(eventType, "client", logData);
  };

  // Function to handle realtime events
  const handleEvent = (data: any) => {
    // Log every event immediately to ensure real-time display
    let source: "client" | "server" | "twilio" = "server";
    
    // Determine event source based on message structure
    if (data.type === "media" || data.type === "start" || data.type === "mark" || data.type === "close") {
      source = "twilio";
    }
    
    // Log the event immediately with its actual data structure
    addLogEvent(data.type || "unknown_event", source, data);
    
    // Now process the event for the UI state updates
    if (data.type === "session.update") {
      setCallStatus(data.state);
    }
    
    // Track call SID when call starts
    if (data.type === "start" && data.callSid) {
      setCurrentCallSid(data.callSid);
      addLogEvent("call_started", "server", { callSid: data.callSid });
    }
    
    // Clear call SID when call ends
    if (data.type === "stop" || data.type === "close") {
      setCurrentCallSid(null);
      setCallStatus("disconnected");
    }
    
    // Use the imported handleRealtimeEvent for transcript processing
    handleRealtimeEvent(data, setItems);
    
    // Handle errors
    if (data.type === "error") {
      console.error("OpenAI Error:", data.error);
      addLogEvent("error", "server", { error: data.error });
    }
  };

  useEffect(() => {
    if (!ws) {
      // Create WebSocket connection - use /logs endpoint for receiving all events
      const wsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL?.replace(/\/$/, '') || "ws://localhost:8081";
      const websocket = new WebSocket(`${wsUrl}/logs`);

      // Log connection attempt
      addLogEvent("connection_attempt", "client", {
        url: `${wsUrl}/logs`,
      });

      // Set up event handlers
      websocket.onopen = () => {
        console.log("WebSocket connection established");
        addLogEvent("connection_open", "client", {
          timestamp: new Date().toISOString(),
        });
        setCallStatus("connected");
      };

      websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          // Pass the data to the event handler
          handleEvent(data);
        } catch (e) {
          console.error("Error parsing WebSocket message:", e);
          addLogEvent("error", "client", {
            message: "Error parsing WebSocket message",
            error: String(e),
          });
        }
      };

      websocket.onclose = () => {
        console.log("WebSocket connection closed");
        addLogEvent("connection_closed", "client", {
          timestamp: new Date().toISOString(),
        });
        setCallStatus("disconnected");
      };

      websocket.onerror = (error) => {
        console.error("WebSocket error:", error);
        addLogEvent("connection_error", "client", {
          message: "WebSocket error",
          error: String(error),
        });
      };

      setWs(websocket);

      // Clean up when component unmounts
      return () => {
        websocket.close();
      };
    }
  }, []);

  // Load logs from localStorage on component mount
  useEffect(() => {
    const storedLogs = localStorage.getItem("realtimeLogs");
    if (storedLogs) {
      try {
        setRealtimeLogs(JSON.parse(storedLogs));
      } catch (e) {
        console.error("Error parsing stored logs:", e);
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-950 flex flex-col">
      <TopBar />
      <div className="flex-grow p-2 sm:p-4 lg:p-6 overflow-auto">
        {/* Mobile Layout */}
        <div className="block lg:hidden space-y-4">
          {/* Phone and Call Controls */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-4">
            <PhoneNumberChecklist
              selectedPhoneNumber={selectedPhoneNumber}
              allConfigsReady={true}
              setAllConfigsReady={() => {}}
            />
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-4">
            <OutgoingCall 
              onCallInitiated={handleCallInitiated} 
              currentConfig={sessionConfig}
            />
          </div>
          
          {/* Phone Pad - Show when call is active */}
          {currentCallSid && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-4">
              <PhonePad
                onDigitPress={handleDigitPress}
                onEndCall={handleEndCall}
                isCallActive={!!currentCallSid}
                disabled={false}
              />
            </div>
          )}
          
          {/* Transcript */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b dark:border-gray-700">
              <h3 className="font-semibold">Call Transcript</h3>
            </div>
            <div className="h-64 overflow-auto">
              <Transcript items={items} />
            </div>
          </div>
          
          {/* Collapsible Panels */}
          <details className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
            <summary className="p-4 cursor-pointer font-semibold">Configuration</summary>
            <div className="p-4 pt-0">
              <SessionConfigurationPanel
                callStatus={callStatus}
                onSave={async (config) => {
                  setSessionConfig(config);
                  const updateEvent = {
                    type: "session.update",
                    session: {
                      instructions: config.instructions,
                      voice: config.voice,
                      model: config.model,
                      prompt: config.prompt,
                      tools: config.tools,
                      turn_detection: config.turn_detection,
                      temperature: config.temperature,
                      transcription: (config as any).input_audio_transcription || (config as any).transcription,
                      max_output_tokens: (config as any).max_response_output_tokens ?? (config as any).max_output_tokens,
                      recordCall: config.recordCall,
                    },
                  };
                  console.log("Sending update event:", updateEvent);
                  sendMessage(updateEvent);

                  // Persist for next calls on the backend
                  try {
                    await fetch("http://localhost:8081/session-config", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(config),
                    });
                  } catch (e) {
                    console.warn("Failed to persist session config to backend:", e);
                  }
                }}
              />
            </div>
          </details>
          
          <details className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
            <summary className="p-4 cursor-pointer font-semibold">Logs</summary>
            <div className="p-4 pt-0 max-h-64 overflow-auto">
              <RealtimeLogs logs={realtimeLogs} />
            </div>
          </details>
          
          <details className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
            <summary className="p-4 cursor-pointer font-semibold">Function Calls</summary>
            <div className="p-4 pt-0">
              <FunctionCallsPanel 
                items={items} 
                ws={ws} 
                sendMessage={sendMessage} 
              />
            </div>
          </details>
        </div>
        
        {/* Desktop Layout */}
        <div className="hidden lg:grid grid-cols-12 gap-4 lg:gap-6 h-[calc(100vh-8rem)]">
          {/* Left Column */}
          <div className="col-span-3 flex flex-col gap-4 overflow-hidden">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 transition-all duration-300 hover:shadow-xl">
              <SessionConfigurationPanel
                callStatus={callStatus}
                onSave={async (config) => {
                  setSessionConfig(config);
                  const updateEvent = {
                    type: "session.update",
                    session: {
                      instructions: config.instructions,
                      voice: config.voice,
                      model: config.model,
                      prompt: config.prompt,
                      tools: config.tools,
                      turn_detection: config.turn_detection,
                      temperature: config.temperature,
                      transcription: (config as any).input_audio_transcription || (config as any).transcription,
                      max_output_tokens: (config as any).max_response_output_tokens ?? (config as any).max_output_tokens,
                      recordCall: config.recordCall,
                    },
                  };
                  console.log("Sending update event:", updateEvent);
                  sendMessage(updateEvent);

                  // Persist for next calls on the backend
                  try {
                    await fetch("http://localhost:8081/session-config", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(config),
                    });
                  } catch (e) {
                    console.warn("Failed to persist session config to backend:", e);
                  }
                }}
              />
            </div>
            <div className="flex-1 bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg border border-gray-100 dark:border-gray-700 transition-all duration-300 hover:shadow-xl">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-semibold dark:text-white">Logs Preview</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.href = '/logs'}
                  className="text-xs rounded-full"
                >
                  View Full Logs
                </Button>
              </div>
              <div className="h-[calc(100%-2rem)] overflow-hidden">
                <RealtimeLogs logs={realtimeLogs} />
              </div>
            </div>
          </div>

          {/* Middle Column: Transcript */}
          <div className="col-span-6 flex flex-col gap-4 overflow-hidden">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg border border-gray-100 dark:border-gray-700 transition-all duration-300 hover:shadow-xl">
              <PhoneNumberChecklist
                selectedPhoneNumber={selectedPhoneNumber}
                allConfigsReady={true}
                setAllConfigsReady={() => {}}
              />
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg border border-gray-100 dark:border-gray-700 transition-all duration-300 hover:shadow-xl">
              <OutgoingCall 
                onCallInitiated={handleCallInitiated} 
                currentConfig={sessionConfig}
              />
            </div>
            {/* Phone Pad - Show when call is active */}
            {currentCallSid && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg border border-gray-100 dark:border-gray-700 transition-all duration-300 hover:shadow-xl">
                <PhonePad
                  onDigitPress={handleDigitPress}
                  onEndCall={handleEndCall}
                  isCallActive={!!currentCallSid}
                  disabled={false}
                />
              </div>
            )}
            <div className="flex-1 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 transition-all duration-300 hover:shadow-xl overflow-hidden">
              <div className="p-4 border-b dark:border-gray-700">
                <h3 className="font-semibold">Call Transcript</h3>
              </div>
              <Transcript items={items} />
            </div>
          </div>

          {/* Right Column: Function Calls */}
          <div className="col-span-3 flex flex-col overflow-hidden">
            <div className="h-full bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 transition-all duration-300 hover:shadow-xl overflow-hidden">
              <FunctionCallsPanel 
                items={items} 
                ws={ws} 
                sendMessage={sendMessage} 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallInterface;
