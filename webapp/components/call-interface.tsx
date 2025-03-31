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
import { Button } from "@/components/ui/button";

interface LogEntry {
  timestamp: string;
  type: string;
  source: "client" | "server" | "twilio";
  data: any;
}

const CallInterface = () => {
  const [selectedPhoneNumber, setSelectedPhoneNumber] = useState("");
  const [allConfigsReady, setAllConfigsReady] = useState(false);
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
  const [sessionConfig, setSessionConfig] = useState({
    instructions: "You are a helpful assistant in a phone call.",
    voice: "alloy",
    tools: [],
    recordCall: false,
    recordingType: "record-from-answer-dual"
  });

  // Add state to track recording status
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDetails, setRecordingDetails] = useState<any>(null);

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
  const handleRealtimeEvent = (data: any) => {
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

    // Handle recording events
    if (data.type === "recording") {
      addLogEvent("recording_received", "server", data);
      
      // Update recording status
      setIsRecording(true);
      setRecordingDetails(data.data);
      
      // Display a toast notification about the recording
      if (typeof window !== 'undefined' && window.document) {
        // Add a toast notification if available in the app
        const toast = document.getElementById('toast-container');
        if (toast) {
          toast.innerHTML = `<div class="toast toast-success">Recording available: ${data.data.sid}</div>`;
          setTimeout(() => { toast.innerHTML = ''; }, 5000);
        }
      }
      
      console.log("Call recording available:", data.data);
    }

    // Maintain conversation items for non-session events
    if (data.type !== "session.update") {
      if (data.item) {
        setItems((prev) => [...prev, data.item]);
      }
    }
  };

  useEffect(() => {
    if (allConfigsReady && !ws) {
      // Create WebSocket connection
      const websocket = new WebSocket(
        process.env.NEXT_PUBLIC_WEBSOCKET_URL || "ws://localhost:8081/logs"
      );

      // Log connection attempt
      addLogEvent("connection_attempt", "client", {
        url: process.env.NEXT_PUBLIC_WEBSOCKET_URL || "ws://localhost:8081/logs",
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
          handleRealtimeEvent(data);
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
  }, [allConfigsReady]);

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

  // Load recording preferences from localStorage when component mounts
  useEffect(() => {
    const savedRecordCalls = localStorage.getItem("recordCalls");
    const savedRecordingType = localStorage.getItem("recordingType");
    
    const updatedConfig = { ...sessionConfig };
    
    if (savedRecordCalls) {
      updatedConfig.recordCall = JSON.parse(savedRecordCalls);
    }
    
    if (savedRecordingType) {
      updatedConfig.recordingType = savedRecordingType;
    }
    
    setSessionConfig(updatedConfig);
  }, []);

  return (
    <div className="h-screen bg-white flex flex-col">
      <ChecklistAndConfig
        ready={allConfigsReady}
        setReady={setAllConfigsReady}
        selectedPhoneNumber={selectedPhoneNumber}
        setSelectedPhoneNumber={setSelectedPhoneNumber}
      />
      <TopBar />
      <div className="flex-grow p-4 h-full overflow-hidden flex flex-col">
        <div className="grid grid-cols-12 gap-4 h-full">
          {/* Left Column */}
          <div className="col-span-3 flex flex-col h-full overflow-hidden gap-4">
            <SessionConfigurationPanel
              callStatus={callStatus}
              onSave={(config) => {
                setSessionConfig(config);
                
                // Update recording status in our state
                setIsRecording(config.recordCall || false);
                
                const updateEvent = {
                  type: "session.update",
                  session: {
                    instructions: config.instructions,
                    voice: config.voice,
                    tools: config.tools,
                    // Include recording configuration in the session update
                    recordCall: config.recordCall,
                    recordingType: config.recordingType,
                  },
                };
                console.log("Sending update event:", updateEvent);
                sendMessage(updateEvent);
              }}
            />
            <div className="flex-1 p-4 border rounded-md">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-semibold">Logs Preview</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.href = '/logs'}
                  className="text-xs"
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
          <div className="col-span-6 flex flex-col gap-4 h-full overflow-hidden">
            <PhoneNumberChecklist
              selectedPhoneNumber={selectedPhoneNumber}
              allConfigsReady={allConfigsReady}
              setAllConfigsReady={setAllConfigsReady}
            />
            <OutgoingCall 
              onCallInitiated={handleCallInitiated} 
              currentConfig={sessionConfig}
              isRecording={isRecording}
              recordingDetails={recordingDetails}
            />
            {isRecording && recordingDetails && (
              <div className="bg-green-50 border border-green-200 rounded-md p-3 mt-2 mb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="relative mr-2">
                      <div className="h-3 w-3 bg-red-500 rounded-full animate-pulse"></div>
                    </div>
                    <span className="font-medium text-green-800">Recording in progress</span>
                  </div>
                  <Button 
                    variant="link" 
                    size="sm"
                    onClick={() => window.location.href = '/recordings'}
                  >
                    View Recordings
                  </Button>
                </div>
              </div>
            )}
            <Transcript items={items} />
          </div>

          {/* Right Column: Function Calls */}
          <div className="col-span-3 flex flex-col h-full overflow-hidden">
            <FunctionCallsPanel 
              items={items} 
              ws={ws} 
              sendMessage={sendMessage} 
            />
          </div>
        </div>
      </div>
      {/* Toast container for notifications */}
      <div id="toast-container" className="fixed bottom-4 right-4 z-50"></div>
    </div>
  );
};

export default CallInterface;
