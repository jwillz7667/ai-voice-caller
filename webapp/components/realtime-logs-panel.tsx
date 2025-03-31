"use client";

import React, { useState, useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  AlertCircle, 
  Activity, 
  Clock, 
  Server, 
  Radio, 
  Smartphone, 
  Filter, 
  ChevronDown, 
  ChevronUp, 
  Code, 
  Copy, 
  Info, 
  Eye,
  CheckCircle2,
  XCircle,
  Zap,
  Volume2,
  Mic,
  Video,
  CircleDot
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

// Export the LogEntry interface
export interface LogEntry {
  timestamp: string;
  type: string;
  source: "client" | "server" | "twilio";
  data: any;
}

export const RealtimeLogs = ({ logs, fullPage = false }: { logs: LogEntry[], fullPage?: boolean }) => {
  const scrollRefs = {
    all: useRef<HTMLDivElement>(null),
    client: useRef<HTMLDivElement>(null),
    server: useRef<HTMLDivElement>(null),
    twilio: useRef<HTMLDivElement>(null),
    errors: useRef<HTMLDivElement>(null),
    transactions: useRef<HTMLDivElement>(null),
  };
  
  const [activeTab, setActiveTab] = useState("all");
  const [autoScroll, setAutoScroll] = useState(true);
  const [typeFilters, setTypeFilters] = useState<string[]>([]);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [expandedLogs, setExpandedLogs] = useState<number[]>([]);
  const [viewRawMode, setViewRawMode] = useState<number | null>(null);

  // Extract unique event types from logs
  const uniqueEventTypes = Array.from(new Set(logs.map(log => log.type)));

  // Check if a log entry is an error
  const isError = (log: LogEntry) => 
    log.type.toLowerCase().includes('error') || 
    (log.data && typeof log.data === 'object' && log.data.error);

  // Check if a log entry is a transaction (start/end of an operation)
  const isTransaction = (log: LogEntry) => 
    log.type.includes('start') || 
    log.type.includes('create') || 
    log.type.includes('update') || 
    log.type.includes('close');

  // Toggle expanded state of a log entry
  const toggleExpanded = (index: number) => {
    setExpandedLogs(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index) 
        : [...prev, index]
    );
  };

  // Toggle raw view mode
  const toggleRawView = (index: number) => {
    setViewRawMode(prev => prev === index ? null : index);
  };

  // Copy log content to clipboard
  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    // Could add a toast notification here
  };

  useEffect(() => {
    // Auto-scroll to bottom on new logs if autoScroll is enabled
    if (autoScroll) {
      const currentRef = scrollRefs[activeTab as keyof typeof scrollRefs];
      if (currentRef?.current) {
        currentRef.current.scrollTop = currentRef.current.scrollHeight;
      }
    }
  }, [logs, autoScroll, activeTab]);

  const getTypeColor = (type: string) => {
    const typeMap: Record<string, string> = {
      // OpenAI events
      "session.update": "bg-blue-100 text-blue-800",
      "response.audio.delta": "bg-green-100 text-green-800",
      "response.text.delta": "bg-yellow-100 text-yellow-800",
      "conversation.item.create": "bg-purple-100 text-purple-800",
      "input_audio_transcription.delta": "bg-orange-100 text-orange-800",
      "input_audio_buffer.speech_started": "bg-teal-100 text-teal-800",
      "input_audio_buffer.speech_finished": "bg-teal-100 text-teal-800",
      "function_call": "bg-indigo-100 text-indigo-800",
      "function_call_output": "bg-violet-100 text-violet-800",
      "input_audio_buffer.append": "bg-gray-100 text-gray-800",
      "response.create": "bg-green-100 text-green-800",
      
      // Twilio events
      "start": "bg-blue-100 text-blue-800",
      "media": "bg-green-100 text-green-800",
      "mark": "bg-gray-100 text-gray-800",
      "close": "bg-red-100 text-red-800",
      
      // Client events
      "connection_attempt": "bg-blue-100 text-blue-800",
      "connection_open": "bg-green-100 text-green-800",
      "connection_closed": "bg-red-100 text-red-800",
      "connection_error": "bg-red-100 text-red-800",
      "outgoing_call_initiated": "bg-blue-100 text-blue-800",
      "client_message": "bg-gray-100 text-gray-800",
      
      // Defaults
      "error": "bg-red-100 text-red-800",
      "default": "bg-gray-100 text-gray-800",
    };

    return typeMap[type] || typeMap["default"];
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case "client":
        return <Smartphone className="w-3 h-3 mr-1" />;
      case "server":
        return <Server className="w-3 h-3 mr-1" />;
      case "twilio":
        return <Radio className="w-3 h-3 mr-1" />;
      default:
        return null;
    }
  };

  // Function to get an appropriate icon for log event type
  const getEventIcon = (type: string) => {
    if (type === "connection_open") return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    if (type === "connection_closed") return <XCircle className="h-4 w-4 text-red-500" />;
    if (type === "connection_error") return <AlertCircle className="h-4 w-4 text-red-500" />;
    if (type === "error") return <AlertCircle className="h-4 w-4 text-red-500" />;
    if (type === "response.output_item.done") return <Zap className="h-4 w-4 text-yellow-500" />;
    if (type === "response.audio.delta") return <Volume2 className="h-4 w-4 text-blue-500" />;
    if (type.includes("speech")) return <Mic className="h-4 w-4 text-green-500" />;
    if (type === "recording" || type === "recording_received") return <Video className="h-4 w-4 text-purple-500" />;
    return <CircleDot className="h-4 w-4 text-gray-500" />;
  };

  // Function to format log data into readable text
  const formatLogData = (type: string, data: any): string => {
    try {
      if (type === "recording" || type === "recording_received") {
        if (data.data && data.data.recordingUrl) {
          return `Recording available: SID=${data.data.recordingSid} Duration=${data.data.duration}s URL=${data.data.recordingUrl}`;
        }
        return "Recording event received";
      }
      
      if (type === "session.update" && data.status) {
        return `Status: ${data.status}`;
      }
      
      if (type === "media" && data.chunk && data.chunk.type) {
        // Truncate large media chunks for display
        const chunkSize = data.chunk.size || data.chunk.length || 0;
        return `Media chunk: ${data.chunk.type}, Size: ${formatBytes(chunkSize)}`;
      }
      
      if (type === "transcription") {
        return `Transcription: ${data.text || 'No text'}`;
      }
      
      // For outgoing calls, show phone number
      if (data.phoneNumber) {
        return `Phone: ${data.phoneNumber}`;
      }
      
      // For other objects, show a condensed representation
      const entries = Object.entries(data);
      if (entries.length > 3) {
        const mainEntries = entries.slice(0, 3);
        return mainEntries.map(([key, value]) => `${key}: ${formatValue(value)}`).join(', ') + ` (+${entries.length - 3} more fields)`;
      }
      
      return entries.map(([key, value]) => `${key}: ${formatValue(value)}`).join(', ');
    } catch (e) {
      return "Unknown";
    }
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'object') return Array.isArray(value) ? `[Array(${value.length})]` : '{Object}';
    return String(value);
  };

  const formatBytes = (bytes: number, decimals = 2): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // Calculate event size for information panel
  const calculateEventSize = (data: any): string => {
    try {
      const jsonString = JSON.stringify(data);
      return formatBytes(new Blob([jsonString]).size);
    } catch (e) {
      return "Unknown";
    }
  };

  // Filter logs based on source and type
  const filterLogs = (source: string | null, additionalFilter?: (log: LogEntry) => boolean) => {
    return logs.filter(log => {
      // Apply source filter if specified
      const sourceMatch = source ? log.source === source : true;
      
      // Apply type filters if any are selected
      const typeMatch = typeFilters.length > 0 ? typeFilters.includes(log.type) : true;
      
      // Apply additional filter if provided
      const additionalMatch = additionalFilter ? additionalFilter(log) : true;
      
      return sourceMatch && typeMatch && additionalMatch;
    });
  };

  // Get logs for each tab
  const allLogs = filterLogs(null);
  const clientLogs = filterLogs("client");
  const serverLogs = filterLogs("server");
  const twilioLogs = filterLogs("twilio");
  const errorLogs = filterLogs(null, isError);
  const transactionLogs = filterLogs(null, isTransaction);

  // Count for each tab
  const counts = {
    all: allLogs.length,
    client: clientLogs.length,
    server: serverLogs.length,
    twilio: twilioLogs.length,
    errors: errorLogs.length,
    transactions: transactionLogs.length,
  };

  // Get verbose information about a log entry
  const getVerboseInfo = (log: LogEntry): { [key: string]: string } => {
    const result: { [key: string]: string } = {};
    
    // Add event ID
    result["Event ID"] = `${log.source}-${log.type}-${log.timestamp.replace(/:/g, "-")}`;

    // Add time details
    const timeInfo = new Date();
    result["Time (ISO)"] = timeInfo.toISOString();
    result["Time (Local)"] = timeInfo.toLocaleString();
    
    // Add type details
    result["Event Category"] = log.type.includes('.') ? log.type.split('.')[0] : 'base';
    
    // Add data size if available
    if (log.data) {
      try {
        const size = JSON.stringify(log.data).length;
        result["Data Size"] = `${size} bytes`;
      } catch (e) {
        // Do nothing if we can't stringify
      }
    }
    
    return result;
  };

  const LogItem = ({ log, index }: { log: LogEntry; index: number }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [showRawData, setShowRawData] = useState(false);

    const toggleExpand = () => setIsExpanded(!isExpanded);
    const toggleRawData = () => setShowRawData(!showRawData);

    const copyToClipboard = () => {
      navigator.clipboard.writeText(JSON.stringify(log, null, 2));
    };

    // Color helpers
    const getSourceColor = (source: string): string => {
      switch (source) {
        case "client":
          return "bg-blue-100 text-blue-800";
        case "server":
          return "bg-purple-100 text-purple-800";
        case "twilio":
          return "bg-orange-100 text-orange-800";
        default:
          return "bg-gray-100 text-gray-800";
      }
    };

    const getEventIconAndColor = () => {
      const type = log.type;
      let icon = <Activity className="w-3 h-3" />;
      let color = "bg-gray-100 text-gray-800";

      if (type.includes("error")) {
        icon = <AlertCircle className="w-3 h-3" />;
        color = "bg-red-100 text-red-800";
      } else if (type.includes("transcription")) {
        icon = <Radio className="w-3 h-3" />;
        color = "bg-indigo-100 text-indigo-800";
      } else if (type.includes("media")) {
        icon = <Radio className="w-3 h-3" />;
        color = "bg-green-100 text-green-800";
      } else if (type.includes("connection")) {
        icon = <Server className="w-3 h-3" />;
        color = "bg-cyan-100 text-cyan-800";
      } else if (type.includes("call")) {
        icon = <Smartphone className="w-3 h-3" />;
        color = "bg-amber-100 text-amber-800";
      }

      return { icon, color };
    };

    const { icon, color } = getEventIconAndColor();

    return (
      <div 
        className={`border p-2 rounded mb-1 ${
          isExpanded ? "bg-gray-50" : ""
        }`}
      >
        {/* Log header */}
        <div className="flex justify-between items-center">
          <div className="flex gap-1 items-center">
            <button
              onClick={toggleExpand}
              className="p-1 hover:bg-gray-100 rounded"
              aria-label={isExpanded ? "Collapse log" : "Expand log"}
            >
              {isExpanded ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronUp className="w-3 h-3" />
              )}
            </button>
            <Badge 
              variant="outline" 
              className={getSourceColor(log.source)}
            >
              {log.source}
            </Badge>
            <Badge variant="outline" className={color}>
              <span className="flex items-center gap-1">
                {icon}
                {log.type}
              </span>
            </Badge>
            <span className="text-xs text-gray-500">{log.timestamp}</span>
          </div>

          <div className="flex">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={copyToClipboard}
                    className="p-1 hover:bg-gray-100 rounded"
                    aria-label="Copy log to clipboard"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Copy log to clipboard</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Simple preview when collapsed */}
        {!isExpanded && (
          <div className="mt-1 text-xs text-gray-600 truncate pl-6">
            {formatLogData(log.type, log.data)}
          </div>
        )}

        {/* Expanded view with detailed information */}
        {isExpanded && (
          <div className="mt-2 pl-6 space-y-2">
            {/* Data view toggle */}
            <div className="flex justify-between items-center text-xs">
              <button
                onClick={toggleRawData}
                className="flex items-center gap-1 text-gray-500 hover:text-gray-700"
              >
                <Code className="w-3 h-3" />
                {showRawData ? "Show Formatted" : "Show Raw Data"}
              </button>
            </div>

            {/* Data content */}
            <div className="bg-gray-50 p-2 rounded border text-xs overflow-x-auto">
              <pre className="whitespace-pre-wrap break-words max-h-60 overflow-y-auto">
                {formatLogData(log.type, log.data)}
              </pre>
            </div>

            {/* Verbose information panel */}
            <div className="bg-blue-50 border border-blue-100 p-2 rounded text-xs text-blue-700">
              <div className="flex items-center gap-1 mb-1 font-medium">
                <Info className="h-3 w-3" />
                <span>Verbose Information</span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <div>
                  <span className="text-blue-500">Event ID:</span>{" "}
                  {`${log.source}-${log.type}-${index}`}
                </div>
                <div>
                  <span className="text-blue-500">Timestamp:</span>{" "}
                  {log.timestamp}
                </div>
                <div>
                  <span className="text-blue-500">Data Size:</span>{" "}
                  {calculateEventSize(log.data)}
                </div>
                <div>
                  <span className="text-blue-500">Source:</span>{" "}
                  {log.source}
                </div>
                {log.data.connectionDetails && (
                  <>
                    <div className="col-span-2">
                      <span className="text-blue-500">Connection URL:</span>{" "}
                      {log.data.connectionDetails.url}
                    </div>
                    <div className="col-span-2">
                      <span className="text-blue-500">Connection Time:</span>{" "}
                      {log.data.connectionDetails.timestamp}
                    </div>
                  </>
                )}
                {log.data.callDetails && (
                  <>
                    <div className="col-span-2">
                      <span className="text-blue-500">Call Time:</span>{" "}
                      {log.data.callDetails.timestamp}
                    </div>
                    <div className="col-span-2">
                      <span className="text-blue-500">Phone Number:</span>{" "}
                      {log.data.callDetails.phoneNumber}
                    </div>
                  </>
                )}
                {log.data.error && (
                  <div className="col-span-2 text-red-600">
                    <span className="font-medium">Error:</span>{" "}
                    {log.data.error}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render log entries
  const renderLogs = (logEntries: LogEntry[]) => {
    if (logEntries.length === 0) {
      return (
        <div className="flex items-center justify-center text-gray-500 h-full p-4">
          <AlertCircle className="w-4 h-4 mr-2" />
          <span>No events logged</span>
        </div>
      );
    }

    return logEntries.map((log, index) => (
      <LogItem key={index} log={log} index={index} />
    ));
  };

  return (
    <div className="flex flex-col h-full">
      <div className={`flex justify-between items-center mb-4 ${fullPage ? 'pb-2 border-b' : ''}`}>
        <h3 className={`font-semibold ${fullPage ? 'text-lg' : 'text-sm'}`}>Realtime Logs</h3>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilterMenu(!showFilterMenu)}
            className="text-xs"
          >
            <Filter className="w-3 h-3 mr-1" />
            Filter
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoScroll(!autoScroll)}
            className={`text-xs ${autoScroll ? 'bg-blue-50' : ''}`}
          >
            <Activity className="w-3 h-3 mr-1" />
            {autoScroll ? "Auto-scrolling" : "Auto-scroll"}
          </Button>
          {!fullPage && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.href = '/logs'}
              className="text-xs"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
              </svg>
              Full View
            </Button>
          )}
        </div>
      </div>

      {showFilterMenu && (
        <div className="p-2 mb-2 border rounded-md bg-slate-50">
          <div className="text-xs font-medium mb-1">Filter by Event Type:</div>
          <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
            {uniqueEventTypes.map((type) => (
              <Badge
                key={type}
                variant={typeFilters.includes(type) ? "default" : "outline"}
                className={`text-xs cursor-pointer ${typeFilters.includes(type) ? getTypeColor(type) : ""}`}
                onClick={() => {
                  setTypeFilters(prev => 
                    prev.includes(type) 
                      ? prev.filter(t => t !== type) 
                      : [...prev, type]
                  );
                }}
              >
                {type}
              </Badge>
            ))}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="mt-1 text-xs"
            onClick={() => setTypeFilters([])}
          >
            Clear Filters
          </Button>
        </div>
      )}
      
      <Tabs 
        defaultValue="all" 
        className="w-full"
        value={activeTab}
        onValueChange={setActiveTab}
      >
        <TabsList className="w-full">
          <TabsTrigger value="all" className="flex-1">
            All <Badge variant="outline" className="ml-1">{counts.all}</Badge>
          </TabsTrigger>
          <TabsTrigger value="client" className="flex-1">
            Client <Badge variant="outline" className="ml-1">{counts.client}</Badge>
          </TabsTrigger>
          <TabsTrigger value="server" className="flex-1">
            Server <Badge variant="outline" className="ml-1">{counts.server}</Badge>
          </TabsTrigger>
          <TabsTrigger value="twilio" className="flex-1">
            Twilio <Badge variant="outline" className="ml-1">{counts.twilio}</Badge>
          </TabsTrigger>
          <TabsTrigger value="errors" className="flex-1">
            Errors <Badge variant="outline" className="ml-1">{counts.errors}</Badge>
          </TabsTrigger>
          <TabsTrigger value="transactions" className="flex-1">
            Transactions <Badge variant="outline" className="ml-1">{counts.transactions}</Badge>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-2">
          <ScrollArea className="flex-1 border rounded-md h-[calc(100vh-250px)]" ref={scrollRefs.all}>
            <div className="p-4 space-y-2">
              {renderLogs(allLogs)}
            </div>
          </ScrollArea>
        </TabsContent>
        
        <TabsContent value="client" className="mt-2">
          <ScrollArea className="flex-1 border rounded-md h-[calc(100vh-250px)]" ref={scrollRefs.client}>
            <div className="p-4 space-y-2">
              {renderLogs(clientLogs)}
            </div>
          </ScrollArea>
        </TabsContent>
        
        <TabsContent value="server" className="mt-2">
          <ScrollArea className="flex-1 border rounded-md h-[calc(100vh-250px)]" ref={scrollRefs.server}>
            <div className="p-4 space-y-2">
              {renderLogs(serverLogs)}
            </div>
          </ScrollArea>
        </TabsContent>
        
        <TabsContent value="twilio" className="mt-2">
          <ScrollArea className="flex-1 border rounded-md h-[calc(100vh-250px)]" ref={scrollRefs.twilio}>
            <div className="p-4 space-y-2">
              {renderLogs(twilioLogs)}
            </div>
          </ScrollArea>
        </TabsContent>
        
        <TabsContent value="errors" className="mt-2">
          <ScrollArea className="flex-1 border rounded-md h-[calc(100vh-250px)]" ref={scrollRefs.errors}>
            <div className="p-4 space-y-2">
              {renderLogs(errorLogs)}
            </div>
          </ScrollArea>
        </TabsContent>
        
        <TabsContent value="transactions" className="mt-2">
          <ScrollArea className="flex-1 border rounded-md h-[calc(100vh-250px)]" ref={scrollRefs.transactions}>
            <div className="p-4 space-y-2">
              {renderLogs(transactionLogs)}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RealtimeLogs;
