"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Pencil, Trash2, Plus, Save, X } from "lucide-react";
import { useToast } from "@/components/ui/toast";

interface Group {
  id: string;
  name: string;
  color: string;
  _count: {
    notes: number;
  };
}

interface GroupManagementDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  groups: Group[];
  onGroupsUpdate: () => void;
}

const GroupManagementDialog = ({
  open,
  setOpen,
  groups,
  onGroupsUpdate,
}: GroupManagementDialogProps) => {
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  const [groupData, setGroupData] = useState<{
    [key: string]: { name: string; color: string };
  }>({});
  const [newGroup, setNewGroup] = useState({ name: "", color: "#6366f1" });
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const { showToast } = useToast();

  // Initialize group data when dialog opens
  useEffect(() => {
    if (open) {
      const initialData: { [key: string]: { name: string; color: string } } =
        {};
      groups.forEach((group) => {
        initialData[group.id] = { name: group.name, color: group.color };
      });
      setGroupData(initialData);
      setEditingGroup(null);
      setNewGroup({ name: "", color: "#6366f1" });
    }
  }, [open, groups]);

  const handleUpdateGroup = async (groupId: string) => {
    setLoading((prev) => ({ ...prev, [groupId]: true }));

    try {
      const response = await fetch("/api/groups", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: groupId,
          name: groupData[groupId].name,
          color: groupData[groupId].color,
        }),
      });

      if (response.ok) {
        showToast("Group updated successfully", "success");
        setEditingGroup(null);
        onGroupsUpdate();
      } else {
        const error = await response.json();
        showToast(error.error || "Failed to update group", "error");
      }
    } catch (error) {
      showToast("Failed to update group", "error");
    } finally {
      setLoading((prev) => ({ ...prev, [groupId]: false }));
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this group? Notes in this group will become ungrouped."
      )
    ) {
      return;
    }

    setLoading((prev) => ({ ...prev, [groupId]: true }));

    try {
      const response = await fetch("/api/groups", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: groupId }),
      });

      if (response.ok) {
        showToast("Group deleted successfully", "success");
        onGroupsUpdate();
      } else {
        const error = await response.json();
        showToast(error.error || "Failed to delete group", "error");
      }
    } catch (error) {
      showToast("Failed to delete group", "error");
    } finally {
      setLoading((prev) => ({ ...prev, [groupId]: false }));
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroup.name.trim()) {
      showToast("Group name is required", "error");
      return;
    }

    setLoading((prev) => ({ ...prev, new: true }));

    try {
      const response = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newGroup),
      });

      if (response.ok) {
        showToast("Group created successfully", "success");
        setNewGroup({ name: "", color: "#6366f1" });
        onGroupsUpdate();
      } else {
        const error = await response.json();
        showToast(error.error || "Failed to create group", "error");
      }
    } catch (error) {
      showToast("Failed to create group", "error");
    } finally {
      setLoading((prev) => ({ ...prev, new: false }));
    }
  };

  const getColorClass = (color: string) => {
    const colorMap: { [key: string]: string } = {
      "#6366f1": "bg-indigo-500",
      "#8b5cf6": "bg-violet-500",
      "#06b6d4": "bg-cyan-500",
      "#10b981": "bg-emerald-500",
      "#f59e0b": "bg-red-500",
      "#ef4444": "bg-red-500",
      "#ec4899": "bg-pink-500",
      "#84cc16": "bg-lime-500",
      "#6b7280": "bg-gray-500",
      "#1f2937": "bg-gray-800",
    };
    return colorMap[color] || "bg-indigo-500";
  };

  const colorOptions = [
    "#6366f1", // Indigo
    "#8b5cf6", // Violet
    "#06b6d4", // Cyan
    "#10b981", // Emerald
    "#f59e0b", // Red
    "#ef4444", // Red
    "#ec4899", // Pink
    "#84cc16", // Lime
    "#6b7280", // Gray
    "#1f2937", // Dark Gray
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Groups</DialogTitle>
          <DialogDescription>
            Create, edit, and delete your note groups. You can also change group
            colors.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Create New Group */}
          <div className="border rounded-lg p-4 space-y-4">
            <h3 className="font-semibold text-sm">Create New Group</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="new-group-name">Group Name</Label>
                <Input
                  id="new-group-name"
                  placeholder="Enter group name"
                  value={newGroup.name}
                  onChange={(e) =>
                    setNewGroup((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="new-group-color">Color</Label>{" "}
                <div className="flex flex-wrap gap-2 mt-1">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      title={`Select color ${color}`}
                      className={`w-8 h-8 rounded-full border-2 ${getColorClass(
                        color
                      )} ${
                        newGroup.color === color
                          ? "border-gray-800 dark:border-gray-200"
                          : "border-gray-300"
                      }`}
                      onClick={() =>
                        setNewGroup((prev) => ({ ...prev, color }))
                      }
                    />
                  ))}
                </div>
              </div>
            </div>
            <Button
              onClick={handleCreateGroup}
              disabled={loading.new || !newGroup.name.trim()}
              className="w-full md:w-auto"
            >
              {loading.new ? (
                <>Loading...</>
              ) : (
                <>
                  <Plus size={16} className="mr-2" />
                  Create Group
                </>
              )}
            </Button>
          </div>

          {/* Existing Groups */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Existing Groups</h3>
            {groups.length === 0 ? (
              <p className="text-gray-500 text-sm">No groups created yet.</p>
            ) : (
              groups.map((group) => (
                <div key={group.id} className="border rounded-lg p-4 space-y-3">
                  {editingGroup === group.id ? (
                    // Edit Mode
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                          <Label htmlFor={`group-name-${group.id}`}>
                            Group Name
                          </Label>
                          <Input
                            id={`group-name-${group.id}`}
                            value={groupData[group.id]?.name || ""}
                            onChange={(e) =>
                              setGroupData((prev) => ({
                                ...prev,
                                [group.id]: {
                                  ...prev[group.id],
                                  name: e.target.value,
                                },
                              }))
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor={`group-color-${group.id}`}>
                            Color
                          </Label>{" "}
                          <div className="flex flex-wrap gap-2 mt-1">
                            {colorOptions.map((color) => (
                              <button
                                key={color}
                                title={`Select color ${color}`}
                                className={`w-8 h-8 rounded-full border-2 ${getColorClass(
                                  color
                                )} ${
                                  groupData[group.id]?.color === color
                                    ? "border-gray-800 dark:border-gray-200"
                                    : "border-gray-300"
                                }`}
                                onClick={() =>
                                  setGroupData((prev) => ({
                                    ...prev,
                                    [group.id]: { ...prev[group.id], color },
                                  }))
                                }
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleUpdateGroup(group.id)}
                          disabled={loading[group.id]}
                        >
                          {loading[group.id] ? (
                            <>Saving...</>
                          ) : (
                            <>
                              <Save size={16} className="mr-2" />
                              Save
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingGroup(null)}
                          disabled={loading[group.id]}
                        >
                          <X size={16} className="mr-2" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <div className="flex items-center justify-between">
                      {" "}
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-4 h-4 rounded-full ${getColorClass(
                            group.color
                          )}`}
                        />
                        <div>
                          <p className="font-medium">{group.name}</p>
                          <p className="text-sm text-gray-500">
                            {group._count.notes}{" "}
                            {group._count.notes === 1 ? "note" : "notes"}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingGroup(group.id)}
                          disabled={Object.values(loading).some(Boolean)}
                        >
                          <Pencil size={16} className="mr-2" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteGroup(group.id)}
                          disabled={loading[group.id]}
                          className="text-red-600 hover:text-red-700"
                        >
                          {loading[group.id] ? (
                            <>Deleting...</>
                          ) : (
                            <>
                              <Trash2 size={16} className="mr-2" />
                              Delete
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GroupManagementDialog;
