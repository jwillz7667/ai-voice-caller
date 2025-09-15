'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import DTMFPhonePad from '@/components/dtmf-phone-pad';
import {
  Phone, Settings, MessageSquare, Activity,
  CreditCard, Mic, MicOff, PhoneOff, PhoneCall,
  Code, Wifi, WifiOff, X, Save, Copy, Download,
  Brain, Zap, Volume2, Languages, Shield, Clock
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

// Enhanced interfaces for latest Realtime API
interface SessionConfig {
  model: string;
  type: 'realtime' | 'transcription';
  instructions: string;
  voice: string;
  input_audio_format: string;
  output_audio_format: string;
  input_audio_transcription: {
    model: string;
    prompt: string;
    language: string;
  };
  turn_detection: {
    type: 'server_vad' | 'semantic_vad' | 'none';
    threshold?: number;
    prefix_padding_ms?: number;
    silence_duration_ms?: number;
    interrupt_response?: boolean;
    create_response?: boolean;
  };
  tools: any[];
  tool_choice: 'auto' | 'none' | 'required';
  temperature: number;
  max_output_tokens: number;
  modalities: string[];
  audio: {
    input: {
      format: {
        type: string;
        rate: number;
      };
      turn_detection: {
        type: string;
      };
    };
    output: {
      format: {
        type: string;
      };
      voice: string;
    };
  };
  input_audio_noise_reduction: {
    type: 'near_field' | 'far_field' | null;
  };
  prompt?: {
    id?: string;
    version?: string;
    variables?: Record<string, string>;
  };
}

interface TranscriptItem {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  type?: string;
}

interface LogEntry {
  timestamp: string;
  type: string;
  source: 'client' | 'server' | 'twilio' | 'openai';
  message: string;
  data?: any;
}

export default function AIDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // WebSocket and call state
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [callSid, setCallSid] = useState<string | null>(null);

  // Transcript and logs
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  // Enhanced session configuration with latest Realtime API features
  const [sessionConfig, setSessionConfig] = useState<SessionConfig>({
    model: 'gpt-realtime',
    type: 'realtime',
    instructions: `You are a helpful AI assistant in a phone call. Be conversational, friendly, and helpful.
Keep responses concise and natural. You have access to various tools to help the caller.`,
    voice: 'marin',
    input_audio_format: 'pcm16',
    output_audio_format: 'pcm16',
    input_audio_transcription: {
      model: 'gpt-4o-transcribe',
      prompt: '',
      language: 'en'
    },
    turn_detection: {
      type: 'semantic_vad',
      threshold: 0.5,
      prefix_padding_ms: 300,
      silence_duration_ms: 500,
      interrupt_response: true,
      create_response: true
    },
    tools: [
      {
        type: "function",
        name: "transfer_call",
        description: "Transfer the call to another number"
      },
      {
        type: "function",
        name: "dial_extension",
        description: "Dial an extension or navigate IVR"
      }
    ],
    tool_choice: 'auto',
    temperature: 0.8,
    max_output_tokens: 4096,
    modalities: ['audio', 'text'],
    audio: {
      input: {
        format: {
          type: 'audio/pcm',
          rate: 24000
        },
        turn_detection: {
          type: 'semantic_vad'
        }
      },
      output: {
        format: {
          type: 'audio/pcm'
        },
        voice: 'marin'
      }
    },
    input_audio_noise_reduction: {
      type: 'near_field'
    }
  });

  // Refs for auto-scroll
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // All available voice options (latest 2025 updates)
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

  // Authentication check and load configuration
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (user) {
      // Auto-load user's saved configuration
      loadConfiguration();
    }
  }, [user, loading, router]);

  // WebSocket connection
  useEffect(() => {
    if (!user) return;

    const wsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || (process.env.NODE_ENV === 'production' ? 'wss://ai-voice-caller-public-vfjab4lzxq-uc.a.run.app' : 'ws://localhost:8081');
    const websocket = new WebSocket(wsUrl);

    websocket.onopen = () => {
      setIsConnected(true);
      addLog('info', 'client', 'Connected to WebSocket server');

      // Send initial configuration
      websocket.send(JSON.stringify({
        type: 'session.update',
        session: sessionConfig
      }));
    };

    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
      addLog('error', 'client', 'WebSocket error occurred');
    };

    websocket.onclose = () => {
      setIsConnected(false);
      setIsCallActive(false);
      addLog('info', 'client', 'Disconnected from WebSocket server');
    };

    setWs(websocket);

    return () => {
      websocket.close();
    };
  }, [user]);

  // Handle WebSocket messages
  const handleWebSocketMessage = (data: any) => {
    switch (data.type) {
      case 'transcript':
        addTranscriptItem({
          id: Date.now().toString(),
          role: data.role || 'assistant',
          content: data.text,
          timestamp: new Date().toISOString()
        });
        break;

      case 'call.connected':
        setIsCallActive(true);
        setCallSid(data.callSid);
        addLog('info', 'server', `Call connected: ${data.callSid}`);
        break;

      case 'call.disconnected':
        setIsCallActive(false);
        setCallSid(null);
        setCallDuration(0);
        addLog('info', 'server', 'Call disconnected');
        break;

      case 'dtmf_sent':
        addLog('info', 'client', `DTMF sent: ${data.digit || data.digits}`);
        break;

      case 'dtmf_received':
        addLog('info', 'twilio', `DTMF received: ${data.digit}`);
        break;

      case 'error':
        addLog('error', 'server', data.message);
        toast({
          title: 'Error',
          description: data.message,
          variant: 'destructive'
        });
        break;

      default:
        if (data.type) {
          addLog('debug', 'server', `Event: ${data.type}`, data);
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
  const addLog = (type: string, source: LogEntry['source'], message: string, data?: any) => {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      type,
      source,
      message,
      data
    };
    setLogs(prev => [...prev.slice(-99), entry]);
    setTimeout(() => {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Start call
  const handleStartCall = async () => {
    if (!phoneNumber) {
      toast({
        title: 'Error',
        description: 'Please enter a phone number',
        variant: 'destructive'
      });
      return;
    }

    if (!ws || !isConnected) {
      toast({
        title: 'Connection Error',
        description: 'WebSocket not connected. Please refresh the page.',
        variant: 'destructive'
      });
      return;
    }

    try {
      addLog('info', 'client', `Starting call to ${phoneNumber}`);

      // Send configuration update
      ws.send(JSON.stringify({
        type: 'session.update',
        session: sessionConfig
      }));

      // Make the call via API
      const response = await fetch('/api/twilio/make-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber,
          config: sessionConfig
        })
      });

      const data = await response.json();
      if (data.success) {
        setCallSid(data.callSid);
        addLog('info', 'client', `Call initiated: ${data.callSid}`);
      } else {
        throw new Error(data.error || 'Failed to start call');
      }
    } catch (error: any) {
      console.error('Error starting call:', error);
      addLog('error', 'client', error.message);
      toast({
        title: 'Failed to start call',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  // End call
  const handleEndCall = async () => {
    if (!callSid) return;

    try {
      addLog('info', 'client', 'Ending call...');

      const response = await fetch('/api/twilio/end-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callSid })
      });

      const data = await response.json();
      if (data.success) {
        setIsCallActive(false);
        setCallSid(null);
        setCallDuration(0);
        addLog('info', 'client', 'Call ended successfully');
      }
    } catch (error: any) {
      console.error('Error ending call:', error);
      addLog('error', 'client', error.message);
    }
  };

  // Toggle mute
  const handleToggleMute = () => {
    if (ws && isCallActive) {
      setIsMuted(!isMuted);
      ws.send(JSON.stringify({
        type: 'input_audio_buffer.mute',
        muted: !isMuted
      }));
      addLog('info', 'client', `Microphone ${!isMuted ? 'muted' : 'unmuted'}`);
    }
  };

  // Handle DTMF
  const handleDTMF = (digit: string, options?: any) => {
    if (ws && isCallActive) {
      ws.send(JSON.stringify({
        type: 'dtmf',
        digit,
        ...options
      }));
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

  // Save configuration to database
  const saveConfiguration = async () => {
    try {
      if (!user) {
        toast({
          title: 'Authentication Required',
          description: 'Please log in to save configuration',
          variant: 'destructive'
        });
        return;
      }

      const configToSave = {
        ...sessionConfig,
        sessionId: callSid || `dashboard-${Date.now()}`,
        saveAsDefault: true,
        name: 'AI Dashboard Configuration'
      };

      const response = await fetch('/api/session-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(configToSave)
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: 'Configuration Saved',
          description: 'Your settings have been saved successfully'
        });
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save configuration');
      }
    } catch (error: any) {
      console.error('Error saving configuration:', error);
      toast({
        title: 'Save Failed',
        description: error.message || 'Failed to save configuration',
        variant: 'destructive'
      });
    }
  };

  // Load configuration from database
  const loadConfiguration = async () => {
    try {
      if (!user) {
        // Silently skip loading if not authenticated
        return;
      }

      const response = await fetch('/api/session-config');
      if (response.ok) {
        const data = await response.json();
        if (data.config) {
          setSessionConfig(data.config);
          toast({
            title: 'Configuration Loaded',
            description: 'Your saved settings have been loaded'
          });
        }
      } else if (response.status === 404) {
        // No saved configuration - this is normal for new users
        console.log('No saved configuration found - using defaults');
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to load configuration');
      }
    } catch (error: any) {
      console.error('Error loading configuration:', error);
      toast({
        title: 'Load Failed',
        description: error.message || 'Failed to load configuration',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="stack-spacing">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-headline text-gradient">AI Voice Dashboard</h1>
          <p className="text-body text-slate-600 mt-2">
            Advanced OpenAI Realtime API Configuration (Sept 2025)
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="px-3 py-1">
            <CreditCard className="h-4 w-4 mr-2" />
            {user.credits || 0} Credits
          </Badge>
          <Badge variant={isConnected ? "default" : "secondary"}>
            {isConnected ? <Wifi className="h-4 w-4 mr-2" /> : <WifiOff className="h-4 w-4 mr-2" />}
            {isConnected ? 'Connected' : 'Offline'}
          </Badge>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 lg:gap-8">
        {/* Left Column - Call Control */}
        <div className="xl:col-span-1 stack-spacing">
          {/* Call Control Card */}
          <Card className="interactive-hover glass-card border-slate-200/50">
            <CardHeader className="bg-gradient-to-r from-blue-50/50 to-purple-50/50 rounded-t-2xl">
              <CardTitle className="flex items-center gap-2 text-title">
                <Phone className="h-5 w-5 text-blue-600" />
                Call Control
              </CardTitle>
              <CardDescription className="text-body">
                {isCallActive ? 'Call in progress' : 'Start a new call'}
              </CardDescription>
            </CardHeader>
            <CardContent className="card-spacing stack-spacing">
              {/* Phone Number Input */}
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    disabled={isCallActive}
                    className="font-mono"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setPhoneNumber('')}
                    disabled={isCallActive}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Call Status */}
              {isCallActive && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-sm font-medium text-green-700">Active Call</span>
                    </div>
                    <span className="text-sm font-mono text-green-700">{formatDuration(callDuration)}</span>
                  </div>
                  {callSid && (
                    <p className="text-xs text-green-600 mt-1 font-mono">
                      ID: {callSid.slice(0, 20)}...
                    </p>
                  )}
                </div>
              )}

              {/* Call Actions */}
              <div className="flex gap-2">
                {!isCallActive ? (
                  <Button
                    onClick={handleStartCall}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    disabled={!phoneNumber || !isConnected || isCallActive}
                  >
                    <PhoneCall className="h-4 w-4 mr-2" />
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
                      End Call
                    </Button>
                  </>
                )}
              </div>

              {/* Configuration Actions */}
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  onClick={saveConfiguration}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Config
                </Button>
                <Button
                  onClick={loadConfiguration}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Load Config
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* DTMF Phone Pad */}
          <DTMFPhonePad
            onDigitPress={handleDTMF}
            onSequenceSend={(sequence, options) => handleDTMF(sequence, options)}
            isCallActive={isCallActive}
            ws={ws}
          />
        </div>

        {/* Middle Column - Advanced Configuration */}
        <div className="xl:col-span-2 stack-spacing">
          {/* Advanced Configuration Card */}
          <Card className="interactive-hover glass-card border-slate-200/50">
            <CardHeader className="bg-gradient-to-r from-blue-50/50 to-purple-50/50 rounded-t-2xl">
              <CardTitle className="flex items-center gap-2 text-title">
                <Brain className="h-5 w-5 text-blue-600" />
                Advanced AI Configuration
              </CardTitle>
              <CardDescription className="text-body">
                Complete OpenAI Realtime API settings for Sept 2025
              </CardDescription>
            </CardHeader>
            <CardContent className="card-spacing">
              <Tabs defaultValue="model" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="model">Model</TabsTrigger>
                  <TabsTrigger value="voice">Voice</TabsTrigger>
                  <TabsTrigger value="audio">Audio</TabsTrigger>
                  <TabsTrigger value="detection">Detection</TabsTrigger>
                  <TabsTrigger value="advanced">Advanced</TabsTrigger>
                </TabsList>

                <TabsContent value="model" className="stack-spacing mt-4">
                  <div>
                    <Label htmlFor="model" className="flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Model Selection
                    </Label>
                    <Select
                      value={sessionConfig.model}
                      onValueChange={(value) => setSessionConfig(prev => ({ ...prev, model: value }))}
                    >
                      <SelectTrigger id="model">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gpt-realtime">GPT-Realtime (Latest Sept 2025)</SelectItem>
                        <SelectItem value="gpt-4o-realtime-preview">GPT-4o Realtime Preview</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="modalities">Output Modalities</Label>
                    <div className="flex gap-2 mt-2">
                      <Button
                        variant={sessionConfig.modalities.includes('audio') ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                          const modalities = sessionConfig.modalities.includes('audio')
                            ? sessionConfig.modalities.filter(m => m !== 'audio')
                            : [...sessionConfig.modalities, 'audio'];
                          setSessionConfig(prev => ({ ...prev, modalities }));
                        }}
                      >
                        <Volume2 className="h-4 w-4 mr-2" />
                        Audio
                      </Button>
                      <Button
                        variant={sessionConfig.modalities.includes('text') ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                          const modalities = sessionConfig.modalities.includes('text')
                            ? sessionConfig.modalities.filter(m => m !== 'text')
                            : [...sessionConfig.modalities, 'text'];
                          setSessionConfig(prev => ({ ...prev, modalities }));
                        }}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Text
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="temp">Temperature: {sessionConfig.temperature}</Label>
                    <Slider
                      id="temp"
                      min={0}
                      max={2}
                      step={0.1}
                      value={[sessionConfig.temperature]}
                      onValueChange={([value]) => setSessionConfig(prev => ({ ...prev, temperature: value }))}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="max-tokens">Max Output Tokens</Label>
                    <Input
                      id="max-tokens"
                      type="number"
                      value={sessionConfig.max_output_tokens}
                      onChange={(e) => setSessionConfig(prev => ({ ...prev, max_output_tokens: parseInt(e.target.value) || 4096 }))}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="instructions">System Instructions</Label>
                    <Textarea
                      id="instructions"
                      value={sessionConfig.instructions}
                      onChange={(e) => setSessionConfig(prev => ({ ...prev, instructions: e.target.value }))}
                      rows={6}
                      className="mt-1"
                      placeholder="Enter detailed system instructions for the AI assistant..."
                    />
                  </div>
                </TabsContent>

                <TabsContent value="voice" className="stack-spacing mt-4">
                  <div>
                    <Label className="flex items-center gap-2 mb-3">
                      <Languages className="h-4 w-4" />
                      Voice Selection (Sept 2025 Update)
                    </Label>
                    <div className="grid gap-3">
                      {voiceOptions.map((voice) => (
                        <div
                          key={voice.value}
                          className={`p-3 rounded-lg border cursor-pointer transition-all ${
                            sessionConfig.voice === voice.value
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                          onClick={() => {
                            setSessionConfig(prev => ({
                              ...prev,
                              voice: voice.value,
                              audio: {
                                ...prev.audio,
                                output: {
                                  ...prev.audio.output,
                                  voice: voice.value
                                }
                              }
                            }));
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-medium">{voice.label}</span>
                              {voice.value === 'marin' || voice.value === 'cedar' ? (
                                <Badge variant="secondary" className="ml-2 text-xs">NEW</Badge>
                              ) : null}
                            </div>
                            {sessionConfig.voice === voice.value && (
                              <div className="h-2 w-2 bg-blue-500 rounded-full" />
                            )}
                          </div>
                          <p className="text-sm text-slate-600 mt-1">{voice.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="audio" className="stack-spacing mt-4">
                  <div>
                    <Label>Input Audio Format</Label>
                    <Select
                      value={sessionConfig.input_audio_format}
                      onValueChange={(value) => setSessionConfig(prev => ({ ...prev, input_audio_format: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pcm16">PCM16 (Default)</SelectItem>
                        <SelectItem value="g711_ulaw">G.711 µ-law</SelectItem>
                        <SelectItem value="g711_alaw">G.711 A-law</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Output Audio Format</Label>
                    <Select
                      value={sessionConfig.output_audio_format}
                      onValueChange={(value) => setSessionConfig(prev => ({ ...prev, output_audio_format: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pcm16">PCM16 (Default)</SelectItem>
                        <SelectItem value="g711_ulaw">G.711 µ-law</SelectItem>
                        <SelectItem value="g711_alaw">G.711 A-law</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Audio Sample Rate</Label>
                    <Select
                      value={sessionConfig.audio.input.format.rate.toString()}
                      onValueChange={(value) => setSessionConfig(prev => ({
                        ...prev,
                        audio: {
                          ...prev.audio,
                          input: {
                            ...prev.audio.input,
                            format: {
                              ...prev.audio.input.format,
                              rate: parseInt(value)
                            }
                          }
                        }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="8000">8kHz (Phone quality)</SelectItem>
                        <SelectItem value="16000">16kHz (Wide band)</SelectItem>
                        <SelectItem value="24000">24kHz (High quality)</SelectItem>
                        <SelectItem value="48000">48kHz (Studio quality)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Noise Reduction</Label>
                    <Select
                      value={sessionConfig.input_audio_noise_reduction.type || 'null'}
                      onValueChange={(value) => setSessionConfig(prev => ({
                        ...prev,
                        input_audio_noise_reduction: {
                          type: value === 'null' ? null : value as 'near_field' | 'far_field'
                        }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="near_field">Near Field (Default)</SelectItem>
                        <SelectItem value="far_field">Far Field</SelectItem>
                        <SelectItem value="null">Disabled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>

                <TabsContent value="detection" className="stack-spacing mt-4">
                  <div>
                    <Label className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Voice Activity Detection Type
                    </Label>
                    <Select
                      value={sessionConfig.turn_detection.type}
                      onValueChange={(value: 'server_vad' | 'semantic_vad' | 'none') =>
                        setSessionConfig(prev => ({
                          ...prev,
                          turn_detection: { ...prev.turn_detection, type: value }
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="semantic_vad">Semantic VAD (NEW - Recommended)</SelectItem>
                        <SelectItem value="server_vad">Server VAD</SelectItem>
                        <SelectItem value="none">Disabled (Manual control)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {sessionConfig.turn_detection.type !== 'none' && (
                    <>
                      <div>
                        <Label>
                          VAD Threshold: {sessionConfig.turn_detection.threshold}
                        </Label>
                        <Slider
                          min={0}
                          max={1}
                          step={0.1}
                          value={[sessionConfig.turn_detection.threshold || 0.5]}
                          onValueChange={([value]) =>
                            setSessionConfig(prev => ({
                              ...prev,
                              turn_detection: { ...prev.turn_detection, threshold: value }
                            }))
                          }
                          className="mt-2"
                        />
                      </div>

                      <div>
                        <Label>Prefix Padding (ms)</Label>
                        <Input
                          type="number"
                          value={sessionConfig.turn_detection.prefix_padding_ms}
                          onChange={(e) =>
                            setSessionConfig(prev => ({
                              ...prev,
                              turn_detection: {
                                ...prev.turn_detection,
                                prefix_padding_ms: parseInt(e.target.value) || 300
                              }
                            }))
                          }
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label>Silence Duration (ms)</Label>
                        <Input
                          type="number"
                          value={sessionConfig.turn_detection.silence_duration_ms}
                          onChange={(e) =>
                            setSessionConfig(prev => ({
                              ...prev,
                              turn_detection: {
                                ...prev.turn_detection,
                                silence_duration_ms: parseInt(e.target.value) || 500
                              }
                            }))
                          }
                          className="mt-1"
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="interrupt-response"
                          checked={sessionConfig.turn_detection.interrupt_response || false}
                          onCheckedChange={(checked) =>
                            setSessionConfig(prev => ({
                              ...prev,
                              turn_detection: { ...prev.turn_detection, interrupt_response: checked }
                            }))
                          }
                        />
                        <Label htmlFor="interrupt-response">Allow Interrupt Response</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="create-response"
                          checked={sessionConfig.turn_detection.create_response || false}
                          onCheckedChange={(checked) =>
                            setSessionConfig(prev => ({
                              ...prev,
                              turn_detection: { ...prev.turn_detection, create_response: checked }
                            }))
                          }
                        />
                        <Label htmlFor="create-response">Auto Create Response</Label>
                      </div>
                    </>
                  )}
                </TabsContent>

                <TabsContent value="advanced" className="stack-spacing mt-4">
                  <div>
                    <Label>Tool Choice</Label>
                    <Select
                      value={sessionConfig.tool_choice}
                      onValueChange={(value: 'auto' | 'none' | 'required') =>
                        setSessionConfig(prev => ({ ...prev, tool_choice: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">Auto (Recommended)</SelectItem>
                        <SelectItem value="required">Required</SelectItem>
                        <SelectItem value="none">Disabled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Transcription Model</Label>
                    <Select
                      value={sessionConfig.input_audio_transcription.model}
                      onValueChange={(value) => setSessionConfig(prev => ({
                        ...prev,
                        input_audio_transcription: { ...prev.input_audio_transcription, model: value }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gpt-4o-transcribe">GPT-4o Transcribe (NEW)</SelectItem>
                        <SelectItem value="gpt-4o-mini-transcribe">GPT-4o Mini Transcribe</SelectItem>
                        <SelectItem value="whisper-1">Whisper-1</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Transcription Language</Label>
                    <Select
                      value={sessionConfig.input_audio_transcription.language}
                      onValueChange={(value) => setSessionConfig(prev => ({
                        ...prev,
                        input_audio_transcription: { ...prev.input_audio_transcription, language: value }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="de">German</SelectItem>
                        <SelectItem value="it">Italian</SelectItem>
                        <SelectItem value="pt">Portuguese</SelectItem>
                        <SelectItem value="ja">Japanese</SelectItem>
                        <SelectItem value="ko">Korean</SelectItem>
                        <SelectItem value="zh">Chinese</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Transcription Prompt</Label>
                    <Textarea
                      value={sessionConfig.input_audio_transcription.prompt}
                      onChange={(e) => setSessionConfig(prev => ({
                        ...prev,
                        input_audio_transcription: { ...prev.input_audio_transcription, prompt: e.target.value }
                      }))}
                      rows={3}
                      className="mt-1"
                      placeholder="Optional prompt to guide transcription (e.g., 'Expect technical terms')"
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Monitoring & Logs */}
        <div className="xl:col-span-1 stack-spacing">
          {/* Transcript Card */}
          <Card className="interactive-hover glass-card border-slate-200/50 h-[400px]">
            <CardHeader className="bg-gradient-to-r from-blue-50/50 to-purple-50/50 rounded-t-2xl">
              <CardTitle className="flex items-center gap-2 text-title">
                <MessageSquare className="h-5 w-5 text-blue-600" />
                Conversation
              </CardTitle>
              <CardDescription className="text-body">
                {transcript.length} messages
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[320px] p-4">
                <div className="space-y-2">
                  {transcript.map((item) => (
                    <div
                      key={item.id}
                      className={`flex ${item.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] px-3 py-2 rounded-lg ${
                          item.role === 'user'
                            ? 'bg-blue-600 text-white'
                            : item.role === 'system'
                            ? 'bg-gray-100 text-gray-700 text-sm italic'
                            : 'bg-gray-200 text-gray-900'
                        }`}
                      >
                        <p className="text-sm">{item.content}</p>
                        <p className={`text-xs mt-1 ${
                          item.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {new Date(item.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={transcriptEndRef} />
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Real-time Metrics */}
          <Card className="interactive-hover glass-card border-slate-200/50">
            <CardHeader className="bg-gradient-to-r from-blue-50/50 to-purple-50/50 rounded-t-2xl">
              <CardTitle className="flex items-center gap-2 text-title">
                <Activity className="h-5 w-5 text-blue-600" />
                Real-time Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="card-spacing stack-spacing">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-xs text-blue-600 font-medium">Status</p>
                  <p className="text-lg font-bold text-blue-900">
                    {isCallActive ? 'Active' : 'Idle'}
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg p-3">
                  <p className="text-xs text-green-600 font-medium">Connection</p>
                  <p className="text-lg font-bold text-green-900">
                    {isConnected ? 'Connected' : 'Offline'}
                  </p>
                </div>
                <div className="bg-purple-50 rounded-lg p-3">
                  <p className="text-xs text-purple-600 font-medium">Messages</p>
                  <p className="text-lg font-bold text-purple-900">
                    {transcript.length}
                  </p>
                </div>
                <div className="bg-orange-50 rounded-lg p-3">
                  <p className="text-xs text-orange-600 font-medium">Events</p>
                  <p className="text-lg font-bold text-orange-900">
                    {logs.length}
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Model</span>
                  <Badge variant="outline" className="font-mono text-xs">
                    {sessionConfig.model}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-gray-600">Voice</span>
                  <Badge variant="outline">{sessionConfig.voice}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-gray-600">VAD Type</span>
                  <Badge variant="outline">{sessionConfig.turn_detection.type}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Real-time Logs */}
          <Card className="interactive-hover glass-card border-slate-200/50 h-[300px]">
            <CardHeader className="bg-gradient-to-r from-blue-50/50 to-purple-50/50 rounded-t-2xl">
              <CardTitle className="flex items-center justify-between text-title">
                <div className="flex items-center gap-2">
                  <Code className="h-5 w-5 text-blue-600" />
                  System Logs
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLogs([])}
                >
                  Clear
                </Button>
              </CardTitle>
              <CardDescription className="text-body">
                Real-time events and debugging
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[200px] p-4">
                <div className="space-y-1 font-mono text-xs">
                  {logs.map((log, index) => (
                    <div
                      key={index}
                      className={`flex gap-2 ${
                        log.type === 'error' ? 'text-red-600' :
                        log.type === 'warning' ? 'text-yellow-600' :
                        log.type === 'info' ? 'text-blue-600' :
                        'text-gray-600'
                      }`}
                    >
                      <span className="text-gray-400">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                      <span className="font-semibold">[{log.source}]</span>
                      <span>{log.message}</span>
                    </div>
                  ))}
                  <div ref={logsEndRef} />
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}