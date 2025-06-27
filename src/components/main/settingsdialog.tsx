"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Settings, ChevronDown, RotateCcw } from "lucide-react";
import { useToast } from "@/components/ui/toast";

interface SettingsDialogProps {
  onSettingsChange?: (settings: ChatSettings) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export interface ChatSettings {
  responseType: "very short" | "short" | "medium" | "detailed";
  customPrompt?: string;
}

const responseTypeOptions = [
  { value: "very short", label: "Very Short" },
  { value: "short", label: "Short" },
  { value: "medium", label: "Medium" },
  { value: "detailed", label: "Detailed" },
] as const;

const DEFAULT_SYSTEM_PROMPT =
  "You are an intelligent custom data assistant powered by Google Gemini. " +
  "Answer the user's questions based on their existing custom data. " +
  "Use simple, conversational language that's easy to understand. " +
  "If there's no relevant information in the notes or if the notes are empty, " +
  "you can respond with your general knowledge.";

export default function SettingsDialog({
  onSettingsChange,
  open,
  onOpenChange,
}: SettingsDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<ChatSettings>({
    responseType: "detailed", // Default value
    customPrompt: DEFAULT_SYSTEM_PROMPT,
  });
  const { showToast } = useToast();

  // Use external open state if provided, otherwise use internal state
  const dialogOpen = open !== undefined ? open : isOpen;
  const setDialogOpen = onOpenChange || setIsOpen;

  // Load settings from localStorage on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem("aiChatSettings");
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        // Ensure customPrompt has a default value if not present
        const settingsWithDefaults = {
          ...parsedSettings,
          customPrompt: parsedSettings.customPrompt || DEFAULT_SYSTEM_PROMPT,
        };
        setSettings(settingsWithDefaults);
        onSettingsChange?.(settingsWithDefaults);
      } catch (error) {
        console.error("Failed to load settings:", error);
      }
    } else {
      // Set default settings
      onSettingsChange?.(settings);
    }
  }, []);
  const updateSettings = (newSettings: Partial<ChatSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);

    // Save to localStorage
    localStorage.setItem("aiChatSettings", JSON.stringify(updatedSettings));

    // Dispatch custom event for same-tab updates
    const event = new CustomEvent("chatSettingsUpdated", {
      detail: updatedSettings,
    });
    window.dispatchEvent(event);

    // Notify parent component
    onSettingsChange?.(updatedSettings);

    showToast("Settings updated successfully", "success");
  };

  const handleResponseTypeChange = (
    responseType: ChatSettings["responseType"]
  ) => {
    updateSettings({ responseType });
  };

  const handleCustomPromptChange = (customPrompt: string) => {
    updateSettings({ customPrompt });
  };

  const handleResetPrompt = () => {
    updateSettings({ customPrompt: DEFAULT_SYSTEM_PROMPT });
    showToast("Prompt reset to default", "success");
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Settings className="w-4 h-4" />
          <span className="hidden sm:inline">Settings</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>AI Chat Settings</DialogTitle>
          <DialogDescription>
            Customize your AI chat experience with these settings.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Response Type Setting */}
          <div className="grid gap-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              AI Response Type
            </label>
            <p className="text-sm text-muted-foreground">
              Choose how detailed you want the AI responses to be.
            </p>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  {
                    responseTypeOptions.find(
                      (option) => option.value === settings.responseType
                    )?.label
                  }
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-full">
                {responseTypeOptions.map((option) => (
                  <DropdownMenuItem
                    key={option.value}
                    onClick={() => handleResponseTypeChange(option.value)}
                    className={
                      settings.responseType === option.value ? "bg-accent" : ""
                    }
                  >
                    {option.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Custom Prompt Setting */}
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Custom AI Prompt
              </label>
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetPrompt}
                className="h-8 px-2"
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                Reset
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Customize how the AI behaves and responds to your questions.
            </p>
            <Textarea
              value={settings.customPrompt || DEFAULT_SYSTEM_PROMPT}
              onChange={(e) => handleCustomPromptChange(e.target.value)}
              placeholder="Enter your custom AI prompt..."
              className="min-h-[120px] resize-none"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Hook to get current settings
export function useChatSettings() {
  const [settings, setSettings] = useState<ChatSettings>({
    responseType: "medium",
    customPrompt: DEFAULT_SYSTEM_PROMPT,
  });

  useEffect(() => {
    // Load initial settings
    const loadSettings = () => {
      const savedSettings = localStorage.getItem("aiChatSettings");
      if (savedSettings) {
        try {
          const parsedSettings = JSON.parse(savedSettings);
          // Ensure customPrompt has a default value if not present
          const settingsWithDefaults = {
            ...parsedSettings,
            customPrompt: parsedSettings.customPrompt || DEFAULT_SYSTEM_PROMPT,
          };
          setSettings(settingsWithDefaults);
        } catch (error) {
          console.error("Failed to load settings:", error);
        }
      }
    };

    loadSettings();

    // Listen for localStorage changes (when settings are updated in other components)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "aiChatSettings" && e.newValue) {
        try {
          const parsedSettings = JSON.parse(e.newValue);
          const settingsWithDefaults = {
            ...parsedSettings,
            customPrompt: parsedSettings.customPrompt || DEFAULT_SYSTEM_PROMPT,
          };
          setSettings(settingsWithDefaults);
        } catch (error) {
          console.error("Failed to parse updated settings:", error);
        }
      }
    };

    // Listen for custom event for same-tab updates
    const handleSettingsUpdate = (e: CustomEvent<ChatSettings>) => {
      setSettings(e.detail);
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener(
      "chatSettingsUpdated",
      handleSettingsUpdate as EventListener
    );

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(
        "chatSettingsUpdated",
        handleSettingsUpdate as EventListener
      );
    };
  }, []);

  return settings;
}
