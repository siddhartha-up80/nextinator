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
import { Settings, ChevronDown } from "lucide-react";
import { useToast } from "@/components/ui/toast";

interface SettingsDialogProps {
  onSettingsChange?: (settings: ChatSettings) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export interface ChatSettings {
  responseType: "very short" | "short" | "medium" | "detailed";
}

const responseTypeOptions = [
  { value: "very short", label: "Very Short" },
  { value: "short", label: "Short" },
  { value: "medium", label: "Medium" },
  { value: "detailed", label: "Detailed" },
] as const;

export default function SettingsDialog({
  onSettingsChange,
  open,
  onOpenChange,
}: SettingsDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<ChatSettings>({
    responseType: "medium", // Default value
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
        setSettings(parsedSettings);
        onSettingsChange?.(parsedSettings);
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

          {/* Placeholder for future settings */}
          <div className="grid gap-2">
            <label className="text-sm font-medium leading-none text-muted-foreground">
              More Settings Coming Soon
            </label>
            <p className="text-sm text-muted-foreground">
              Additional customization options will be available here in future
              updates.
            </p>
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
  });

  useEffect(() => {
    // Load initial settings
    const loadSettings = () => {
      const savedSettings = localStorage.getItem("aiChatSettings");
      if (savedSettings) {
        try {
          setSettings(JSON.parse(savedSettings));
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
          setSettings(JSON.parse(e.newValue));
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
