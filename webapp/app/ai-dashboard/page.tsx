'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import DTMFPhonePad from '@/components/dtmf-phone-pad';
import {
  Phone, Settings, History, Save, MessageSquare, Activity,
  CreditCard, User, LogOut, Menu, X, ChevronRight,
  Mic, MicOff, PhoneOff, PhoneCall, Bot, Brain,
  Zap, Shield, Globe, Database, Cloud, Code,
  Home, FileText, Users, HelpCircle, Wifi, WifiOff,
  AlertCircle, CheckCircle2, Clock, Send, Copy, Download
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { toast } from '@/components/ui/use-toast';

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

interface SessionConfig {
  model: string;
  instructions: string;
  voice: string;
  temperature: number;
  maxTokens: number;
  tools: any[];
  turn_detection: {
    type: 'server_vad' | 'none';
    threshold?: number;
    prefix_padding_ms?: number;
    silence_duration_ms?: number;
  };
}

export default function AIDashboard() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  // Session configuration
  const [sessionConfig, setSessionConfig] = useState<SessionConfig>({
    model: 'gpt-4o-realtime-preview-2024-12-17',
    instructions: `You are a helpful AI assistant in a phone call. Be conversational, friendly, and helpful.
Keep responses concise and natural. You have access to various tools to help the caller.`,
    voice: 'ash',
    temperature: 0.8,
    maxTokens: 4096,
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
    turn_detection: {
      type: 'server_vad',
      threshold: 0.5,
      prefix_padding_ms: 300,
      silence_duration_ms: 500
    }
  });

  // Refs for auto-scroll
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Authentication check
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // WebSocket connection
  useEffect(() => {
    if (!user) return;

    const wsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:8081';
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
    setLogs(prev => [...prev.slice(-99), entry]); // Keep last 100 logs
    setTimeout(() => {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Start call
  const handleStartCall = async () => {
    if (!phoneNumber || !ws) {
      toast({
        title: 'Error',
        description: 'Please enter a phone number',
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
          to: phoneNumber,
          sessionConfig
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

  // Handle logout
  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) return null;

  const navigationItems = [
    { href: '/ai-dashboard', label: 'Dashboard', icon: Home },
    { href: '/incoming-config', label: 'Incoming Calls', icon: PhoneCall },
    { href: '/recordings', label: 'Recordings', icon: History },
    { href: '/logs', label: 'Call Logs', icon: FileText },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Brain className="h-8 w-8 text-blue-600" />
              <div className="hidden sm:block">
                <h1 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  AI Voice Assistant
                </h1>
                <p className="text-xs lg:text-sm text-gray-600">Welcome, {user.name || user.email}</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant={pathname === item.href ? "default" : "ghost"}
                      size="sm"
                      className="gap-2"
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Button>
                  </Link>
                );
              })}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-2 lg:gap-4">
              <Badge variant="outline" className="px-2 lg:px-3 py-1">
                <CreditCard className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">{user.credits || 0} Credits</span>
                <span className="sm:hidden">{user.credits || 0}</span>
              </Badge>

              {/* Connection Status */}
              <Badge variant={isConnected ? "default" : "secondary"}>
                {isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
              </Badge>

              {/* User Menu */}
              <div className="hidden md:block">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-2">
                      <User className="h-4 w-4" />
                      <span className="hidden lg:inline">{user.name || 'Account'}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => router.push('/settings')}>
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Mobile Menu */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild className="md:hidden">
                  <Button variant="ghost" size="sm">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[250px] sm:w-[300px]">
                  <div className="flex flex-col h-full">
                    <div className="flex items-center gap-3 mb-6">
                      <Brain className="h-8 w-8 text-blue-600" />
                      <div>
                        <h2 className="font-bold text-lg">AI Assistant</h2>
                        <p className="text-xs text-gray-600">{user.email}</p>
                      </div>
                    </div>
                    <nav className="flex-1 space-y-2">
                      {navigationItems.map((item) => {
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <Button
                              variant={pathname === item.href ? "secondary" : "ghost"}
                              className="w-full justify-start gap-3"
                            >
                              <Icon className="h-4 w-4" />
                              {item.label}
                            </Button>
                          </Link>
                        );
                      })}
                    </nav>
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-3 text-red-600"
                      onClick={() => {
                        handleLogout();
                        setMobileMenuOpen(false);
                      }}
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Call Control & Configuration */}
          <div className="lg:col-span-1 space-y-6">
            {/* Call Control Card */}
            <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-blue-100">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5 text-blue-600" />
                  Call Control
                </CardTitle>
                <CardDescription>
                  {isCallActive ? 'Call in progress' : 'Start a new call'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
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
                      disabled={!phoneNumber || !isConnected}
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
              </CardContent>
            </Card>

            {/* Configuration Card */}
            <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-blue-100">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-blue-600" />
                  AI Configuration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="basic" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="basic">Basic</TabsTrigger>
                    <TabsTrigger value="advanced">Advanced</TabsTrigger>
                  </TabsList>

                  <TabsContent value="basic" className="space-y-4 mt-4">
                    <div>
                      <Label htmlFor="voice">Voice</Label>
                      <Select
                        value={sessionConfig.voice}
                        onValueChange={(value) => setSessionConfig(prev => ({ ...prev, voice: value }))}
                      >
                        <SelectTrigger id="voice">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ash">Ash</SelectItem>
                          <SelectItem value="ballad">Ballad</SelectItem>
                          <SelectItem value="coral">Coral</SelectItem>
                          <SelectItem value="sage">Sage</SelectItem>
                          <SelectItem value="verse">Verse</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="temp">Temperature: {sessionConfig.temperature}</Label>
                      <Slider
                        id="temp"
                        min={0}
                        max={1}
                        step={0.1}
                        value={[sessionConfig.temperature]}
                        onValueChange={([value]) => setSessionConfig(prev => ({ ...prev, temperature: value }))}
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="instructions">Instructions</Label>
                      <Textarea
                        id="instructions"
                        value={sessionConfig.instructions}
                        onChange={(e) => setSessionConfig(prev => ({ ...prev, instructions: e.target.value }))}
                        rows={4}
                        className="mt-1"
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="advanced" className="space-y-4 mt-4">
                    <div>
                      <Label htmlFor="model">Model</Label>
                      <Input
                        id="model"
                        value={sessionConfig.model}
                        onChange={(e) => setSessionConfig(prev => ({ ...prev, model: e.target.value }))}
                        className="mt-1 font-mono text-xs"
                      />
                    </div>

                    <div>
                      <Label htmlFor="vad">VAD Type</Label>
                      <Select
                        value={sessionConfig.turn_detection.type}
                        onValueChange={(value: 'server_vad' | 'none') =>
                          setSessionConfig(prev => ({
                            ...prev,
                            turn_detection: { ...prev.turn_detection, type: value }
                          }))
                        }
                      >
                        <SelectTrigger id="vad">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="server_vad">Server VAD</SelectItem>
                          <SelectItem value="none">None</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {sessionConfig.turn_detection.type === 'server_vad' && (
                      <div>
                        <Label htmlFor="threshold">
                          VAD Threshold: {sessionConfig.turn_detection.threshold}
                        </Label>
                        <Slider
                          id="threshold"
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
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Middle Column - DTMF & Transcript */}
          <div className="lg:col-span-1 space-y-6">
            {/* DTMF Phone Pad */}
            <DTMFPhonePad
              onDigitPress={handleDTMF}
              onSequenceSend={(sequence, options) => handleDTMF(sequence, options)}
              isCallActive={isCallActive}
              ws={ws}
            />

            {/* Transcript Card */}
            <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-blue-100 h-[400px]">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-blue-600" />
                  Conversation
                </CardTitle>
                <CardDescription>
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
          </div>

          {/* Right Column - Metrics & Logs */}
          <div className="lg:col-span-1 space-y-6">
            {/* Real-time Metrics */}
            <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-blue-100">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-600" />
                  Real-time Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
                      {sessionConfig.model.split('-').slice(0, 3).join('-')}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-2">
                    <span className="text-gray-600">Voice</span>
                    <Badge variant="outline">{sessionConfig.voice}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-2">
                    <span className="text-gray-600">Temperature</span>
                    <Badge variant="outline">{sessionConfig.temperature}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Real-time Logs */}
            <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-blue-100 h-[400px]">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
                <CardTitle className="flex items-center justify-between">
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
                <CardDescription>
                  Real-time events and debugging
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[300px] p-4">
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
    </div>
  );
}