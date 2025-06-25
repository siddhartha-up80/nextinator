"use client";

import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
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
import Addnotedialog from "./addnotedialog";
import OptimizedChatHistoryDialog from "./optimizedchathistorydialog";
import { ConfirmDialog } from "../ui/confirm-dialog";
import { useSharingStatus } from "./sharingstatus";
import { useToast } from "@/components/ui/toast";
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
  const { theme } = useTheme();
  const { showToast } = useToast();
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
    <div className="md:pl-[290px] shadow fixed top-0 flex justify-between items-center bg-white dark:bg-black dark:text-white w-full min-h-14 z-40 px-4">
      {/* Left side - Menu for mobile, Welcome message for desktop */}
      <div className="flex items-center gap-3">
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="p-2">
                <Menu size={24} />
              </Button>
            </SheetTrigger>
            <SheetContent side={"left"}>
              <Sidebar allNotes={allNotes} groups={groups} />
            </SheetContent>
          </Sheet>
        </div>

        {isLoaded || isSignedIn ? (
          <Link href={`/inator`} className="flex items-center">
            <span className="text-xl font-semibold hidden md:block">
              Welcome {user?.firstName}
            </span>
            <div className="md:hidden flex items-center">
              <span className="text-lg font-bold">Next</span>
              <span className="text-lg font-bold text-rose-600">Inator</span>
            </div>
          </Link>
        ) : (
          <div className="flex justify-center items-center">
            <div className="w-6 h-6 border-2 border-dashed rounded-full animate-spin border-rose-600"></div>
          </div>
        )}
      </div>
      {/* Right side - Actions */}
      <div className="flex items-center gap-2">
        {/* Desktop actions - show all buttons */}
        <div className="hidden md:flex items-center gap-2">
          <ThemeToggleButton />
          {onSelectChat && (
            <OptimizedChatHistoryDialog
              onSelectChat={onSelectChat}
              currentSessionId={currentSessionId}
            />
          )}{" "}
          {/* Share Current Chat Button */}
          {currentSessionId && currentSessionId !== "" && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={shareCurrentChat}
                disabled={sharingCurrentChat || disablingShare}
                className={`flex items-center gap-2 ${
                  currentChatShared
                    ? "border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-950"
                    : ""
                }`}
              >
                {sharingCurrentChat || disablingShare ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : currentChatShared ? (
                  <Shield className="w-4 h-4 text-blue-600" />
                ) : (
                  <Share2 className="w-4 h-4" />
                )}
                <span>{currentChatShared ? "Shared Chat" : "Share Chat"}</span>
              </Button>

              {/* Copy Link Button - only show when chat is shared */}
              {currentChatShared && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copySharedChatLink}
                  className="flex items-center gap-2"
                >
                  {currentChatCopied ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  <span>{currentChatCopied ? "Copied!" : "Copy Link"}</span>
                </Button>
              )}
            </div>
          )}
          <Button
            className="flex gap-2 items-center font-semibold"
            variant={"default"}
            size={"sm"}
            onClick={() => setShowNoteDialog(true)}
          >
            <Notebook size={18} />
            <span>Add Data</span>
          </Button>
          <SettingsDialog />
        </div>{" "}
        {/* Mobile actions - dropdown menu for secondary actions */}
        <div className="md:hidden flex items-center gap-2">
          {/* Primary action - Add Data (always visible on mobile) */}
          <Button
            className="flex items-center justify-center p-2"
            variant={"default"}
            size={"sm"}
            onClick={() => setShowNoteDialog(true)}
          >
            <Plus size={18} />
          </Button>

          {/* Secondary actions in dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="p-2">
                <MoreVertical size={18} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {/* Settings */}
              <DropdownMenuItem onSelect={() => setShowSettingsDialog(true)}>
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {/* Theme Toggle */}
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <div className="flex items-center justify-between w-full">
                  <span>Theme</span>
                  <ThemeToggleButton />
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {/* Chat History */}
              {onSelectChat && (
                <DropdownMenuItem
                  onSelect={() => setShowChatHistoryDialog(true)}
                >
                  <History className="w-4 h-4 mr-2" />
                  Chat History
                </DropdownMenuItem>
              )}{" "}
              {/* Share Current Chat */}
              {currentSessionId && currentSessionId !== "" && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={shareCurrentChat}
                    disabled={sharingCurrentChat || disablingShare}
                    className={currentChatShared ? "text-blue-600" : ""}
                  >
                    {sharingCurrentChat || disablingShare ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : currentChatShared ? (
                      <Shield className="w-4 h-4 mr-2 text-blue-600" />
                    ) : (
                      <Share2 className="w-4 h-4 mr-2" />
                    )}
                    {currentChatShared ? "Shared Chat" : "Share Chat"}
                  </DropdownMenuItem>

                  {/* Copy Link - only show when chat is shared */}
                  {currentChatShared && (
                    <DropdownMenuItem onSelect={copySharedChatLink}>
                      {currentChatCopied ? (
                        <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4 mr-2" />
                      )}
                      {currentChatCopied ? "Copied!" : "Copy Link"}
                    </DropdownMenuItem>
                  )}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {/* User Button - always visible */}
        <UserButton
          afterSignOutUrl="/"
          appearance={{
            baseTheme: theme === "dark" ? dark : undefined,
            elements: {
              avatarBox: {
                width: "2.25rem",
                height: "2.25rem",
              },
            },
          }}
        />
      </div>{" "}
      {/* Dialogs */}
      <Addnotedialog open={showAddNoteDialog} setOpen={setShowNoteDialog} />
      {/* Mobile Settings Dialog - only render when mobile dropdown triggers it */}
      {showSettingsDialog && (
        <SettingsDialog
          open={showSettingsDialog}
          onOpenChange={setShowSettingsDialog}
        />
      )}
      {/* Mobile Chat History Dialog - only render when mobile dropdown is used */}{" "}
      {onSelectChat && showChatHistoryDialog && (
        <OptimizedChatHistoryDialog
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
