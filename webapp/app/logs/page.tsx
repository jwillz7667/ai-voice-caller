"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RealtimeLogs, { LogEntry } from "@/components/realtime-logs-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import Link from "next/link";
import { Home } from "lucide-react";

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected" | "error">("disconnected");
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Load saved logs from localStorage
    const savedLogs = localStorage.getItem("realtimeLogs");
    if (savedLogs) {
      setLogs(JSON.parse(savedLogs));
    }
    
    // Connect to WebSocket for real-time logs
    const websocketUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || "ws://localhost:8081/logs";
    let wsConnection: WebSocket | null = null;
    
    const connectWebSocket = () => {
      setConnectionStatus("connecting");
      const ws = new WebSocket(websocketUrl);
      wsConnection = ws;
      
      ws.onopen = () => {
        setIsConnected(true);
        setConnectionStatus("connected");
        
        // Add connection event to logs
        addLogEvent("websocket.connection.open", "client", {
          timestamp: new Date().toISOString(),
          url: websocketUrl
        });
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Process the incoming event
          if (data.event) {
            // The data already has an event property, so we can use it directly
            addLogEvent(data.event, "server", data);
          } else {
            // Generic log for other messages
            addLogEvent("websocket.message", "server", data);
          }
        } catch (err) {
          console.error("Error parsing WebSocket message:", err);
          
          // Log parsing errors
          addLogEvent("websocket.parse.error", "client", { 
            error: (err as Error).message,
            rawData: typeof event.data === 'string' && event.data.length < 1000 ? event.data : '[large data]'
          });
        }
      };
      
      ws.onerror = (error) => {
        setConnectionStatus("error");
        setError("Failed to connect to WebSocket server");
        
        // Log error details
        addLogEvent("websocket.connection.error", "client", {
          timestamp: new Date().toISOString(),
          error: "WebSocket connection error"
        });
      };
      
      ws.onclose = () => {
        setIsConnected(false);
        setConnectionStatus("disconnected");
        
        // Log connection closed
        addLogEvent("websocket.connection.close", "client", {
          timestamp: new Date().toISOString()
        });
      };
    };
    
    connectWebSocket();
    
    return () => {
      if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
        wsConnection.close();
      }
    };
  }, []); // Empty dependency array to ensure the effect only runs once
  
  // Add log event handler
  const addLogEvent = (type: string, source: "client" | "server" | "twilio", data: any) => {
    // Create enhanced data with additional context
    let enhancedData = { ...data };
    
    // Add connection context for connection-related events
    if (type.includes("connection")) {
      enhancedData = {
        ...enhancedData,
        connectionDetails: {
          url: process.env.NEXT_PUBLIC_WEBSOCKET_URL || "ws://localhost:8081/logs",
          timestamp: new Date().toISOString(),
          browserInfo: {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
          }
        }
      };
    }
    
    const logEntry: LogEntry = {
      timestamp: new Date().toLocaleTimeString(),
      type,
      source,
      data: enhancedData,
    };
    
    setLogs((prev) => {
      const newLogs = [...prev, logEntry];
      // Keep the last 500 logs to avoid excessive memory usage
      const logsToStore = newLogs.slice(-500);
      localStorage.setItem("realtimeLogs", JSON.stringify(logsToStore));
      return logsToStore;
    });
  };
  
  const clearLogs = () => {
    localStorage.removeItem("realtimeLogs");
    setLogs([]);
  };
  
  const getConnectionStatusBadge = () => {
    switch (connectionStatus) {
      case "connected":
        return <Badge className="bg-green-100 text-green-800">Connected</Badge>;
      case "connecting":
        return <Badge className="bg-yellow-100 text-yellow-800">Connecting...</Badge>;
      case "error":
        return <Badge className="bg-red-100 text-red-800">Connection Error</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Disconnected</Badge>;
    }
  };
  
  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Realtime Logs</h1>
          <p className="text-gray-500 text-sm">
            View detailed log entries for all events and WebSocket communication
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Home size={16} />
              <span>Home</span>
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            {getConnectionStatusBadge()}
            {error && <span className="text-sm text-red-600">{error}</span>}
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={clearLogs}
          >
            Clear Logs
          </Button>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border">
        <Tabs defaultValue="all">
          <div className="flex justify-between items-center p-3 border-b">
            <TabsList>
              <TabsTrigger value="all">All Logs ({logs.length})</TabsTrigger>
              <TabsTrigger value="client">Client ({logs.filter(log => log.source === "client").length})</TabsTrigger>
              <TabsTrigger value="server">Server ({logs.filter(log => log.source === "server").length})</TabsTrigger>
              <TabsTrigger value="twilio">Twilio ({logs.filter(log => log.source === "twilio").length})</TabsTrigger>
            </TabsList>
          </div>
          
          <ScrollArea className="h-[calc(100vh-220px)]">
            <div className="p-4">
              <TabsContent value="all" className="m-0">
                <RealtimeLogs logs={logs} />
              </TabsContent>
              <TabsContent value="client" className="m-0">
                <RealtimeLogs logs={logs.filter(log => log.source === "client")} />
              </TabsContent>
              <TabsContent value="server" className="m-0">
                <RealtimeLogs logs={logs.filter(log => log.source === "server")} />
              </TabsContent>
              <TabsContent value="twilio" className="m-0">
                <RealtimeLogs logs={logs.filter(log => log.source === "twilio")} />
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>
      </div>
    </div>
  );
}
