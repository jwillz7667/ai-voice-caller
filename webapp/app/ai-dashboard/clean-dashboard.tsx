"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import {
  Phone,
  PhoneCall,
  PhoneOff,
  Mic,
  MicOff,
  CreditCard,
  Save,
  Wifi,
  WifiOff,
  AlertCircle,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/components/ui/use-toast";
import DTMFPhonePad from "@/components/dtmf-phone-pad";
import { DashboardHeader } from "@/components/dashboard-header";

// Simple configuration to send to backend
interface SessionConfig {
  voice: string;
  instructions?: string;
  temperature?: number;
  recordCall?: boolean;
  turn_detection?: {
    type: 'semantic_vad' | 'server_vad';
    // For semantic_vad
    eagerness?: 'auto' | 'low' | 'medium' | 'high';
    // For server_vad
    silence_duration_ms?: number;
    prefix_padding_ms?: number;
    threshold?: number;
    // Idle timeout (optional)
    idle_timeout_enabled?: boolean;
    idle_timeout_ms?: number;
  };
}

interface TranscriptItem {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

interface LogEntry {
  timestamp: string;
  type: string;
  message: string;
}

export default function CleanAIDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // WebSocket connection state
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [_logsWs, _setLogsWs] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Call state
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [callSid, setCallSid] = useState<string | null>(null);

  // UI state
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Call history and saved configs
  const [callHistory, setCallHistory] = useState<any[]>([]);
  const [savedConfigs, setSavedConfigs] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingConfigs, setLoadingConfigs] = useState(false);

  // Configuration state (for UI display only - backend handles actual config)
  const [config, setConfig] = useState<SessionConfig>({
    voice: 'marin',
    instructions: 'You are a helpful AI assistant in a phone call. Be conversational, friendly, and helpful.',
    temperature: 0.8,
    record_call: true,
    turn_detection: {
      type: 'semantic_vad',
      eagerness: 'auto',
      // Server VAD defaults
      silence_duration_ms: 500,
      prefix_padding_ms: 300,
      threshold: 0.5,
      idle_timeout_enabled: false,
      idle_timeout_ms: 15000
    }
  });

  // Voice options
  const voiceOptions = [
    { value: 'alloy', label: 'Alloy', description: 'Neutral, friendly' },
    { value: 'ash', label: 'Ash', description: 'Professional, clear' },
    { value: 'ballad', label: 'Ballad', description: 'Warm, storytelling' },
    { value: 'coral', label: 'Coral', description: 'Bright, engaging' },
    { value: 'echo', label: 'Echo', description: 'Deep, resonant' },
    { value: 'sage', label: 'Sage', description: 'Wise, calming' },
    { value: 'shimmer', label: 'Shimmer', description: 'Light, upbeat' },
    { value: 'verse', label: 'Verse', description: 'Poetic, expressive' },
    { value: 'marin', label: 'Marin (NEW)', description: 'Natural, conversational' },
    { value: 'cedar', label: 'Cedar (NEW)', description: 'Authoritative, clear' }
  ];

  // Refs for auto-scroll
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);


  // Authentication check
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Connect to WebSocket for monitoring (optional - not required for making calls)
  useEffect(() => {
    if (!user) return;

    const wsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:8081';
    const logsWsUrl = `${wsUrl}/logs`;

    try {
      // Connect to logs WebSocket for monitoring calls
      const logsWebsocket = new WebSocket(logsWsUrl);

      logsWebsocket.onopen = () => {
        setIsConnected(true);
        addLog('info', 'Connected to monitoring server');
      };

      logsWebsocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          // Handle both regular logs and call events
          if (data.type === 'log') {
            addLog(data.level || 'info', data.message);
          } else {
            handleWebSocketMessage(data);
          }
        } catch (_error) {
          // Handle binary or non-JSON messages
          console.log('Received non-JSON message:', event.data);
        }
      };

      logsWebsocket.onerror = (_error) => {
        console.error('WebSocket error:', _error);
        addLog('warning', 'Monitoring connection error - calls will still work');
        // Don't set isConnected to false on error - calls can still work via API
      };

      logsWebsocket.onclose = () => {
        setIsConnected(false);
        // Don't set isCallActive to false - let the call API handle that
        addLog('info', 'Monitoring disconnected');
      };

      setWs(logsWebsocket);
      _setLogsWs(logsWebsocket);

      return () => {
        logsWebsocket.close();
      };
    } catch (_error) {
      console.error('Failed to connect to monitoring WebSocket:', _error);
      addLog('info', 'Monitoring unavailable - calls will still work');
    }
  }, [user]);

  // Handle messages from backend
  const handleWebSocketMessage = (data: any) => {
    switch (data.type) {
      case 'session.created':
      case 'session.updated':
        addLog('info', 'Session updated');
        break;

      case 'conversation.item.created':
        if (data.item?.content?.[0]?.transcript) {
          addTranscriptItem({
            id: data.item.id || Date.now().toString(),
            role: data.item.role || 'assistant',
            content: data.item.content[0].transcript,
            timestamp: new Date().toISOString()
          });
        }
        break;

      case 'response.audio_transcript.delta':
        if (data.delta) {
          // Update last transcript item or create new one
          setTranscript(prev => {
            const last = prev[prev.length - 1];
            if (last && last.role === 'assistant') {
              return [
                ...prev.slice(0, -1),
                { ...last, content: last.content + data.delta }
              ];
            }
            return prev;
          });
        }
        break;

      case 'response.audio_transcript.done':
        if (data.transcript) {
          addTranscriptItem({
            id: Date.now().toString(),
            role: 'assistant',
            content: data.transcript,
            timestamp: new Date().toISOString()
          });
        }
        break;

      case 'input_audio_buffer.speech_started':
        addLog('info', 'User started speaking');
        break;

      case 'input_audio_buffer.speech_stopped':
        addLog('info', 'User stopped speaking');
        break;

      case 'call.connected':
        setIsCallActive(true);
        setCallSid(data.callSid);
        addLog('success', `Call connected: ${data.call_sid}`);
        break;

      case 'call.disconnected':
        setIsCallActive(false);
        setCallSid(null);
        setCallDuration(0);
        addLog('info', 'Call disconnected');
        break;

      case 'error':
        addLog('error', data.error?.message || 'An error occurred');
        break;

      default:
        // Log any other message types for debugging
        if (data.type) {
          console.log('Received message:', data.type, data);
        }
    }
  };

  // Add transcript item
  const addTranscriptItem = (item: TranscriptItem) => {
    setTranscript(prev => [...prev, item]);
    setTimeout(() => {
      transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Add log entry
  const addLog = (type: string, message: string) => {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      type,
      message
    };
    setLogs(prev => [...prev.slice(-99), entry]);
    setTimeout(() => {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Fetch call history
  const fetchCallHistory = async () => {
    setLoadingHistory(true);
    try {
      const response = await fetch('/api/call-history');
      if (response.ok) {
        const data = await response.json();
        setCallHistory(data.callLogs || []);
      } else {
        console.error('Failed to fetch call history');
      }
    } catch (_error) {
      console.error('Error fetching call history:', _error);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Fetch saved configurations
  const fetchSavedConfigs = async () => {
    setLoadingConfigs(true);
    try {
      const response = await fetch('/api/saved-configs');
      if (response.ok) {
        const configs = await response.json();
        setSavedConfigs(configs || []);
      } else {
        console.error('Failed to fetch saved configs');
      }
    } catch (_error) {
      console.error('Error fetching saved configs:', _error);
    } finally {
      setLoadingConfigs(false);
    }
  };

  // Load saved config
  const loadSavedConfig = async (configId: string) => {
    try {
      const savedConfig = savedConfigs.find(c => c.id === configId);
      if (savedConfig) {
        setConfig(savedConfig.configuration);
        toast({
          title: "Configuration Loaded",
          description: `Loaded "${savedConfig.name}" configuration`
        });
        // Update last used
        await fetch(`/api/saved-configs/${configId}/use`, { method: 'POST' });
      }
    } catch (_error) {
      console.error('Error loading config:', _error);
      toast({
        title: "Error",
        description: "Failed to load configuration",
        variant: "destructive"
      });
    }
  };

  // Save current configuration
  const saveCurrentConfig = async (name: string, description?: string) => {
    try {
      const response = await fetch('/api/saved-configs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, configuration: config })
      });
      if (response.ok) {
        toast({
          title: "Configuration Saved",
          description: `Saved as "${name}"`
        });
        fetchSavedConfigs(); // Refresh list
      } else {
        throw new Error('Failed to save');
      }
    } catch (_error) {
      console.error('Error saving config:', _error);
      toast({
        title: "Error",
        description: "Failed to save configuration",
        variant: "destructive"
      });
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    if (user) {
      fetchCallHistory();
      fetchSavedConfigs();
    }
  }, [user]);


  // Format phone number for calling (adds +1 if needed)
  const formatPhoneForCalling = (phone: string) => {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    // Add +1 if it's 10 digits
    if (cleaned.length === 10) {
      return '+1' + cleaned;
    }
    // If it already has country code
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return '+' + cleaned;
    }
    // Return with + if it starts with other country code
    if (cleaned.length > 10) {
      return '+' + cleaned;
    }
    return cleaned;
  };

  // Handle phone input change
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow digits
    const digitsOnly = value.replace(/\D/g, '');
    // Limit to 10 digits for US numbers
    const limited = digitsOnly.slice(0, 10);
    setPhoneNumber(limited);
  };

  // Start call using backend API
  const handleStartCall = async () => {
    if (!phoneNumber || phoneNumber.length !== 10) {
      toast({
        title: 'Error',
        description: 'Please enter a 10-digit phone number',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      // Format phone number with +1
      const formattedPhone = formatPhoneForCalling(phoneNumber);

      // Send configuration to backend via WebSocket if connected (optional)
      if (ws && ws.readyState === WebSocket.OPEN) {
        const turn_detection: any = {
          type: config.turn_detection?.type || 'semantic_vad',
          create_response: true
        };

        // Add appropriate parameters based on VAD type
        if (config.turn_detection?.type === 'semantic_vad') {
          turnDetection.eagerness = config.turn_detection?.eagerness || 'auto';
        } else if (config.turn_detection?.type === 'server_vad') {
          turnDetection.silence_duration_ms = config.turn_detection?.silence_duration_ms || 500;
          turnDetection.prefix_padding_ms = config.turn_detection?.prefix_padding_ms || 300;
          turnDetection.threshold = config.turn_detection?.threshold || 0.5;

          // Add idle timeout if enabled
          if (config.turn_detection?.idle_timeout_enabled) {
            turnDetection.idle_timeout_ms = config.turn_detection?.idle_timeout_ms || 15000;
          }
        }

        ws.send(JSON.stringify({
          type: 'session.update',
          session: {
            voice: config.voice,
            instructions: config.instructions,
            turn_detection: turnDetection,
            temperature: config.temperature,
            modalities: ['text', 'audio'],
            input_audio_transcription: {
              model: 'whisper-1'
            },
            record_call: config.record_call // Include recording preference
          }
        }));
      }

      // Make call via backend API
      const response = await fetch('/api/twilio/make-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: formattedPhone,  // Fixed: using camelCase to match API expectation
          record_call: config.record_call
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to start call');
      }

      setCallSid(data.callSid);
      setIsCallActive(true);
      addLog('success', `Call initiated: ${data.call_sid}`);

    } catch (error) {
      console.error('Error starting call:', error);
      addLog('error', (error as Error).message);
      toast({
        title: 'Failed to start call',
        description: (error as Error).message,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // End call using backend API
  const handleEndCall = async () => {
    if (!callSid) return;

    try {
      const response = await fetch('/api/twilio/end-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ call_sid })
      });

      if (response.ok) {
        setIsCallActive(false);
        setCallSid(null);
        setCallDuration(0);
        addLog('info', 'Call ended');
      }
    } catch (error) {
      console.error('Error ending call:', error);
      addLog('error', (error as Error).message);
    }
  };

  // Toggle mute
  const handleToggleMute = () => {
    if (ws && ws.readyState === WebSocket.OPEN && isCallActive) {
      setIsMuted(!isMuted);
      // Send mute command to backend
      ws.send(JSON.stringify({
        type: 'input_audio_buffer.clear'
      }));
      addLog('info', `Microphone ${!isMuted ? 'muted' : 'unmuted'}`);
    }
  };

  // Handle DTMF
  const handleDTMF = (digit: string) => {
    if (ws && ws.readyState === WebSocket.OPEN && isCallActive) {
      // The backend handles DTMF, just send the digit
      ws.send(JSON.stringify({
        type: 'dtmf',
        digit
      }));
      addLog('info', `DTMF sent: ${digit}`);
    }
  };

  // Call duration timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isCallActive) {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isCallActive]);

  // Format duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Save configuration to backend
  const saveConfiguration = async () => {
    try {
      const response = await fetch('/api/session-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config,
          name: 'Dashboard Configuration'
        })
      });

      if (response.ok) {
        toast({
          title: 'Configuration Saved',
          description: 'Your settings have been saved'
        });
      }
    } catch (_error) {
      toast({
        title: 'Save Failed',
        description: 'Failed to save configuration',
        variant: 'destructive'
      });
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      {/* Header with Sign Out */}
      <DashboardHeader />

      {/* Original Header Content */}
      <header className="sticky top-0 z-40 border-b bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
                  <Phone className="w-6 h-6 text-white" />
                </div>
                {isConnected && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Verbio AI</h1>
                <p className="text-xs text-muted-foreground">Voice Intelligence Platform</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/recordings')}
              >
                <Mic className="w-4 h-4 mr-1" />
                All Recordings
              </Button>
            </div>

            <div className="flex items-center space-x-4">
              <Badge variant={isConnected ? "default" : "secondary"}>
                {isConnected ? <Wifi className="h-4 w-4 mr-2" /> : <WifiOff className="h-4 w-4 mr-2" />}
                {isConnected ? 'Connected' : 'Offline'}
              </Badge>

              <div className="flex items-center space-x-3 pl-4 border-l">
                <div className="text-right">
                  <p className="text-sm font-semibold">{user.name || "User"}</p>
                  <p className="text-xs text-muted-foreground flex items-center justify-end">
                    <CreditCard className="w-3 h-3 mr-1" />
                    {user.credits} credits
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg">
                  {user.name?.charAt(0) || user.email?.charAt(0)?.toUpperCase() || "U"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Call Control */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle>Call Control</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Phone Number</Label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">+1</div>
                    <Input
                      type="tel"
                      placeholder="(555) 123-4567"
                      value={phoneNumber}
                      onChange={handlePhoneChange}
                      disabled={isCallActive}
                      className="pl-10"
                      maxLength={10}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Enter 10-digit US phone number</p>
                </div>

                {isCallActive && (
                  <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-green-700 dark:text-green-400">Active Call</span>
                      <span className="font-mono text-green-700 dark:text-green-400">{formatDuration(callDuration)}</span>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  {!isCallActive ? (
                    <Button
                      onClick={handleStartCall}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600"
                      disabled={phoneNumber.length !== 10 || isLoading}
                    >
                      {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <PhoneCall className="h-4 w-4 mr-2" />}
                      Start Call
                    </Button>
                  ) : (
                    <>
                      <Button
                        onClick={handleToggleMute}
                        variant={isMuted ? "destructive" : "secondary"}
                        className="flex-1"
                      >
                        {isMuted ? <MicOff className="h-4 w-4 mr-2" /> : <Mic className="h-4 w-4 mr-2" />}
                        {isMuted ? 'Unmute' : 'Mute'}
                      </Button>
                      <Button
                        onClick={handleEndCall}
                        variant="destructive"
                        className="flex-1"
                      >
                        <PhoneOff className="h-4 w-4 mr-2" />
                        End
                      </Button>
                    </>
                  )}
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <Button onClick={saveConfiguration} variant="outline" size="sm" className="flex-1">
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* DTMF Pad */}
            <DTMFPhonePad
              onDigitPress={handleDTMF}
              isCallActive={isCallActive}
              ws={ws}
            />
          </div>

          {/* Configuration & Transcript */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle>AI Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="voice">
                  <TabsList className="grid grid-cols-3 w-full">
                    <TabsTrigger value="voice">Voice</TabsTrigger>
                    <TabsTrigger value="behavior">Behavior</TabsTrigger>
                    <TabsTrigger value="recording">Recording</TabsTrigger>
                  </TabsList>

                  <TabsContent value="voice" className="space-y-4 mt-4">
                    <div>
                      <Label>AI Voice</Label>
                      <Select value={config.voice} onValueChange={(v) => setConfig({...config, voice: v})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {voiceOptions.map(voice => (
                            <SelectItem key={voice.value} value={voice.value}>
                              <div>
                                <div>{voice.label}</div>
                                <div className="text-xs text-muted-foreground">{voice.description}</div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Instructions</Label>
                      <Textarea
                        value={config.instructions}
                        onChange={(e) => setConfig({...config, instructions: e.target.value})}
                        rows={3}
                        placeholder="Instructions for the AI assistant..."
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="behavior" className="space-y-4 mt-4">
                    {/* VAD Type Selection */}
                    <div>
                      <Label>VAD Type</Label>
                      <Select
                        value={config.turn_detection?.type || 'semantic_vad'}
                        onValueChange={(v: 'semantic_vad' | 'server_vad') => setConfig({
                          ...config,
                          turn_detection: {...config.turn_detection, type: v}
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="semantic_vad">Semantic VAD</SelectItem>
                          <SelectItem value="server_vad">Server VAD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Semantic VAD Settings */}
                    {config.turn_detection?.type === 'semantic_vad' && (
                      <div>
                        <Label>Eagerness</Label>
                        <Select
                          value={config.turn_detection?.eagerness || 'auto'}
                          onValueChange={(v: 'auto' | 'low' | 'medium' | 'high') => setConfig({
                            ...config,
                            turn_detection: {...config.turn_detection!, type: config.turn_detection?.type || 'semantic_vad', eagerness: v}
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="auto">Auto</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground mt-1">
                          How eager the AI is to respond during conversation
                        </p>
                      </div>
                    )}

                    {/* Server VAD Settings */}
                    {config.turn_detection?.type === 'server_vad' && (
                      <>
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <Label>Silence Duration</Label>
                            <span className="text-sm text-muted-foreground">{config.turn_detection?.silence_duration_ms || 500}ms</span>
                          </div>
                          <Slider
                            value={[config.turn_detection?.silence_duration_ms || 500]}
                            onValueChange={([v]) => setConfig({
                              ...config,
                              turn_detection: {...config.turn_detection!, type: config.turn_detection?.type || 'server_vad', silence_duration_ms: v}
                            })}
                            min={0}
                            max={2000}
                            step={50}
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <Label>Prefix Padding</Label>
                            <span className="text-sm text-muted-foreground">{config.turn_detection?.prefix_padding_ms || 300}ms</span>
                          </div>
                          <Slider
                            value={[config.turn_detection?.prefix_padding_ms || 300]}
                            onValueChange={([v]) => setConfig({
                              ...config,
                              turn_detection: {...config.turn_detection!, type: config.turn_detection?.type || 'server_vad', prefix_padding_ms: v}
                            })}
                            min={0}
                            max={2000}
                            step={50}
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <Label>Threshold</Label>
                            <span className="text-sm text-muted-foreground">{(config.turn_detection?.threshold || 0.5).toFixed(2)}</span>
                          </div>
                          <Slider
                            value={[config.turn_detection?.threshold || 0.5]}
                            onValueChange={([v]) => setConfig({
                              ...config,
                              turn_detection: {...config.turn_detection!, type: config.turn_detection?.type || 'server_vad', threshold: v}
                            })}
                            min={0}
                            max={1}
                            step={0.01}
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <Label>Idle Timeout</Label>
                            <Switch
                              checked={config.turn_detection?.idle_timeout_enabled || false}
                              onCheckedChange={(checked) => setConfig({
                                ...config,
                                turn_detection: {...config.turn_detection!, type: config.turn_detection?.type || 'server_vad', idle_timeout_enabled: checked}
                              })}
                            />
                          </div>
                          {config.turn_detection?.idle_timeout_enabled && (
                            <div className="mt-2">
                              <div className="flex items-center justify-between mb-2">
                                <Label className="text-sm">Timeout Duration</Label>
                                <span className="text-sm text-muted-foreground">{config.turn_detection?.idle_timeout_ms || 15000}ms</span>
                              </div>
                              <Slider
                                value={[config.turn_detection?.idle_timeout_ms || 15000]}
                                onValueChange={([v]) => setConfig({
                                  ...config,
                                  turn_detection: {...config.turn_detection!, type: config.turn_detection?.type || 'server_vad', idle_timeout_ms: v}
                                })}
                                min={5000}
                                max={30000}
                                step={1000}
                              />
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label>Temperature</Label>
                        <span className="text-sm text-muted-foreground">{(config.temperature || 0.8).toFixed(1)}</span>
                      </div>
                      <Slider
                        value={[config.temperature || 0.8]}
                        onValueChange={([v]) => setConfig({...config, temperature: v})}
                        min={0}
                        max={1}
                        step={0.1}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Response creativity (0 = focused, 1 = creative)
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="recording" className="space-y-4 mt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Enable Recording</Label>
                        <p className="text-xs text-muted-foreground">Record calls for quality and training</p>
                      </div>
                      <Switch
                        checked={config.record_call}
                        onCheckedChange={(checked) => setConfig({...config, record_call: checked})}
                      />
                    </div>

                    <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                        <p className="text-sm text-amber-700 dark:text-amber-300">
                          Ensure compliance with local regulations and inform participants when recording.
                        </p>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Transcript */}
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle>Live Transcript</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px] w-full rounded-lg border p-4">
                  {transcript.length === 0 ? (
                    <div className="text-center text-muted-foreground">
                      No transcript yet. Start a call to see the conversation.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {transcript.map((item) => (
                        <div key={item.id} className={`flex ${item.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] rounded-lg p-3 ${
                            item.role === 'user'
                              ? 'bg-blue-100 dark:bg-blue-900/30'
                              : 'bg-gray-100 dark:bg-gray-800'
                          }`}>
                            <p className="text-sm">{item.content}</p>
                            <p className="text-xs opacity-70 mt-1">
                              {new Date(item.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div ref={transcriptEndRef} />
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Status & Logs */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="border-0 shadow-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white">
              <CardHeader>
                <CardTitle className="text-white">AI Engine</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/10">
                  <span className="text-sm">Model</span>
                  <span className="text-sm">GPT-REALTIME</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/10">
                  <span className="text-sm">Voice</span>
                  <span className="text-sm capitalize">{config.voice}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/10">
                  <span className="text-sm">VAD Type</span>
                  <span className="text-sm capitalize">{config.turn_detection?.type === 'server_vad' ? 'Server' : 'Semantic'}</span>
                </div>
                {config.turn_detection?.type === 'semantic_vad' && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/10">
                    <span className="text-sm">Eagerness</span>
                    <span className="text-sm capitalize">{config.turn_detection?.eagerness || 'auto'}</span>
                  </div>
                )}
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/10">
                  <span className="text-sm">Recording</span>
                  <Badge className={config.record_call ? "bg-green-500/20" : "bg-gray-500/20"}>
                    {config.record_call ? 'On' : 'Off'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle>System Logs</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px] w-full rounded-lg border p-3">
                  {logs.length === 0 ? (
                    <div className="text-center text-muted-foreground text-sm">
                      No logs yet.
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {logs.map((log, i) => (
                        <div key={i} className="text-xs font-mono">
                          <span className="text-muted-foreground">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                          {' '}
                          <span className={
                            log.type === 'error' ? 'text-red-600' :
                            log.type === 'success' ? 'text-green-600' :
                            'text-blue-600'
                          }>
                            [{log.type}]
                          </span>
                          {' '}
                          {log.message}
                        </div>
                      ))}
                      <div ref={logsEndRef} />
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Call History and Saved Configs Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          {/* Call History */}
          <Card className="border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Recent Calls</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={fetchCallHistory}
                  disabled={loadingHistory}
                >
                  {loadingHistory ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
                </Button>
              </CardTitle>
              <CardDescription>View your call history and recordings</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] w-full">
                {loadingHistory ? (
                  <div className="flex justify-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : callHistory.length === 0 ? (
                  <div className="text-center text-muted-foreground p-4">
                    No call history yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {callHistory.map((call) => (
                      <div key={call.id} className="border rounded-lg p-3 hover:bg-muted/50 transition-colors">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant={call.direction === 'OUTBOUND' ? 'default' : 'secondary'}>
                              {call.direction === 'OUTBOUND' ? <PhoneCall className="w-3 h-3 mr-1" /> : <Phone className="w-3 h-3 mr-1" />}
                              {call.direction}
                            </Badge>
                            <Badge variant={
                              call.status === 'COMPLETED' ? 'default' :
                              call.status === 'FAILED' ? 'destructive' :
                              'outline'
                            }>
                              {call.status}
                            </Badge>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(call.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <div className="text-sm">
                            <span className="font-medium">{call.phone_number}</span>
                            {call.duration > 0 && (
                              <span className="text-muted-foreground ml-2">
                                ({formatDuration(call.duration)})
                              </span>
                            )}
                          </div>
                          {call.recording && (
                            <div className="flex items-center gap-2 mt-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(call.recording.recording_url, '_blank')}
                              >
                                <Mic className="w-3 h-3 mr-1" />
                                Play Recording
                              </Button>
                              {call.transcript && (
                                <Badge variant="outline">Transcript Available</Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Saved Configurations */}
          <Card className="border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Saved Configurations</span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const name = prompt('Configuration name:');
                      if (name) {
                        const desc = prompt('Description (optional):');
                        saveCurrentConfig(name, desc || undefined);
                      }
                    }}
                  >
                    <Save className="h-4 w-4 mr-1" />
                    Save Current
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={fetchSavedConfigs}
                    disabled={loadingConfigs}
                  >
                    {loadingConfigs ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
                  </Button>
                </div>
              </CardTitle>
              <CardDescription>Load and manage your saved AI configurations</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] w-full">
                {loadingConfigs ? (
                  <div className="flex justify-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : savedConfigs.length === 0 ? (
                  <div className="text-center text-muted-foreground p-4">
                    No saved configurations yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {savedConfigs.map((config) => (
                      <div key={config.id} className="border rounded-lg p-3 hover:bg-muted/50 transition-colors">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold">{config.name}</h4>
                            {config.description && (
                              <p className="text-sm text-muted-foreground">{config.description}</p>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => loadSavedConfig(config.id)}
                            >
                              Load
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={async () => {
                                if (confirm(`Delete "${config.name}"?`)) {
                                  try {
                                    await fetch(`/api/saved-configs?id=${config.id}`, { method: 'DELETE' });
                                    fetchSavedConfigs();
                                    toast({
                                      title: "Configuration Deleted",
                                      description: `Deleted "${config.name}"`
                                    });
                                  } catch (_error) {
                                    toast({
                                      title: "Error",
                                      description: "Failed to delete configuration",
                                      variant: "destructive"
                                    });
                                  }
                                }
                              }}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <div>Voice: {config.configuration?.voice || 'default'}</div>
                          {config.configuration?.turn_detection && (
                            <div>VAD: {config.configuration.turn_detection.type}</div>
                          )}
                          {config.lastUsedAt && (
                            <div>Last used: {new Date(config.lastUsedAt).toLocaleDateString()}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}