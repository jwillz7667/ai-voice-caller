"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";

export default function SettingsPage() {
  const [recordCalls, setRecordCalls] = useState(false);
  const [recordingType, setRecordingType] = useState("record-from-answer-dual");
  const [isSaving, setIsSaving] = useState(false);

  // Load settings on initial mount
  useEffect(() => {
    // Load settings from localStorage as fallback
    const savedRecordCalls = localStorage.getItem("recordCalls");
    const savedRecordingType = localStorage.getItem("recordingType");
    
    if (savedRecordCalls) {
      setRecordCalls(JSON.parse(savedRecordCalls));
    }
    
    if (savedRecordingType) {
      setRecordingType(savedRecordingType);
    }
  }, []);

  // Save configuration to backend
  const saveConfigToBackend = async (config: any) => {
    setIsSaving(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8081'}/config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save configuration');
      }
      
      toast({
        title: "Settings updated",
        description: "Your recording preferences have been saved",
      });
    } catch (error) {
      console.error('Error saving configuration:', error);
      toast({
        title: "Error saving settings",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRecordingToggle = (checked: boolean) => {
    setRecordCalls(checked);
    localStorage.setItem("recordCalls", JSON.stringify(checked));
    
    // Save to backend
    saveConfigToBackend({
      recordCall: checked,
      recordingType
    });
  };

  const handleRecordingTypeChange = (value: string) => {
    setRecordingType(value);
    localStorage.setItem("recordingType", value);
    
    // Save to backend
    saveConfigToBackend({
      recordCall: recordCalls,
      recordingType: value
    });
  };

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-gray-500 text-sm">
          Configure application settings and preferences
        </p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Call Recording</CardTitle>
            <CardDescription>
              Configure call recording preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="recording-toggle" className="font-medium">Record Calls</Label>
                <p className="text-sm text-gray-500">Enable to record all calls</p>
              </div>
              <Switch 
                id="recording-toggle" 
                checked={recordCalls} 
                onCheckedChange={handleRecordingToggle}
                disabled={isSaving}
              />
            </div>
            
            {recordCalls && (
              <div className="space-y-2">
                <Label htmlFor="recording-type">Recording Type</Label>
                <Select 
                  value={recordingType} 
                  onValueChange={handleRecordingTypeChange}
                  disabled={isSaving}
                >
                  <SelectTrigger id="recording-type">
                    <SelectValue placeholder="Select recording type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="record-from-answer-dual">Dual Channel (from answer)</SelectItem>
                    <SelectItem value="record-from-ringing-dual">Dual Channel (from ringing)</SelectItem>
                    <SelectItem value="record-from-answer">Mono (from answer)</SelectItem>
                    <SelectItem value="record-from-ringing">Mono (from ringing)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  Dual channel recordings separate caller and callee into different audio channels.
                  Recording from ringing captures the entire call including ringing, while recording 
                  from answer only begins when the call is answered.
                </p>
              </div>
            )}
            
            {recordCalls && (
              <div>
                <p className="text-sm text-amber-600">
                  <strong>Important:</strong> Recording calls may require consent from all parties 
                  depending on your jurisdiction. Make sure you comply with applicable laws.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Audio Settings</CardTitle>
            <CardDescription>
              Configure voice and audio settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              Settings options will be added here.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Account Settings</CardTitle>
            <CardDescription>
              Manage your account and profile
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              Account options will be added here.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>API Configuration</CardTitle>
            <CardDescription>
              Configure API keys and services
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              API configuration options will be added here.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Notification Preferences</CardTitle>
            <CardDescription>
              Manage notification settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              Notification options will be added here.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
