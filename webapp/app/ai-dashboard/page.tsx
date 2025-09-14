"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX, Settings2,
  Brain, Zap, Clock, AlertCircle, CheckCircle2, WifiOff,
  Activity, MessageSquare, Wrench, Gauge, Bot, Sparkles,
  Save, RefreshCw, Copy, Download, Upload, Send
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import BreadcrumbNav from "@/components/breadcrumb-nav";
import MobileNav from "@/components/mobile-nav";

interface RealtimeConfig {
  // Core Configuration
  model: string;
  instructions: string;

  // Voice Settings
  voice: string;

  // Modalities
  modalities: string[];

  // Audio Formats
  input_audio_format: string;
  output_audio_format: string;

  // Turn Detection (VAD)
  turn_detection: {
    type: 'server_vad' | 'semantic_vad' | 'none';
    threshold?: number;
    prefix_padding_ms?: number;
    silence_duration_ms?: number;
    create_response?: boolean;
    interrupt_response?: boolean;
    eagerness?: 'auto' | 'low' | 'high';
  };

  // Advanced Parameters
  temperature: number;
  max_output_tokens: number | 'inf';
  top_p: number;
  frequency_penalty: number;
  presence_penalty: number;

  // Transcription
  input_audio_transcription: {
    model: string;
  } | null;

  // Tools
  tools: any[];
  tool_choice: 'auto' | 'none' | 'required' | { type: 'function'; function: { name: string } };

  // Output Audio Gain (custom)
  output_audio_gain?: number;

  // Recording
  recordCall?: boolean;
}

export default function AIDashboard() {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);

  // Configuration State
  const [config, setConfig] = useState<RealtimeConfig>({
    model: "gpt-4o-realtime-preview-2024-12-17",
    instructions: "You are a helpful, witty, and professional AI assistant. Speak naturally and conversationally.",
    voice: "alloy",
    modalities: ["text", "audio"],
    input_audio_format: "pcm16",
    output_audio_format: "pcm16",
    turn_detection: {
      type: 'server_vad',
      threshold: 0.5,
      prefix_padding_ms: 300,
      silence_duration_ms: 500,
    },
    temperature: 0.8,
    max_output_tokens: 4096,
    top_p: 1.0,
    frequency_penalty: 0,
    presence_penalty: 0,
    input_audio_transcription: {
      model: "whisper-1"
    },
    tools: [],
    tool_choice: 'auto',
    output_audio_gain: 1.0,
    recordCall: false,
  });

  // Real-time Metrics
  const [metrics, setMetrics] = useState({
    latency: 0,
    tokensUsed: 0,
    audioDuration: 0,
    turnCount: 0,
  });

  // Phone Number Input
  const [phoneNumber, setPhoneNumber] = useState("");

  // Connect to WebSocket
  const connectWebSocket = useCallback(() => {
    const websocket = new WebSocket(process.env.NEXT_PUBLIC_WEBSOCKET_URL || "ws://localhost:8081");

    websocket.onopen = () => {
      setIsConnected(true);
      toast({
        title: "Connected",
        description: "Successfully connected to the server",
      });
    };

    websocket.onclose = () => {
      setIsConnected(false);
      toast({
        title: "Disconnected",
        description: "Connection to server lost",
        variant: "destructive",
      });
    };

    websocket.onerror = (error) => {
      console.error("WebSocket error:", error);
      toast({
        title: "Connection Error",
        description: "Failed to connect to the server",
        variant: "destructive",
      });
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      // Handle real-time updates
      if (data.type === "metrics.update") {
        setMetrics(data.metrics);
      }
    };

    setWs(websocket);

    return () => {
      websocket.close();
    };
  }, [toast]);

  useEffect(() => {
    const cleanup = connectWebSocket();
    return cleanup;
  }, [connectWebSocket]);

  // Save Configuration
  const saveConfiguration = () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: "session.update",
        session: config,
      }));
      toast({
        title: "Configuration Saved",
        description: "Your settings have been applied",
      });
    }
  };

  // Start Call
  const startCall = () => {
    if (!phoneNumber) {
      toast({
        title: "Phone Number Required",
        description: "Please enter a phone number to call",
        variant: "destructive",
      });
      return;
    }

    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: "call.start",
        phoneNumber,
        config,
      }));
      setIsCallActive(true);
    }
  };

  // End Call
  const endCall = () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: "call.end",
      }));
      setIsCallActive(false);
    }
  };

  // Toggle Mute
  const toggleMute = () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: "audio.mute",
        muted: !isMuted,
      }));
      setIsMuted(!isMuted);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Mobile Navigation for small screens */}
      <div className="lg:hidden border-b bg-white sticky top-0 z-50">
        <div className="flex items-center justify-between p-4">
          <MobileNav />
          <h1 className="text-lg font-semibold">AI Dashboard</h1>
          <Badge variant={isConnected ? "default" : "destructive"} className="gap-1">
            {isConnected ? <CheckCircle2 className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
          </Badge>
        </div>
      </div>

      <div className="p-4 lg:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Breadcrumb Navigation */}
          <div className="hidden lg:block">
            <BreadcrumbNav />
          </div>

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">AI Voice Caller Dashboard</h1>
              <p className="text-gray-500 mt-1 text-sm sm:text-base">Advanced OpenAI Realtime API Configuration</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={isConnected ? "default" : "destructive"} className="gap-1 hidden lg:flex">
                {isConnected ? (
                  <>
                    <CheckCircle2 className="h-3 w-3" />
                    Connected
                  </>
                ) : (
                  <>
                    <WifiOff className="h-3 w-3" />
                    Disconnected
                  </>
                )}
              </Badge>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Call Control & Metrics */}
          <div className="space-y-6">
            {/* Call Control Card */}
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-900">
                  <Phone className="h-5 w-5" />
                  Call Control
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="phone" className="text-blue-800">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1234567890"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="mt-1 bg-white"
                    disabled={isCallActive}
                  />
                </div>

                <div className="flex gap-2">
                  {!isCallActive ? (
                    <Button
                      onClick={startCall}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                      disabled={!isConnected}
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      Start Call
                    </Button>
                  ) : (
                    <>
                      <Button
                        onClick={endCall}
                        variant="destructive"
                        className="flex-1"
                      >
                        <PhoneOff className="h-4 w-4 mr-2" />
                        End Call
                      </Button>
                      <Button
                        onClick={toggleMute}
                        variant="outline"
                        size="icon"
                      >
                        {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Real-time Metrics */}
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-900">
                  <Activity className="h-5 w-5" />
                  Real-time Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-blue-700">Latency</span>
                  <span className="text-sm font-medium">{metrics.latency}ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-blue-700">Tokens Used</span>
                  <span className="text-sm font-medium">{metrics.tokensUsed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-blue-700">Audio Duration</span>
                  <span className="text-sm font-medium">{metrics.audioDuration}s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-blue-700">Turn Count</span>
                  <span className="text-sm font-medium">{metrics.turnCount}</span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-900">
                  <Zap className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start" onClick={saveConfiguration}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Configuration
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Download className="h-4 w-4 mr-2" />
                  Export Settings
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Upload className="h-4 w-4 mr-2" />
                  Import Settings
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset to Defaults
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Configuration Tabs */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings2 className="h-5 w-5" />
                  Configuration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="core" className="w-full">
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="core">Core</TabsTrigger>
                    <TabsTrigger value="voice">Voice</TabsTrigger>
                    <TabsTrigger value="vad">VAD</TabsTrigger>
                    <TabsTrigger value="advanced">Advanced</TabsTrigger>
                    <TabsTrigger value="tools">Tools</TabsTrigger>
                  </TabsList>

                  {/* Core Settings Tab */}
                  <TabsContent value="core" className="space-y-4 mt-4">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="model" className="flex items-center gap-2">
                          <Brain className="h-4 w-4" />
                          Model
                        </Label>
                        <Select
                          value={config.model}
                          onValueChange={(v) => setConfig({...config, model: v})}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="gpt-4o-realtime-preview-2024-12-17">GPT-4o Realtime (Latest)</SelectItem>
                            <SelectItem value="gpt-4o-realtime-preview">GPT-4o Realtime Preview</SelectItem>
                            <SelectItem value="gpt-4o-mini-realtime">GPT-4o Mini Realtime</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="instructions" className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4" />
                          System Instructions
                        </Label>
                        <Textarea
                          id="instructions"
                          value={config.instructions}
                          onChange={(e) => setConfig({...config, instructions: e.target.value})}
                          className="mt-1 min-h-[150px]"
                          placeholder="Enter system instructions..."
                        />
                      </div>

                      <div>
                        <Label className="flex items-center gap-2 mb-2">
                          <Bot className="h-4 w-4" />
                          Modalities
                        </Label>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={config.modalities.includes("text")}
                              onCheckedChange={(checked) => {
                                const mods = checked
                                  ? [...config.modalities, "text"].filter((v, i, a) => a.indexOf(v) === i)
                                  : config.modalities.filter(m => m !== "text");
                                setConfig({...config, modalities: mods});
                              }}
                            />
                            <Label>Text</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={config.modalities.includes("audio")}
                              onCheckedChange={(checked) => {
                                const mods = checked
                                  ? [...config.modalities, "audio"].filter((v, i, a) => a.indexOf(v) === i)
                                  : config.modalities.filter(m => m !== "audio");
                                setConfig({...config, modalities: mods});
                              }}
                            />
                            <Label>Audio</Label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Voice Settings Tab */}
                  <TabsContent value="voice" className="space-y-4 mt-4">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="voice" className="flex items-center gap-2">
                          <Volume2 className="h-4 w-4" />
                          Voice Selection
                        </Label>
                        <Select
                          value={config.voice}
                          onValueChange={(v) => setConfig({...config, voice: v})}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="alloy">Alloy (Neutral)</SelectItem>
                            <SelectItem value="ash">Ash (Confident)</SelectItem>
                            <SelectItem value="ballad">Ballad (Warm)</SelectItem>
                            <SelectItem value="coral">Coral (Friendly)</SelectItem>
                            <SelectItem value="echo">Echo (Smooth)</SelectItem>
                            <SelectItem value="sage">Sage (Authoritative)</SelectItem>
                            <SelectItem value="shimmer">Shimmer (Energetic)</SelectItem>
                            <SelectItem value="verse">Verse (Professional)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="input-format">Input Audio Format</Label>
                        <Select
                          value={config.input_audio_format}
                          onValueChange={(v) => setConfig({...config, input_audio_format: v})}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pcm16">PCM16 (24kHz)</SelectItem>
                            <SelectItem value="g711_ulaw">G.711 µ-law (8kHz)</SelectItem>
                            <SelectItem value="g711_alaw">G.711 A-law (8kHz)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="output-format">Output Audio Format</Label>
                        <Select
                          value={config.output_audio_format}
                          onValueChange={(v) => setConfig({...config, output_audio_format: v})}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pcm16">PCM16 (24kHz)</SelectItem>
                            <SelectItem value="g711_ulaw">G.711 µ-law (8kHz)</SelectItem>
                            <SelectItem value="g711_alaw">G.711 A-law (8kHz)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="gain" className="flex items-center justify-between">
                          <span>Output Audio Gain</span>
                          <span className="text-sm text-muted-foreground">{config.output_audio_gain?.toFixed(1)}x</span>
                        </Label>
                        <Slider
                          id="gain"
                          min={0.1}
                          max={2.0}
                          step={0.1}
                          value={[config.output_audio_gain || 1.0]}
                          onValueChange={([v]) => setConfig({...config, output_audio_gain: v})}
                          className="mt-2"
                        />
                      </div>

                      <div>
                        <Label htmlFor="transcription">Transcription Model</Label>
                        <Select
                          value={config.input_audio_transcription?.model || "none"}
                          onValueChange={(v) => setConfig({
                            ...config,
                            input_audio_transcription: v === "none" ? null : { model: v }
                          })}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            <SelectItem value="whisper-1">Whisper-1</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </TabsContent>

                  {/* VAD Settings Tab */}
                  <TabsContent value="vad" className="space-y-4 mt-4">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="vad-type">Turn Detection Type</Label>
                        <Select
                          value={config.turn_detection.type}
                          onValueChange={(v: 'server_vad' | 'semantic_vad' | 'none') =>
                            setConfig({...config, turn_detection: {...config.turn_detection, type: v}})
                          }
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="server_vad">Server VAD (Silence-based)</SelectItem>
                            <SelectItem value="semantic_vad">Semantic VAD (AI-based)</SelectItem>
                            <SelectItem value="none">None (Manual)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {config.turn_detection.type === 'server_vad' && (
                        <>
                          <div>
                            <Label htmlFor="threshold" className="flex items-center justify-between">
                              <span>VAD Threshold</span>
                              <span className="text-sm text-muted-foreground">{config.turn_detection.threshold?.toFixed(2)}</span>
                            </Label>
                            <Slider
                              id="threshold"
                              min={0}
                              max={1}
                              step={0.01}
                              value={[config.turn_detection.threshold || 0.5]}
                              onValueChange={([v]) => setConfig({
                                ...config,
                                turn_detection: {...config.turn_detection, threshold: v}
                              })}
                              className="mt-2"
                            />
                          </div>

                          <div>
                            <Label htmlFor="prefix" className="flex items-center justify-between">
                              <span>Prefix Padding (ms)</span>
                              <span className="text-sm text-muted-foreground">{config.turn_detection.prefix_padding_ms}ms</span>
                            </Label>
                            <Slider
                              id="prefix"
                              min={0}
                              max={1000}
                              step={50}
                              value={[config.turn_detection.prefix_padding_ms || 300]}
                              onValueChange={([v]) => setConfig({
                                ...config,
                                turn_detection: {...config.turn_detection, prefix_padding_ms: v}
                              })}
                              className="mt-2"
                            />
                          </div>

                          <div>
                            <Label htmlFor="silence" className="flex items-center justify-between">
                              <span>Silence Duration (ms)</span>
                              <span className="text-sm text-muted-foreground">{config.turn_detection.silence_duration_ms}ms</span>
                            </Label>
                            <Slider
                              id="silence"
                              min={100}
                              max={2000}
                              step={100}
                              value={[config.turn_detection.silence_duration_ms || 500]}
                              onValueChange={([v]) => setConfig({
                                ...config,
                                turn_detection: {...config.turn_detection, silence_duration_ms: v}
                              })}
                              className="mt-2"
                            />
                          </div>
                        </>
                      )}

                      {config.turn_detection.type === 'semantic_vad' && (
                        <>
                          <div>
                            <Label htmlFor="eagerness">Eagerness Level</Label>
                            <Select
                              value={config.turn_detection.eagerness || 'auto'}
                              onValueChange={(v: 'auto' | 'low' | 'high') =>
                                setConfig({...config, turn_detection: {...config.turn_detection, eagerness: v}})
                              }
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="auto">Auto</SelectItem>
                                <SelectItem value="low">Low (Wait longer)</SelectItem>
                                <SelectItem value="high">High (Respond quickly)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Switch
                                checked={config.turn_detection.create_response !== false}
                                onCheckedChange={(checked) => setConfig({
                                  ...config,
                                  turn_detection: {...config.turn_detection, create_response: checked}
                                })}
                              />
                              <Label>Auto-create Response</Label>
                            </div>

                            <div className="flex items-center space-x-2">
                              <Switch
                                checked={config.turn_detection.interrupt_response !== false}
                                onCheckedChange={(checked) => setConfig({
                                  ...config,
                                  turn_detection: {...config.turn_detection, interrupt_response: checked}
                                })}
                              />
                              <Label>Allow Interruption</Label>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </TabsContent>

                  {/* Advanced Settings Tab */}
                  <TabsContent value="advanced" className="space-y-4 mt-4">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="temperature" className="flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <Gauge className="h-4 w-4" />
                            Temperature
                          </span>
                          <span className="text-sm text-muted-foreground">{config.temperature.toFixed(1)}</span>
                        </Label>
                        <Slider
                          id="temperature"
                          min={0}
                          max={2}
                          step={0.1}
                          value={[config.temperature]}
                          onValueChange={([v]) => setConfig({...config, temperature: v})}
                          className="mt-2"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Controls randomness: 0 = deterministic, 2 = very creative
                        </p>
                      </div>

                      <div>
                        <Label htmlFor="max-tokens" className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4" />
                          Max Output Tokens
                        </Label>
                        <Input
                          id="max-tokens"
                          type="number"
                          value={config.max_output_tokens === 'inf' ? '' : config.max_output_tokens}
                          onChange={(e) => setConfig({
                            ...config,
                            max_output_tokens: e.target.value ? parseInt(e.target.value) : 'inf'
                          })}
                          placeholder="Unlimited"
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="top-p" className="flex items-center justify-between">
                          <span>Top P</span>
                          <span className="text-sm text-muted-foreground">{config.top_p.toFixed(2)}</span>
                        </Label>
                        <Slider
                          id="top-p"
                          min={0}
                          max={1}
                          step={0.01}
                          value={[config.top_p]}
                          onValueChange={([v]) => setConfig({...config, top_p: v})}
                          className="mt-2"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Nucleus sampling: consider tokens with top_p probability mass
                        </p>
                      </div>

                      <div>
                        <Label htmlFor="freq-penalty" className="flex items-center justify-between">
                          <span>Frequency Penalty</span>
                          <span className="text-sm text-muted-foreground">{config.frequency_penalty.toFixed(1)}</span>
                        </Label>
                        <Slider
                          id="freq-penalty"
                          min={-2}
                          max={2}
                          step={0.1}
                          value={[config.frequency_penalty]}
                          onValueChange={([v]) => setConfig({...config, frequency_penalty: v})}
                          className="mt-2"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Reduces repetition of frequent tokens
                        </p>
                      </div>

                      <div>
                        <Label htmlFor="presence-penalty" className="flex items-center justify-between">
                          <span>Presence Penalty</span>
                          <span className="text-sm text-muted-foreground">{config.presence_penalty.toFixed(1)}</span>
                        </Label>
                        <Slider
                          id="presence-penalty"
                          min={-2}
                          max={2}
                          step={0.1}
                          value={[config.presence_penalty]}
                          onValueChange={([v]) => setConfig({...config, presence_penalty: v})}
                          className="mt-2"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Encourages new topics
                        </p>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="record"
                          checked={config.recordCall || false}
                          onCheckedChange={(checked) => setConfig({...config, recordCall: checked})}
                        />
                        <Label htmlFor="record">Record Call</Label>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Tools Tab */}
                  <TabsContent value="tools" className="space-y-4 mt-4">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="tool-choice" className="flex items-center gap-2">
                          <Wrench className="h-4 w-4" />
                          Tool Choice
                        </Label>
                        <Select
                          value={typeof config.tool_choice === 'string' ? config.tool_choice : 'function'}
                          onValueChange={(v) => setConfig({...config, tool_choice: v as any})}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="auto">Auto (Let AI decide)</SelectItem>
                            <SelectItem value="none">None (No tools)</SelectItem>
                            <SelectItem value="required">Required (Must use tool)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Available Tools</Label>
                        <div className="mt-2 space-y-2">
                          <Card className="p-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Weather API</span>
                              <Switch />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Get current weather information</p>
                          </Card>

                          <Card className="p-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Calendar Integration</span>
                              <Switch />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Schedule and manage appointments</p>
                          </Card>

                          <Card className="p-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Knowledge Base</span>
                              <Switch />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Access company documentation</p>
                          </Card>

                          <Button variant="outline" className="w-full">
                            <Wrench className="h-4 w-4 mr-2" />
                            Add Custom Tool
                          </Button>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}