'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import {
  Save, Settings, Phone, Mic, Brain, Code, Database,
  AlertCircle, CheckCircle2, Volume2, Zap, Shield, Globe,
  ChevronLeft, RefreshCw, Copy, Download, Upload, Image,
  PhoneCall, Server, Sparkles, Clock
} from 'lucide-react';

interface IncomingCallConfig {
  id?: string;
  name: string;
  instructions: string;
  model: string;
  voice: string;
  temperature: number;
  maxTokens: number;
  maxOutputTokens?: number;
  tools: any[];
  turnDetection: {
    type: 'server_vad' | 'semantic_vad' | 'none';
    threshold?: number;
    prefix_padding_ms?: number;
    silence_duration_ms?: number;
    create_response?: boolean;
  };
  inputAudioFormat: string;
  outputAudioFormat: string;
  inputAudioTranscription?: {
    enabled?: boolean;
    model?: string;
  };
  modalities?: string[];
  enable_images?: boolean;
  enable_sip?: boolean;
  enable_mcp?: boolean;
  response_mode?: 'blocking' | 'streaming';
}

const defaultTools = [
  {
    type: "function",
    name: "get_current_time",
    description: "Get the current time and date",
    parameters: {
      type: "object",
      properties: {},
      required: []
    }
  },
  {
    type: "function",
    name: "get_weather",
    description: "Get current weather for a location",
    parameters: {
      type: "object",
      properties: {
        location: {
          type: "string",
          description: "The city and country"
        }
      },
      required: ["location"]
    }
  },
  {
    type: "function",
    name: "transfer_call",
    description: "Transfer the call to another department or person",
    parameters: {
      type: "object",
      properties: {
        department: {
          type: "string",
          description: "The department to transfer to"
        }
      },
      required: ["department"]
    }
  },
  {
    type: "function",
    name: "schedule_callback",
    description: "Schedule a callback at a specific time",
    parameters: {
      type: "object",
      properties: {
        time: {
          type: "string",
          description: "The time for the callback"
        },
        phone: {
          type: "string",
          description: "The phone number to call back"
        }
      },
      required: ["time", "phone"]
    }
  },
  {
    type: "function",
    name: "search_knowledge_base",
    description: "Search internal documentation or knowledge base",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query"
        }
      },
      required: ["query"]
    }
  },
  {
    type: "function",
    name: "create_ticket",
    description: "Create a support ticket",
    parameters: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "Ticket title"
        },
        description: {
          type: "string",
          description: "Issue description"
        },
        priority: {
          type: "string",
          enum: ["low", "medium", "high", "urgent"],
          description: "Ticket priority"
        }
      },
      required: ["title", "description"]
    }
  }
];

// LATEST 2025 VOICES - Updated September 2025
const voiceOptions = [
  // New 2025 Exclusive Realtime API Voices
  { value: 'cedar', label: 'Cedar', description: '🆕 Natural & expressive (2025 Exclusive)', new: true },
  { value: 'marin', label: 'Marin', description: '🆕 Clear & professional (2025 Exclusive)', new: true },

  // Current Generation Voices
  { value: 'alloy', label: 'Alloy', description: 'Neutral and balanced' },
  { value: 'ash', label: 'Ash', description: 'Warm and conversational' },
  { value: 'ballad', label: 'Ballad', description: 'Expressive and emotive' },
  { value: 'coral', label: 'Coral', description: 'Professional and clear' },
  { value: 'echo', label: 'Echo', description: 'Clear and articulate' },
  { value: 'fable', label: 'Fable', description: 'Storytelling voice' },
  { value: 'nova', label: 'Nova', description: 'Modern and dynamic' },
  { value: 'onyx', label: 'Onyx', description: 'Deep and authoritative' },
  { value: 'sage', label: 'Sage', description: 'Calm and measured' },
  { value: 'shimmer', label: 'Shimmer', description: 'Smooth and refined' },
  { value: 'verse', label: 'Verse', description: 'Dynamic and engaging' }
];

const instructionTemplates = [
  {
    name: 'Customer Service',
    instructions: `You are a professional customer service representative. Be helpful, patient, and empathetic.
Always greet the caller warmly and ask how you can help them today.
Listen carefully to their concerns and provide clear, actionable solutions.
If you need to transfer them or schedule a callback, explain the process clearly.
End calls by asking if there's anything else you can help with.`
  },
  {
    name: 'Sales Assistant',
    instructions: `You are a knowledgeable sales assistant. Be enthusiastic but not pushy.
Greet callers professionally and identify their needs through thoughtful questions.
Highlight product benefits that match their specific requirements.
Handle objections with understanding and provide honest information.
Always offer to send additional information or schedule a follow-up.`
  },
  {
    name: 'Technical Support',
    instructions: `You are a technical support specialist. Be patient and thorough.
Start by understanding the caller's technical issue completely.
Walk them through troubleshooting steps clearly and at their pace.
Use simple language and avoid technical jargon unless necessary.
If the issue requires escalation, explain what will happen next.`
  },
  {
    name: 'Appointment Scheduler',
    instructions: `You are an appointment scheduling assistant. Be efficient and organized.
Greet callers and quickly understand their scheduling needs.
Offer available time slots and be flexible with options.
Confirm all appointment details including date, time, and purpose.
Provide any necessary preparation instructions or requirements.`
  },
  {
    name: 'Advanced AI Agent',
    instructions: `You are an advanced AI assistant with access to multiple tools and capabilities.
You can understand context from images, handle complex multi-step tasks, and seamlessly switch between languages.
Use your tools proactively to provide comprehensive assistance.
When handling sensitive information, always prioritize security and privacy.
Adapt your communication style to match the caller's needs and preferences.`
  }
];

export default function IncomingConfigPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [hasChanges, setHasChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [config, setConfig] = useState<IncomingCallConfig>({
    name: 'Default Incoming Call Configuration',
    instructions: '',
    model: 'gpt-realtime',  // Latest 2025 model
    voice: 'cedar',  // New 2025 voice
    temperature: 0.8,
    maxTokens: 4096,
    maxOutputTokens: 4096,
    tools: [],
    turnDetection: {
      type: 'server_vad',
      threshold: 0.5,
      prefix_padding_ms: 300,
      silence_duration_ms: 500,
      create_response: true
    },
    inputAudioFormat: 'pcm16',
    outputAudioFormat: 'pcm16',
    inputAudioTranscription: {
      enabled: false,
      model: 'whisper-1'
    },
    modalities: ['text', 'audio'],
    enable_images: false,
    enable_sip: true,
    enable_mcp: false,
    response_mode: 'streaming'
  });

  // Authentication check
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Load existing configuration
  useEffect(() => {
    loadConfiguration();
  }, []);

  // Auto-save functionality
  useEffect(() => {
    if (hasChanges && !loadingConfig && config.id) {
      // Clear existing timeout
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }

      // Set new timeout for auto-save (2 seconds after last change)
      autoSaveTimeoutRef.current = setTimeout(() => {
        handleAutoSave();
      }, 2000);
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [config, hasChanges, loadingConfig]);

  // Save on page unload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        handleAutoSave();
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasChanges]);

  const loadConfiguration = async () => {
    try {
      setLoadingConfig(true);
      const response = await fetch('/api/incoming-config', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        if (data.config) {
          setConfig(data.config);
          setLastSaved(new Date());
          setHasChanges(false);
        }
      }
    } catch (error) {
      console.error('Error loading configuration:', error);
      toast({
        title: 'Error',
        description: 'Failed to load configuration',
        variant: 'destructive'
      });
    } finally {
      setLoadingConfig(false);
    }
  };

  const handleAutoSave = async () => {
    if (!hasChanges) return;

    try {
      const method = config.id ? 'PUT' : 'POST';
      const response = await fetch('/api/incoming-config', {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(config)
      });

      if (response.ok) {
        const data = await response.json();
        setConfig(data.config);
        setHasChanges(false);
        setLastSaved(new Date());
        toast({
          title: 'Auto-saved',
          description: 'Configuration saved automatically',
          duration: 2000
        });
      }
    } catch (error) {
      console.error('Error auto-saving configuration:', error);
    }
  };

  const updateConfig = (updates: Partial<IncomingCallConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const method = config.id ? 'PUT' : 'POST';
      const response = await fetch('/api/incoming-config', {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(config)
      });

      if (response.ok) {
        const data = await response.json();
        setConfig(data.config);
        setHasChanges(false);
        setLastSaved(new Date());
        toast({
          title: 'Success',
          description: 'Configuration saved successfully'
        });
      } else {
        throw new Error('Failed to save configuration');
      }
    } catch (error) {
      console.error('Error saving configuration:', error);
      toast({
        title: 'Error',
        description: 'Failed to save configuration',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const applyTemplate = (template: typeof instructionTemplates[0]) => {
    updateConfig({ instructions: template.instructions });
    setSelectedTemplate(template.name);
    toast({
      title: 'Template Applied',
      description: `Applied ${template.name} template`
    });
  };

  const toggleTool = (tool: any) => {
    const existingIndex = config.tools.findIndex(t => t.name === tool.name);
    if (existingIndex >= 0) {
      // Remove tool
      updateConfig({
        tools: config.tools.filter((_, index) => index !== existingIndex)
      });
    } else {
      // Add tool
      updateConfig({
        tools: [...config.tools, tool]
      });
    }
  };

  const exportConfig = () => {
    const dataStr = JSON.stringify(config, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'incoming-call-config.json';

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const importConfig = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target?.result as string);
          updateConfig(imported);
          toast({
            title: 'Success',
            description: 'Configuration imported successfully'
          });
        } catch (error) {
          toast({
            title: 'Error',
            description: 'Invalid configuration file',
            variant: 'destructive'
          });
        }
      };
      reader.readAsText(file);
    }
  };

  if (loading || loadingConfig) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/ai-dashboard')}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back to Dashboard
              </Button>
              <div className="h-6 w-px bg-gray-300" />
              <div className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-blue-600" />
                <h1 className="text-xl font-bold">Incoming Call Configuration</h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {hasChanges && (
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Unsaved
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadConfiguration()}
                disabled={loadingConfig}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Reload
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || !hasChanges}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Configuration'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Status Card */}
          <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-blue-100">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  Configuration Status
                </div>
                <Badge variant="default" className="bg-green-500">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              </CardTitle>
              <CardDescription>
                <div className="flex items-center justify-between">
                  <span>This configuration will be used for all incoming calls to your Twilio number</span>
                  {lastSaved && (
                    <span className="text-xs text-gray-500">
                      Last saved: {lastSaved.toLocaleTimeString()}
                    </span>
                  )}
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-xs text-blue-600 font-medium">Model</p>
                  <p className="text-sm font-bold text-blue-900 truncate">{config.model}</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-3">
                  <p className="text-xs text-purple-600 font-medium">Voice</p>
                  <p className="text-sm font-bold text-purple-900 capitalize">{config.voice}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3">
                  <p className="text-xs text-green-600 font-medium">Temperature</p>
                  <p className="text-sm font-bold text-green-900">{config.temperature}</p>
                </div>
                <div className="bg-orange-50 rounded-lg p-3">
                  <p className="text-xs text-orange-600 font-medium">Tools</p>
                  <p className="text-sm font-bold text-orange-900">{config.tools.length} active</p>
                </div>
              </div>

              {/* 2025 Features Status */}
              <div className="mt-4 flex flex-wrap gap-2">
                {config.enable_images && (
                  <Badge variant="secondary">
                    <Image className="h-3 w-3 mr-1" />
                    Image Input Enabled
                  </Badge>
                )}
                {config.enable_sip && (
                  <Badge variant="secondary">
                    <PhoneCall className="h-3 w-3 mr-1" />
                    SIP Support
                  </Badge>
                )}
                {config.enable_mcp && (
                  <Badge variant="secondary">
                    <Server className="h-3 w-3 mr-1" />
                    MCP Servers
                  </Badge>
                )}
                {config.turnDetection.type === 'semantic_vad' && (
                  <Badge variant="secondary">
                    <Sparkles className="h-3 w-3 mr-1" />
                    AI-Powered VAD
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Configuration Tabs */}
          <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-blue-100">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-blue-600" />
                Call Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="instructions" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="instructions">Instructions</TabsTrigger>
                  <TabsTrigger value="voice">Voice & Model</TabsTrigger>
                  <TabsTrigger value="tools">Tools</TabsTrigger>
                  <TabsTrigger value="features">2025 Features</TabsTrigger>
                  <TabsTrigger value="advanced">Advanced</TabsTrigger>
                </TabsList>

                <TabsContent value="instructions" className="space-y-4 mt-6">
                  <div>
                    <Label htmlFor="name">Configuration Name</Label>
                    <Input
                      id="name"
                      value={config.name}
                      onChange={(e) => updateConfig({ name: e.target.value })}
                      placeholder="e.g., Customer Service Configuration"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label htmlFor="instructions">System Instructions</Label>
                      <div className="flex gap-2 flex-wrap">
                        {instructionTemplates.map((template) => (
                          <Button
                            key={template.name}
                            variant={selectedTemplate === template.name ? "default" : "outline"}
                            size="sm"
                            onClick={() => applyTemplate(template)}
                            className="text-xs"
                          >
                            {template.name}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <Textarea
                      id="instructions"
                      value={config.instructions}
                      onChange={(e) => updateConfig({ instructions: e.target.value })}
                      placeholder="Enter instructions for how the AI should behave during calls..."
                      rows={12}
                      className="mt-1 font-mono text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      These instructions define the AI's personality, behavior, and guidelines for handling calls
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="voice" className="space-y-6 mt-6">
                  <div>
                    <Label htmlFor="voice">Voice Selection</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                      {voiceOptions.map((voice) => (
                        <div
                          key={voice.value}
                          className={`border rounded-lg p-3 cursor-pointer transition-all ${
                            config.voice === voice.value
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => updateConfig({ voice: voice.value })}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{voice.label}</p>
                                {voice.new && (
                                  <Badge variant="default" className="text-xs bg-gradient-to-r from-blue-600 to-purple-600">
                                    NEW 2025
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-gray-600">{voice.description}</p>
                            </div>
                            {config.voice === voice.value && (
                              <CheckCircle2 className="h-5 w-5 text-blue-500" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="model">AI Model</Label>
                    <Select
                      value={config.model}
                      onValueChange={(value) => updateConfig({ model: value })}
                    >
                      <SelectTrigger id="model" className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gpt-realtime">
                          <div>
                            <div className="font-medium">GPT-Realtime</div>
                            <div className="text-xs text-gray-500">Latest 2025 model - Best performance</div>
                          </div>
                        </SelectItem>
                        <SelectItem value="gpt-4o-realtime-preview">
                          <div>
                            <div className="font-medium">GPT-4o Realtime Preview</div>
                            <div className="text-xs text-gray-500">December 2024 version</div>
                          </div>
                        </SelectItem>
                        <SelectItem value="gpt-4o-mini-realtime-preview">
                          <div>
                            <div className="font-medium">GPT-4o Mini Realtime</div>
                            <div className="text-xs text-gray-500">Faster, lower cost option</div>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="temperature">
                      Temperature: {config.temperature}
                      <span className="text-xs text-gray-500 ml-2">
                        (Higher = more creative, Lower = more focused)
                      </span>
                    </Label>
                    <Slider
                      id="temperature"
                      min={0}
                      max={1}
                      step={0.1}
                      value={[config.temperature]}
                      onValueChange={([value]) => updateConfig({ temperature: value })}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="maxTokens">
                      Max Response Length: {config.maxTokens} tokens
                    </Label>
                    <Slider
                      id="maxTokens"
                      min={128}
                      max={4096}
                      step={128}
                      value={[config.maxTokens]}
                      onValueChange={([value]) => updateConfig({ maxTokens: value })}
                      className="mt-2"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="tools" className="space-y-4 mt-6">
                  <div>
                    <Label>Available Tools</Label>
                    <p className="text-sm text-gray-600 mb-4">
                      Enable tools that the AI can use during calls
                    </p>
                    <div className="space-y-3">
                      {defaultTools.map((tool) => {
                        const isEnabled = config.tools.some(t => t.name === tool.name);
                        return (
                          <div
                            key={tool.name}
                            className={`border rounded-lg p-4 cursor-pointer transition-all ${
                              isEnabled
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => toggleTool(tool)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <Code className="h-4 w-4 text-blue-600" />
                                  <p className="font-medium">{tool.name}</p>
                                  <Badge variant={isEnabled ? "default" : "secondary"} className="text-xs">
                                    {isEnabled ? 'Enabled' : 'Disabled'}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-600 mt-1">{tool.description}</p>
                              </div>
                              <Switch
                                checked={isEnabled}
                                onCheckedChange={() => toggleTool(tool)}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="features" className="space-y-4 mt-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">2025 Realtime API Features</h3>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <div className="flex items-center gap-2">
                            <Image className="h-4 w-4 text-blue-600" />
                            <Label>Image Input Support</Label>
                            <Badge variant="outline" className="text-xs">NEW</Badge>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            Allow AI to see and understand images during calls
                          </p>
                        </div>
                        <Switch
                          checked={config.enable_images || false}
                          onCheckedChange={(checked) => updateConfig({ enable_images: checked })}
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <div className="flex items-center gap-2">
                            <PhoneCall className="h-4 w-4 text-blue-600" />
                            <Label>SIP Phone Integration</Label>
                            <Badge variant="outline" className="text-xs">NEW</Badge>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            Connect with traditional phone systems and PBXs
                          </p>
                        </div>
                        <Switch
                          checked={config.enable_sip || false}
                          onCheckedChange={(checked) => updateConfig({ enable_sip: checked })}
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <div className="flex items-center gap-2">
                            <Server className="h-4 w-4 text-blue-600" />
                            <Label>MCP Server Support</Label>
                            <Badge variant="outline" className="text-xs">NEW</Badge>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            Connect remote MCP servers for extended capabilities
                          </p>
                        </div>
                        <Switch
                          checked={config.enable_mcp || false}
                          onCheckedChange={(checked) => updateConfig({ enable_mcp: checked })}
                        />
                      </div>
                    </div>

                    <div className="mt-6">
                      <Label>Response Mode</Label>
                      <Select
                        value={config.response_mode || 'streaming'}
                        onValueChange={(value: 'blocking' | 'streaming') => updateConfig({ response_mode: value })}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="streaming">
                            <div>
                              <div className="font-medium">Streaming</div>
                              <div className="text-xs text-gray-500">Real-time response generation</div>
                            </div>
                          </SelectItem>
                          <SelectItem value="blocking">
                            <div>
                              <div className="font-medium">Blocking</div>
                              <div className="text-xs text-gray-500">Wait for complete response</div>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="mt-6">
                      <Label>Modalities</Label>
                      <p className="text-sm text-gray-600 mb-2">Select which input/output modes to enable</p>
                      <div className="flex gap-2">
                        <Badge
                          variant={config.modalities?.includes('text') ? 'default' : 'outline'}
                          className="cursor-pointer"
                          onClick={() => {
                            const newModalities = config.modalities?.includes('text')
                              ? config.modalities.filter(m => m !== 'text')
                              : [...(config.modalities || []), 'text'];
                            updateConfig({ modalities: newModalities });
                          }}
                        >
                          Text
                        </Badge>
                        <Badge
                          variant={config.modalities?.includes('audio') ? 'default' : 'outline'}
                          className="cursor-pointer"
                          onClick={() => {
                            const newModalities = config.modalities?.includes('audio')
                              ? config.modalities.filter(m => m !== 'audio')
                              : [...(config.modalities || []), 'audio'];
                            updateConfig({ modalities: newModalities });
                          }}
                        >
                          Audio
                        </Badge>
                        <Badge
                          variant={config.modalities?.includes('image') ? 'default' : 'outline'}
                          className="cursor-pointer"
                          onClick={() => {
                            const newModalities = config.modalities?.includes('image')
                              ? config.modalities.filter(m => m !== 'image')
                              : [...(config.modalities || []), 'image'];
                            updateConfig({ modalities: newModalities });
                          }}
                        >
                          Image
                        </Badge>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="advanced" className="space-y-4 mt-6">
                  <div>
                    <Label htmlFor="vad">Voice Activity Detection (VAD)</Label>
                    <Select
                      value={config.turnDetection.type}
                      onValueChange={(value: 'server_vad' | 'semantic_vad' | 'none') =>
                        updateConfig({
                          turnDetection: { ...config.turnDetection, type: value }
                        })
                      }
                    >
                      <SelectTrigger id="vad" className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="server_vad">
                          <div>
                            <div className="font-medium">Server VAD</div>
                            <div className="text-xs text-gray-500">Silence-based detection</div>
                          </div>
                        </SelectItem>
                        <SelectItem value="semantic_vad">
                          <div>
                            <div className="font-medium flex items-center gap-1">
                              Semantic VAD
                              <Badge variant="default" className="text-xs ml-1">NEW</Badge>
                            </div>
                            <div className="text-xs text-gray-500">AI-powered utterance detection</div>
                          </div>
                        </SelectItem>
                        <SelectItem value="none">
                          <div>
                            <div className="font-medium">None</div>
                            <div className="text-xs text-gray-500">Manual control</div>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {(config.turnDetection.type === 'server_vad' || config.turnDetection.type === 'semantic_vad') && (
                    <>
                      <div>
                        <Label htmlFor="threshold">
                          VAD Threshold: {config.turnDetection.threshold}
                        </Label>
                        <Slider
                          id="threshold"
                          min={0}
                          max={1}
                          step={0.1}
                          value={[config.turnDetection.threshold || 0.5]}
                          onValueChange={([value]) =>
                            updateConfig({
                              turnDetection: { ...config.turnDetection, threshold: value }
                            })
                          }
                          className="mt-2"
                        />
                      </div>

                      <div>
                        <Label htmlFor="silence">
                          Silence Duration: {config.turnDetection.silence_duration_ms}ms
                        </Label>
                        <Slider
                          id="silence"
                          min={200}
                          max={2000}
                          step={100}
                          value={[config.turnDetection.silence_duration_ms || 500]}
                          onValueChange={([value]) =>
                            updateConfig({
                              turnDetection: { ...config.turnDetection, silence_duration_ms: value }
                            })
                          }
                          className="mt-2"
                        />
                      </div>

                      <div>
                        <Label htmlFor="padding">
                          Prefix Padding: {config.turnDetection.prefix_padding_ms}ms
                        </Label>
                        <Slider
                          id="padding"
                          min={0}
                          max={1000}
                          step={50}
                          value={[config.turnDetection.prefix_padding_ms || 300]}
                          onValueChange={([value]) =>
                            updateConfig({
                              turnDetection: { ...config.turnDetection, prefix_padding_ms: value }
                            })
                          }
                          className="mt-2"
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <Label>Auto-create Response</Label>
                          <p className="text-sm text-gray-600">
                            Automatically generate response after detecting end of speech
                          </p>
                        </div>
                        <Switch
                          checked={config.turnDetection.create_response || false}
                          onCheckedChange={(checked) =>
                            updateConfig({
                              turnDetection: { ...config.turnDetection, create_response: checked }
                            })
                          }
                        />
                      </div>
                    </>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="inputFormat">Input Audio Format</Label>
                      <Select
                        value={config.inputAudioFormat}
                        onValueChange={(value) => updateConfig({ inputAudioFormat: value })}
                      >
                        <SelectTrigger id="inputFormat" className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pcm16">PCM16 (16-bit)</SelectItem>
                          <SelectItem value="g711_ulaw">G.711 µ-law</SelectItem>
                          <SelectItem value="g711_alaw">G.711 A-law</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="outputFormat">Output Audio Format</Label>
                      <Select
                        value={config.outputAudioFormat}
                        onValueChange={(value) => updateConfig({ outputAudioFormat: value })}
                      >
                        <SelectTrigger id="outputFormat" className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pcm16">PCM16 (16-bit)</SelectItem>
                          <SelectItem value="g711_ulaw">G.711 µ-law</SelectItem>
                          <SelectItem value="g711_alaw">G.711 A-law</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label>Input Audio Transcription</Label>
                      <p className="text-sm text-gray-600">
                        Transcribe incoming audio for logging
                      </p>
                    </div>
                    <Switch
                      checked={config.inputAudioTranscription?.enabled || false}
                      onCheckedChange={(checked) =>
                        updateConfig({
                          inputAudioTranscription: {
                            ...config.inputAudioTranscription,
                            enabled: checked,
                            model: 'whisper-1'
                          }
                        })
                      }
                    />
                  </div>

                  <div className="border-t pt-4">
                    <Label>Import/Export Configuration</Label>
                    <div className="flex gap-2 mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={exportConfig}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Export
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('import-config')?.click()}
                      >
                        <Upload className="h-4 w-4 mr-1" />
                        Import
                      </Button>
                      <input
                        id="import-config"
                        type="file"
                        accept=".json"
                        className="hidden"
                        onChange={importConfig}
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="bg-blue-50/50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <AlertCircle className="h-5 w-5" />
                September 2025 Updates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span><strong>New Voices:</strong> Cedar and Marin are now available exclusively in the Realtime API</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span><strong>GPT-Realtime Model:</strong> 66.5% accuracy on function calling (vs 49.7% previous)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span><strong>Image Input:</strong> Ground conversations in visual context</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span><strong>SIP Support:</strong> Integrate with existing telephony systems</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span><strong>MCP Servers:</strong> Connect remote servers for extended capabilities</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span><strong>Semantic VAD:</strong> AI-powered utterance detection for better turn-taking</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span><strong>20% Cost Reduction:</strong> $32/1M input tokens, $64/1M output tokens</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}