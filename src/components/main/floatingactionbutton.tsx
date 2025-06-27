"use client";

import React, { useState } from "react";
import { Plus, Notebook, MessageSquare } from "lucide-react";
import { Button } from "../ui/button";
import Addnotedialog from "./addnotedialog";

const FloatingActionButton = () => {
  const [showAddNoteDialog, setShowNoteDialog] = useState(false);

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setShowNoteDialog(true)}
          className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 border-0"
          size="lg"
        >
          <Plus size={24} />
        </Button>
      </div>

      <Addnotedialog open={showAddNoteDialog} setOpen={setShowNoteDialog} />
    </>
  );
};

export default FloatingActionButton;
