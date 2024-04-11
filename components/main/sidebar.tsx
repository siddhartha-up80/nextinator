"use client";

import Link from "next/link";
import React, { useState } from "react";
import { Button } from "../ui/button";
import { MessageSquare, Notebook } from "lucide-react";
import Addnotedialog from "./addnotedialog";

const Sidebar = () => {
  const [showAddNoteDialog, setShowNoteDialog] = useState(false);

  return (
    <>
      <div className="fixed left-0 top-0 bg-gray-50 h-screen w-[270px] border-r dark:bg-black dark:text-white z-50">
        <div className="space-y-6 md:h-full h-max px-3 py-4">
          <div className="flex flex-col gap-8">
            <span className="ml-2">
              <h3>
                <Link
                  href={`/`}
                  className="text-2xl md:text-3xl font-bold flex gap-x-1 flex-row leading-tight"
                >
                  <span>Next</span>
                  <span className="text-rose-600">Inator</span>
                </Link>
              </h3>
            </span>
            <span className="">
              <Button
                variant={"ghost"}
                size={"lg"}
                className="justify-start px-3 mt-3 gap-2 text-base font-semibold w-full"
              >
                <MessageSquare size={24} /> Chat Inator
              </Button>
            </span>
          </div>
          <div className="px-4 flex flex-col gap-3">
            <Link href={`/inator/alldata`}>
              <h3 className="font-semibold">Your Data</h3>
            </Link>
            <div className="flex flex-col gap-1 max-h-[50vh] flex-nowrap overflow-auto flex-shrink-0">
              <Button
                className="flex gap-3 text-start justify-start pl-2 flex-shrink-0"
                variant={"ghost"}
                size={"lg"}
              >
                <Notebook size={20} /> Post 1
              </Button>
            </div>
          </div>
          <div className="flex flex-col gap-2 max-h-[50vh] overflow-y-auto">
            <Button
              className="flex gap-2 items-center font-semibold text-start justify-center pl-2"
              variant={"default"}
              size={"lg"}
              onClick={() => setShowNoteDialog(true)}
            >
              <Notebook size={22} /> Add Data
            </Button>
          </div>
          <div></div>
        </div>
      </div>
      <Addnotedialog open={showAddNoteDialog} setOpen={setShowNoteDialog} />
    </>
  );
};

export default Sidebar;
