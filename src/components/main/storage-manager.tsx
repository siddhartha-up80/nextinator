"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import {
  HardDrive,
  Trash2,
  RefreshCw,
  AlertTriangle,
  Database,
  Clock,
  FileText,
} from "lucide-react";
import {
  getSharedChatStorageInfo,
  sharedChatStorage,
} from "@/lib/shared-chat-storage";

interface StorageStats {
  totalChats: number;
  totalSize: number;
  oldestChat: string | null;
  newestChat: string | null;
}

export function SharedChatStorageManager() {
  const [stats, setStats] = useState<StorageStats>({
    totalChats: 0,
    totalSize: 0,
    oldestChat: null,
    newestChat: null,
  });
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const refreshStats = () => {
    setStats(getSharedChatStorageInfo());
  };

  useEffect(() => {
    refreshStats();
  }, []);

  const clearAllStorage = async () => {
    if (
      window.confirm(
        "Are you sure you want to clear all cached shared chats? This cannot be undone."
      )
    ) {
      setLoading(true);
      try {
        sharedChatStorage.clearAllSharedChats();
        refreshStats();
        showToast("All shared chat cache cleared successfully", "success");
      } catch (error) {
        console.error("Failed to clear storage:", error);
        showToast("Failed to clear storage", "error");
      } finally {
        setLoading(false);
      }
    }
  };

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const getStorageUsageColor = (): string => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const percentage = (stats.totalSize / maxSize) * 100;

    if (percentage < 50) return "text-green-600";
    if (percentage < 80) return "text-yellow-600";
    return "text-red-600";
  };

  const getStorageUsagePercentage = (): number => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    return (stats.totalSize / maxSize) * 100;
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          Shared Chat Storage Manager
        </CardTitle>
        <CardDescription>
          Manage cached shared chat data stored in your browser
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Storage Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <FileText className="w-8 h-8 text-blue-500" />
            <div>
              <p className="text-sm text-muted-foreground">Total Chats</p>
              <p className="text-lg font-semibold">{stats.totalChats}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <HardDrive className={`w-8 h-8 ${getStorageUsageColor()}`} />
            <div>
              <p className="text-sm text-muted-foreground">Storage Used</p>
              <p className={`text-lg font-semibold ${getStorageUsageColor()}`}>
                {formatSize(stats.totalSize)}
              </p>
              <p className="text-xs text-muted-foreground">
                {getStorageUsagePercentage().toFixed(1)}% of 5MB limit
              </p>
            </div>
          </div>
        </div>

        {/* Storage Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Storage Usage</span>
            <span className={getStorageUsageColor()}>
              {getStorageUsagePercentage().toFixed(1)}%
            </span>
          </div>{" "}
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                getStorageUsagePercentage() < 50
                  ? "bg-green-500"
                  : getStorageUsagePercentage() < 80
                  ? "bg-yellow-500"
                  : "bg-red-500"
              } ${
                getStorageUsagePercentage() === 0
                  ? "w-0"
                  : getStorageUsagePercentage() < 25
                  ? "w-1/4"
                  : getStorageUsagePercentage() < 50
                  ? "w-1/2"
                  : getStorageUsagePercentage() < 75
                  ? "w-3/4"
                  : "w-full"
              }`}
            />
          </div>
        </div>

        {/* Chat Information */}
        {stats.totalChats > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Cache Information
            </h4>
            <div className="grid grid-cols-1 gap-2 text-sm">
              {stats.oldestChat && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Oldest Chat:</span>
                  <span className="font-medium truncate ml-2">
                    {stats.oldestChat}
                  </span>
                </div>
              )}
              {stats.newestChat && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Newest Chat:</span>
                  <span className="font-medium truncate ml-2">
                    {stats.newestChat}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Warning for high storage usage */}
        {getStorageUsagePercentage() > 80 && (
          <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-yellow-800 dark:text-yellow-200">
                High Storage Usage
              </p>
              <p className="text-yellow-700 dark:text-yellow-300">
                Consider clearing old cached chats to free up space. The system
                will automatically clean up old data when needed.
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={refreshStats}
            variant="outline"
            className="flex items-center gap-2"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh Stats
          </Button>

          <Button
            onClick={clearAllStorage}
            variant="destructive"
            className="flex items-center gap-2"
            disabled={loading || stats.totalChats === 0}
          >
            <Trash2 className="w-4 h-4" />
            Clear All Cache
          </Button>
        </div>

        {/* Usage Information */}
        <div className="text-xs text-muted-foreground bg-muted p-3 rounded-lg space-y-1">
          <p>
            <strong>How it works:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Shared chats are cached locally for offline viewing</li>
            <li>Old chats are automatically cleaned up after 7 days</li>
            <li>Messages are trimmed to keep only recent conversations</li>
            <li>Cache is cleared if storage limit is exceeded</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
