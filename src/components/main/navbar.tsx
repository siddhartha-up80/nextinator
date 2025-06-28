"use client";

import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";
import { ThemeToggleButton } from "./themetogglebutton";
import { dark } from "@clerk/themes";
import { useTheme } from "next-themes";
import {
  Menu,
  Notebook,
  Plus,
  Share2,
  Copy,
  CheckCircle,
  Loader2,
  Shield,
  MoreVertical,
  History,
  Settings,
  Database,
  Sun,
  Moon,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import Sidebar from "./sidebar";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import Addnotedialog from "./addnotedialog";
import ChatHistoryDialog from "./chathistorydialog";
import { ConfirmDialog } from "../ui/confirm-dialog";
import { useSharingStatus } from "./sharingstatus";
import { useToast } from "@/components/ui/toast";
import { useSidebar } from "@/contexts/SidebarContext";
import SettingsDialog from "./settingsdialog";

const Navbar = ({
  allNotes,
  groups,
  onSelectChat,
  currentSessionId,
}: {
  allNotes: any;
  groups: any;
  onSelectChat?: (sessionId: string) => void;
  currentSessionId?: string;
}) => {
  const [showAddNoteDialog, setShowNoteDialog] = useState(false);
  const [showChatHistoryDialog, setShowChatHistoryDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [sharingCurrentChat, setSharingCurrentChat] = useState(false);
  const [currentChatShared, setCurrentChatShared] = useState(false);
  const [currentChatCopied, setCurrentChatCopied] = useState(false);
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [disablingShare, setDisablingShare] = useState(false);
  const { isLoaded, isSignedIn, user } = useUser();
  const { theme, setTheme } = useTheme();
  const { showToast } = useToast();
  const { toggleSidebar, isCollapsed } = useSidebar();
  const { sharingStatus, updateSharingStatus, removeSharingStatus } =
    useSharingStatus();
  // Check if current chat is already shared
  useEffect(() => {
    const checkIfShared = async () => {
      if (!currentSessionId || currentSessionId === "") {
        setCurrentChatShared(false);
        return;
      }

      // First check the context
      const contextStatus = sharingStatus[currentSessionId];
      if (contextStatus) {
        setCurrentChatShared(contextStatus.isShared);
        return;
      } // If not in context, fetch from API
      try {
        const response = await fetch(`/api/chat-sessions/${currentSessionId}`);
        if (response.ok) {
          const data = await response.json();
          setCurrentChatShared(data.isShared || false);
          // Update context with fetched data, construct shareUrl from shareToken if available
          const shareUrl = data.shareToken
            ? `${window.location.origin}/shared-chat/${data.shareToken}`
            : undefined;
          updateSharingStatus(currentSessionId, {
            isShared: data.isShared || false,
            shareUrl: shareUrl,
          });
        }
      } catch (error) {
        console.error("Failed to check if chat is shared:", error);
        showToast("Failed to check chat sharing status", "error");
      }
    };

    checkIfShared();
  }, [currentSessionId, sharingStatus, updateSharingStatus]);
  const shareCurrentChat = async () => {
    if (!currentSessionId || currentSessionId === "") return;

    // If already shared, show disable confirmation
    if (currentChatShared) {
      setShowDisableDialog(true);
      return;
    }

    setSharingCurrentChat(true);
    try {
      const response = await fetch(
        `/api/chat-sessions/${currentSessionId}/share`,
        {
          method: "POST",
        }
      );
      if (response.ok) {
        const data = await response.json();
        setCurrentChatShared(true);

        // Update context
        updateSharingStatus(currentSessionId, {
          isShared: true,
          shareUrl: data.shareUrl,
        }); // Copy to clipboard

        await navigator.clipboard.writeText(data.shareUrl);
        setCurrentChatCopied(true);
        showToast("Chat shared! Link copied to clipboard", "success");

        // Reset copied status after 2 seconds
        setTimeout(() => {
          setCurrentChatCopied(false);
        }, 2000);
      }
    } catch (error) {
      console.error("Failed to share current chat:", error);
      showToast("Failed to share chat", "error");
    } finally {
      setSharingCurrentChat(false);
    }
  };

  const disableSharing = async () => {
    if (!currentSessionId || currentSessionId === "") return;

    setDisablingShare(true);
    try {
      const response = await fetch(
        `/api/chat-sessions/${currentSessionId}/share`,
        {
          method: "DELETE",
        }
      );
      if (response.ok) {
        setCurrentChatShared(false);
        setCurrentChatCopied(false); // Update context
        updateSharingStatus(currentSessionId, {
          isShared: false,
        });
        showToast("Chat sharing disabled", "success");
      }
    } catch (error) {
      console.error("Failed to disable sharing:", error);
      showToast("Failed to disable sharing", "error");
    } finally {
      setDisablingShare(false);
    }
  };
  const copySharedChatLink = async () => {
    if (!currentSessionId || currentSessionId === "" || !currentChatShared)
      return;

    try {
      // Get the share URL from context or fetch it
      const contextStatus = sharingStatus[currentSessionId];
      let shareUrl = contextStatus?.shareUrl;

      if (!shareUrl) {
        // Fetch the session data to get the shareToken
        const response = await fetch(`/api/chat-sessions/${currentSessionId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.shareToken) {
            shareUrl = `${window.location.origin}/shared-chat/${data.shareToken}`;
            // Update context with constructed URL
            updateSharingStatus(currentSessionId, {
              isShared: true,
              shareUrl: shareUrl,
            });
          }
        }
      }

      if (shareUrl) {
        await navigator.clipboard.writeText(shareUrl);
        setCurrentChatCopied(true);
        showToast("Share link copied to clipboard!", "success");

        // Reset copied status after 2 seconds
        setTimeout(() => {
          setCurrentChatCopied(false);
        }, 2000);
      } else {
        showToast("Share link not found", "error");
      }
    } catch (error) {
      console.error("Failed to copy share link:", error);
      showToast("Failed to copy link to clipboard", "error");
    }
  };
  return (
    <div className="bg-background border-b border-gray-200 dark:border-gray-700 shadow-sm fixed top-0 w-full z-50 h-16">
      <div className="flex items-center h-full">
        {/* Mobile - hamburger and logo */}
        <div className="flex items-center gap-4 px-4 md:hidden w-full justify-between">
          <div className="flex items-center gap-4">
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
                >
                  <Menu
                    size={20}
                    className="text-gray-600 dark:text-gray-300"
                  />
                </Button>
              </SheetTrigger>
              <SheetContent side={"left"} className="p-0 w-72">
                <Sidebar allNotes={allNotes} groups={groups} />
              </SheetContent>
            </Sheet>

            <Link href="/inator" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden">
                <Image
                  src="/images/logo.jpg"
                  alt="Nextinator Logo"
                  width={40}
                  height={40}
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
              <span className="text-xl font-normal text-gray-700 dark:text-gray-200">
                Nextinator
              </span>
            </Link>
          </div>

          {/* Mobile Right Actions */}
          <div className="flex items-center gap-1">
            <Button
              onClick={() => setShowNoteDialog(true)}
              variant="ghost"
              size="sm"
              className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
              title="Add Data"
            >
              <Plus size={20} className="text-gray-600 dark:text-gray-300" />
            </Button>

            {/* Mobile Dropdown Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
                >
                  <MoreVertical
                    size={20}
                    className="text-gray-600 dark:text-gray-300"
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                {onSelectChat && (
                  <>
                    <DropdownMenuItem
                      onClick={() => setShowChatHistoryDialog(true)}
                      className="flex items-center gap-2"
                    >
                      <History size={16} />
                      Chat History
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (theme === "dark") {
                      setTheme("light");
                    } else {
                      setTheme("dark");
                    }
                  }}
                  className="flex items-center gap-2"
                >
                  <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  Toggle Theme
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowSettingsDialog(true);
                  }}
                  className="flex items-center gap-2"
                >
                  <Settings size={16} />
                  Settings
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <UserButton
              afterSignOutUrl="/"
              appearance={{
                baseTheme: theme === "dark" ? dark : undefined,
                elements: {
                  avatarBox: {
                    width: "2.5rem",
                    height: "2.5rem",
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Desktop - hamburger, logo and actions */}
        <div className="hidden md:flex items-center w-full justify-between">
          {/* Left side - Hamburger + Logo */}
          <div className="flex items-center gap-4 px-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSidebar}
              className={`p-3 rounded-full transition-colors duration-200 ${
                isCollapsed
                  ? "bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              <Menu size={20} className="text-gray-600 dark:text-gray-300" />
            </Button>

            <Link href="/inator" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden">
                <Image
                  src="/images/logo.jpg"
                  alt="Nextinator Logo"
                  width={40}
                  height={40}
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
              <span className="text-2xl font-normal text-gray-700 dark:text-gray-200">
                Nextinator
              </span>
            </Link>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1 px-4">
            <Button
              onClick={() => setShowNoteDialog(true)}
              variant="ghost"
              size="sm"
              className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
              title="Add Data"
            >
              <Plus size={20} className="text-gray-600 dark:text-gray-300" />
            </Button>

            {onSelectChat && (
              <Button
                onClick={() => setShowChatHistoryDialog(true)}
                variant="ghost"
                size="sm"
                className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
                title="Chat History"
              >
                <History
                  size={20}
                  className="text-gray-600 dark:text-gray-300"
                />
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (theme === "dark") {
                  setTheme("light");
                } else {
                  setTheme("dark");
                }
              }}
              className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
              title="Toggle Theme"
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-gray-600 dark:text-gray-300" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-gray-600 dark:text-gray-300" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettingsDialog(true)}
              className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
              title="Settings"
            >
              <Settings
                size={20}
                className="text-gray-600 dark:text-gray-300"
              />
            </Button>

            <UserButton
              afterSignOutUrl="/"
              appearance={{
                baseTheme: theme === "dark" ? dark : undefined,
                elements: {
                  avatarBox: {
                    width: "2.5rem",
                    height: "2.5rem",
                  },
                },
              }}
            />
          </div>
        </div>
      </div>
      {/* Dialogs */}
      <Addnotedialog open={showAddNoteDialog} setOpen={setShowNoteDialog} />
      {/* Settings Dialog */}
      {showSettingsDialog && (
        <SettingsDialog
          open={showSettingsDialog}
          onOpenChange={setShowSettingsDialog}
        />
      )}
      {/* Chat History Dialog */}
      {onSelectChat && showChatHistoryDialog && (
        <ChatHistoryDialog
          onSelectChat={(sessionId) => {
            onSelectChat(sessionId);
            setShowChatHistoryDialog(false);
          }}
          currentSessionId={currentSessionId}
          open={showChatHistoryDialog}
          onOpenChange={setShowChatHistoryDialog}
        />
      )}
      {/* Disable Sharing Confirmation Dialog */}
      <ConfirmDialog
        open={showDisableDialog}
        onOpenChange={setShowDisableDialog}
        title="Disable Chat Sharing"
        description="Are you sure you want to disable sharing for this chat? The shared link will no longer work and other users won't be able to access this conversation."
        confirmText="Disable Sharing"
        cancelText="Cancel"
        onConfirm={disableSharing}
        variant="destructive"
        loading={disablingShare}
      />
    </div>
  );
};

export default Navbar;
