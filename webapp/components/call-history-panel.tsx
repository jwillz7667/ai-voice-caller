"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  Phone, 
  Clock, 
  Calendar, 
  Play, 
  Settings2, 
  PhoneIncoming,
  PhoneOutgoing,
  Loader2
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface CallHistoryItem {
  id: string;
  callSid?: string;
  phoneNumber: string;
  direction: string;
  duration: number;
  status: string;
  configuration?: any;
  startedAt?: string;
  createdAt: string;
  recording?: {
    id: string;
    recordingUrl: string;
    duration: number;
  };
}

interface CallHistoryPanelProps {
  onLoadConfiguration?: (config: any) => void;
}

const CallHistoryPanel: React.FC<CallHistoryPanelProps> = ({ onLoadConfiguration }) => {
  const [callHistory, setCallHistory] = useState<CallHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCall, setSelectedCall] = useState<string | null>(null);

  useEffect(() => {
    fetchCallHistory();
  }, []);

  const fetchCallHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/call-history");
      if (response.ok) {
        const data = await response.json();
        setCallHistory(data.callLogs || []);
      }
    } catch (error) {
      console.error("Error fetching call history:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-500';
      case 'in_progress':
      case 'ringing':
        return 'bg-blue-500';
      case 'failed':
      case 'no_answer':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Phone className="h-4 w-4" />
          Call History
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : callHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <Phone className="h-12 w-12 text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">No call history yet</p>
            <p className="text-xs text-gray-400 mt-1">Your call history will appear here</p>
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div className="p-3 space-y-2">
              {callHistory.map((call) => (
                <div
                  key={call.id}
                  className={`p-3 rounded-lg border transition-all cursor-pointer hover:shadow-md ${
                    selectedCall === call.id 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedCall(call.id === selectedCall ? null : call.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2">
                      {call.direction === 'outbound' ? (
                        <PhoneOutgoing className="h-4 w-4 text-green-500 mt-1" />
                      ) : (
                        <PhoneIncoming className="h-4 w-4 text-blue-500 mt-1" />
                      )}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{call.phoneNumber}</span>
                          <Badge 
                            variant="secondary" 
                            className={`text-xs px-1.5 py-0 ${getStatusColor(call.status)} text-white`}
                          >
                            {call.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDuration(call.duration)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {call.startedAt 
                              ? formatDistanceToNow(new Date(call.startedAt), { addSuffix: true })
                              : formatDistanceToNow(new Date(call.createdAt), { addSuffix: true })
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                    {call.recording && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(call.recording.recordingUrl, '_blank');
                        }}
                      >
                        <Play className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  
                  {selectedCall === call.id && call.configuration && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Configuration used:</span>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onLoadConfiguration && call.configuration) {
                              onLoadConfiguration(call.configuration);
                            }
                          }}
                        >
                          <Settings2 className="h-3 w-3 mr-1" />
                          Load Config
                        </Button>
                      </div>
                      <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs">
                        <div className="space-y-1">
                          {call.configuration.voice && (
                            <div>
                              <span className="text-gray-500">Voice:</span> {call.configuration.voice}
                            </div>
                          )}
                          {call.configuration.model && (
                            <div>
                              <span className="text-gray-500">Model:</span> {call.configuration.model}
                            </div>
                          )}
                          {call.configuration.instructions && (
                            <div className="line-clamp-2">
                              <span className="text-gray-500">Instructions:</span> {call.configuration.instructions}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default CallHistoryPanel;