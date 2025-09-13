"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Save, 
  Settings2, 
  Trash2, 
  Plus,
  Clock,
  Hash,
  Loader2
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "react-hot-toast";

interface SavedConfig {
  id: string;
  name: string;
  description?: string;
  configuration: any;
  usageCount: number;
  lastUsedAt?: string;
  createdAt: string;
}

interface SavedConfigsPanelProps {
  currentConfig?: any;
  onLoadConfiguration?: (config: any) => void;
}

const SavedConfigsPanel: React.FC<SavedConfigsPanelProps> = ({ 
  currentConfig, 
  onLoadConfiguration 
}) => {
  const [savedConfigs, setSavedConfigs] = useState<SavedConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<string | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [configName, setConfigName] = useState("");
  const [configDescription, setConfigDescription] = useState("");

  useEffect(() => {
    fetchSavedConfigs();
  }, []);

  const fetchSavedConfigs = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/saved-configs");
      if (response.ok) {
        const data = await response.json();
        setSavedConfigs(data);
      }
    } catch (error) {
      console.error("Error fetching saved configs:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveCurrentConfig = async () => {
    if (!configName.trim()) {
      toast.error("Please enter a name for the configuration");
      return;
    }

    try {
      setSaving(true);
      const response = await fetch("/api/saved-configs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: configName,
          description: configDescription,
          configuration: currentConfig
        }),
      });

      if (response.ok) {
        toast.success("Configuration saved successfully");
        setShowSaveDialog(false);
        setConfigName("");
        setConfigDescription("");
        fetchSavedConfigs();
      } else {
        toast.error("Failed to save configuration");
      }
    } catch (error) {
      console.error("Error saving configuration:", error);
      toast.error("Failed to save configuration");
    } finally {
      setSaving(false);
    }
  };

  const deleteConfig = async (id: string) => {
    if (!confirm("Are you sure you want to delete this configuration?")) {
      return;
    }

    try {
      const response = await fetch(`/api/saved-configs?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Configuration deleted");
        setSavedConfigs(configs => configs.filter(c => c.id !== id));
      } else {
        toast.error("Failed to delete configuration");
      }
    } catch (error) {
      console.error("Error deleting configuration:", error);
      toast.error("Failed to delete configuration");
    }
  };

  const updateUsageCount = async (id: string) => {
    try {
      await fetch(`/api/saved-configs/${id}/use`, { method: "POST" });
    } catch (error) {
      console.error("Error updating usage count:", error);
    }
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Settings2 className="h-4 w-4" />
            Saved Configurations
          </CardTitle>
          <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="h-7">
                <Plus className="h-3 w-3 mr-1" />
                Save Current
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Save Configuration</DialogTitle>
                <DialogDescription>
                  Save your current configuration for future use
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <label htmlFor="name" className="text-sm font-medium">
                    Configuration Name
                  </label>
                  <Input
                    id="name"
                    value={configName}
                    onChange={(e) => setConfigName(e.target.value)}
                    placeholder="e.g., Customer Support Bot"
                  />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="description" className="text-sm font-medium">
                    Description (optional)
                  </label>
                  <Textarea
                    id="description"
                    value={configDescription}
                    onChange={(e) => setConfigDescription(e.target.value)}
                    placeholder="Describe what this configuration is for..."
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button 
                  onClick={saveCurrentConfig} 
                  disabled={saving || !configName.trim()}
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Configuration
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : savedConfigs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <Settings2 className="h-12 w-12 text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">No saved configurations</p>
            <p className="text-xs text-gray-400 mt-1">Save your current config to reuse it later</p>
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div className="p-3 space-y-2">
              {savedConfigs.map((config) => (
                <div
                  key={config.id}
                  className={`p-3 rounded-lg border transition-all ${
                    selectedConfig === config.id 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-1">
                      <div className="font-medium text-sm">{config.name}</div>
                      {config.description && (
                        <p className="text-xs text-gray-500 line-clamp-2">
                          {config.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Hash className="h-3 w-3" />
                          Used {config.usageCount} times
                        </span>
                        {config.lastUsedAt && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(config.lastUsedAt), { addSuffix: true })}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        onClick={() => {
                          if (onLoadConfiguration) {
                            onLoadConfiguration(config.configuration);
                            updateUsageCount(config.id);
                            toast.success(`Loaded "${config.name}"`);
                          }
                        }}
                      >
                        <Settings2 className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-red-500 hover:text-red-600"
                        onClick={() => deleteConfig(config.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default SavedConfigsPanel;