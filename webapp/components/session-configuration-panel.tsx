import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash, Check, AlertCircle } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toolTemplates } from "@/lib/tool-templates";
import { ToolConfigurationDialog } from "./tool-configuration-dialog";
import { BackendTag } from "./backend-tag";
import { useBackendTools } from "@/lib/use-backend-tools";
import { useBackendVoices } from "@/lib/use-backend-voices";

interface SessionConfiguration {
  instructions: string;
  voice: string;
  model: string;
  prompt?: { id: string; version?: string };
  tools: string[];
  record_call: boolean;
  turn_detection: {
    type: 'server_vad' | 'semantic_vad' | 'none';
    threshold?: number;
    prefix_padding_ms?: number;
    silence_duration_ms?: number;
  };
  temperature: number;
  input_audio_transcription: {
    model: 'whisper-1' | 'gpt-4o-transcribe' | 'gpt-4o-mini-transcribe';
  };
  // Note: legacy/unsupported fields removed to mirror Realtime spec
}

interface SessionConfigurationPanelProps {
  callStatus: string;
  onSave: (config: SessionConfiguration) => void;
}

const SessionConfigurationPanel: React.FC<SessionConfigurationPanelProps> = ({
  callStatus,
  onSave,
}) => {
  const [instructions, setInstructions] = useState(
    "You are a helpful assistant in a phone call."
  );
  const [voice, setVoice] = useState("ash");
  const [customVoice, setCustomVoice] = useState("");
  const [model, setModel] = useState<string>("gpt-realtime");
  const [customModel, setCustomModel] = useState("");
  const [promptId, setPromptId] = useState<string>("");
  const [promptVersion, setPromptVersion] = useState<string>("");
  const [tools, setTools] = useState<string[]>([]);
  const [recordCall, setRecordCall] = useState(false);
  const [vadType, setVadType] = useState<'server_vad' | 'semantic_vad' | 'none'>('server_vad');
  const [temperature, setTemperature] = useState(0.8);
  const [transcriptionModel, setTranscriptionModel] = useState<'whisper-1' | 'gpt-4o-transcribe' | 'gpt-4o-mini-transcribe'>('whisper-1');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingSchemaStr, setEditingSchemaStr] = useState("");
  const [isJsonValid, setIsJsonValid] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Removed legacy UI controls: noise reduction, penalties, audio sample rate/channels

  // Custom hooks: fetch backend tools and voices
  const backendTools = useBackendTools("http://localhost:8081/tools", 3000);
  const backendVoices = useBackendVoices("http://localhost:8081/voices", 60000);

  // Merge default and backend-provided voices
  const defaultVoices = ["alloy","ash","ballad","cedar","coral","echo","marin","sage","shimmer","verse"];
  const mergedVoices = Array.from(new Set([...(backendVoices || []), ...defaultVoices]));
  // Ensure current selection remains selectable even if not in the list
  if (voice && !mergedVoices.includes(voice) && voice !== "__custom__") {
    mergedVoices.unshift(voice);
  }

  // Track changes to determine if there are unsaved modifications
  useEffect(() => {
    setHasUnsavedChanges(true);
  }, [instructions, voice, tools, recordCall, vadType, temperature, transcriptionModel, model,
      promptId, promptVersion]);

  // Reset save status after a delay when saved
  useEffect(() => {
    if (saveStatus === "saved") {
      const timer = setTimeout(() => {
        setSaveStatus("idle");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [saveStatus]);

  const handleSave = async () => {
    setSaveStatus("saving");
    try {
      const config: SessionConfiguration = {
        instructions,
        voice,
        model,
        ...(promptId.trim() && { prompt: { id: promptId.trim(), ...(promptVersion.trim() && { version: promptVersion.trim() }) } }),
        tools: tools.map((tool) => JSON.parse(tool)),
        recordCall,
        turn_detection: {
          type: vadType,
          ...(vadType === 'server_vad' && {
            threshold: 0.5,
            prefix_padding_ms: 300,
            silence_duration_ms: 500
          })
        },
        temperature,
        input_audio_transcription: {
          model: transcriptionModel
        }
      };

      // Legacy/unsupported configuration removed to mirror Realtime spec

      await onSave(config);
      setSaveStatus("saved");
      setHasUnsavedChanges(false);
    } catch (error) {
      setSaveStatus("error");
    }
  };

  const handleAddTool = () => {
    setEditingIndex(null);
    setEditingSchemaStr("");
    setSelectedTemplate("");
    setIsJsonValid(true);
    setOpenDialog(true);
  };

  const handleEditTool = (index: number) => {
    setEditingIndex(index);
    setEditingSchemaStr(tools[index] || "");
    setSelectedTemplate("");
    setIsJsonValid(true);
    setOpenDialog(true);
  };

  const handleDeleteTool = (index: number) => {
    const newTools = [...tools];
    newTools.splice(index, 1);
    setTools(newTools);
  };

  const handleDialogSave = () => {
    try {
      JSON.parse(editingSchemaStr);
    } catch (parseError) {
      console.error("Invalid JSON:", parseError);
      return;
    }
    const newTools = [...tools];
    if (editingIndex === null) {
      newTools.push(editingSchemaStr);
    } else {
      newTools[editingIndex] = editingSchemaStr;
    }
    setTools(newTools);
    setOpenDialog(false);
  };

  const handleTemplateChange = (val: string) => {
    setSelectedTemplate(val);

    // Determine if the selected template is from local or backend
    const templateObj =
      toolTemplates.find((t) => t.name === val) ||
      backendTools.find((t: { name: string }) => t.name === val);

    if (templateObj) {
      setEditingSchemaStr(JSON.stringify(templateObj, null, 2));
      setIsJsonValid(true);
    }
  };

  const onSchemaChange = (value: string) => {
    setEditingSchemaStr(value);
    try {
      JSON.parse(value);
      setIsJsonValid(true);
    } catch {
      setIsJsonValid(false);
    }
  };

  const getToolNameFromSchema = (schema: string): string => {
    try {
      const parsed = JSON.parse(schema);
      return parsed?.name || "Untitled Tool";
    } catch {
      return "Invalid JSON";
    }
  };

  const isBackendTool = (name: string): boolean => {
    return backendTools.some((t: { name: string }) => t.name === name);
  };

  return (
    <Card className="flex flex-col h-full w-full mx-auto overflow-hidden">
      <CardHeader className="pb-0 px-4 sm:px-6 flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">
            Session Configuration
          </CardTitle>
          <div className="flex items-center gap-2">
            {saveStatus === "error" ? (
              <span className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Save failed
              </span>
            ) : hasUnsavedChanges ? (
              <span className="text-xs text-muted-foreground">Not saved</span>
            ) : (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Check className="h-3 w-3" />
                Saved
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-3 sm:p-5 overflow-hidden min-h-0">
        <ScrollArea className="h-full pr-4">
          <div className="space-y-4 sm:space-y-6 pb-4">
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">
                Instructions
              </label>
              <Textarea
                placeholder="Enter instructions"
                className="min-h-[100px] resize-none"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">OpenAI Prompt ID</label>
                <input
                  type="text"
                  placeholder="pmpt_..."
                  className="w-full border rounded px-2 py-1 text-sm"
                  value={promptId}
                  onChange={(e) => setPromptId(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Optional: use a saved Prompt (pmpt_*)</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">Prompt Version</label>
                <input
                  type="text"
                  placeholder="e.g., 1"
                  className="w-full border rounded px-2 py-1 text-sm"
                  value={promptVersion}
                  onChange={(e) => setPromptVersion(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Optional: omit to use latest</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">Realtime Model</label>
              <Select value={model} onValueChange={(v: string) => setModel(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-realtime">gpt-realtime</SelectItem>
                  <SelectItem value="__custom__">Other (custom)</SelectItem>
                </SelectContent>
              </Select>
              {model === "__custom__" && (
                <input
                  type="text"
                  placeholder="Enter custom model (e.g., gpt-realtime-2025-xx)"
                  className="mt-2 w-full border rounded px-2 py-1 text-sm"
                  value={customModel}
                  onChange={(e) => setCustomModel(e.target.value)}
                  onBlur={() => {
                    if (customModel.trim()) setModel(customModel.trim());
                  }}
                />
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">Voice</label>
              <Select value={voice} onValueChange={(v: string) => setVoice(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select voice" />
                </SelectTrigger>
                <SelectContent>
                  {mergedVoices.map((v) => (
                    <SelectItem key={v} value={v}>{v}</SelectItem>
                  ))}
                  <SelectItem value="__custom__">Other (custom)</SelectItem>
                </SelectContent>
              </Select>
              {voice === "__custom__" && (
                <input
                  type="text"
                  placeholder="Enter custom voice id (e.g., verse-v2)"
                  className="mt-2 w-full border rounded px-2 py-1 text-sm"
                  value={customVoice}
                  onChange={(e) => setCustomVoice(e.target.value)}
                  onBlur={() => {
                    if (customVoice.trim()) setVoice(customVoice.trim());
                  }}
                />
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">Voice Activity Detection</label>
              <Select value={vadType} onValueChange={(value: 'server_vad' | 'semantic_vad' | 'none') => setVadType(value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select VAD type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="server_vad">Server VAD (Default)</SelectItem>
                  <SelectItem value="semantic_vad">Semantic VAD (AI-based)</SelectItem>
                  <SelectItem value="none">None (Manual)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {vadType === 'semantic_vad' 
                  ? "AI detects when you've finished speaking based on context"
                  : vadType === 'server_vad' 
                  ? "Detects speech using silence thresholds"
                  : "Manual control over conversation turns"}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">
                Temperature ({temperature})
              </label>
              <div className="relative">
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider accent-red-500"
                  style={{
                    background: `linear-gradient(to right, #ef4444 0%, #ef4444 ${(temperature / 2) * 100}%, #e5e7eb ${(temperature / 2) * 100}%, #e5e7eb 100%)`
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Controls response randomness (0 = deterministic, 2 = very creative)
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">Transcription (ASR) Model</label>
              <Select value={transcriptionModel} onValueChange={(value: 'whisper-1' | 'gpt-4o-transcribe' | 'gpt-4o-mini-transcribe') => setTranscriptionModel(value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select transcription model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="whisper-1">Whisper-1 (Standard)</SelectItem>
                  <SelectItem value="gpt-4o-transcribe">GPT-4o Transcribe (Advanced)</SelectItem>
                  <SelectItem value="gpt-4o-mini-transcribe">GPT-4o Mini Transcribe (Fast)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Removed legacy/unsupported audio controls to mirror Realtime spec */}

            <div className="flex items-center space-x-2">
              <Switch
                id="record-call"
                checked={recordCall}
                onCheckedChange={setRecordCall}
              />
              <Label htmlFor="record-call" className="text-sm font-medium">
                Record Call
              </Label>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">Tools</label>
              <div className="space-y-2">
                {tools.map((tool, index) => {
                  const name = getToolNameFromSchema(tool);
                  const backend = isBackendTool(name);
                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-md border p-2 sm:p-3 gap-2"
                    >
                      <span className="text-sm truncate flex-1 min-w-0 flex items-center">
                        {name}
                        {backend && <BackendTag />}
                      </span>
                      <div className="flex gap-1 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditTool(index)}
                          className="h-8 w-8"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteTool(index)}
                          className="h-8 w-8"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleAddTool}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Tool
                </Button>
              </div>
            </div>

            <Button
              className="w-full mt-4"
              onClick={handleSave}
              disabled={saveStatus === "saving" || !hasUnsavedChanges}
            >
              {saveStatus === "saving" ? (
                "Saving..."
              ) : saveStatus === "saved" ? (
                <span className="flex items-center">
                  Saved Successfully
                  <Check className="ml-2 h-4 w-4" />
                </span>
              ) : saveStatus === "error" ? (
                "Error Saving"
              ) : (
                "Save Configuration"
              )}
            </Button>
          </div>
        </ScrollArea>
      </CardContent>

      <ToolConfigurationDialog
        open={openDialog}
        onOpenChange={setOpenDialog}
        editingIndex={editingIndex}
        selectedTemplate={selectedTemplate}
        editingSchemaStr={editingSchemaStr}
        isJsonValid={isJsonValid}
        onTemplateChange={handleTemplateChange}
        onSchemaChange={onSchemaChange}
        onSave={handleDialogSave}
        backendTools={backendTools as Array<{ name: string; schema?: unknown }>}
      />
    </Card>
  );
};

export default SessionConfigurationPanel;
