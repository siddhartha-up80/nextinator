"use client";

import Link from "next/link";
import React, { useState } from "react";
import { Button } from "../ui/button";
import { Database, MessageSquare, Notebook } from "lucide-react";
import Addnotedialog from "./addnotedialog";
import Image from "next/image";

const Sidebar = ({ allNotes }: any) => {
  const [showAddNoteDialog, setShowNoteDialog] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);

  const handleNoteClick = (note: any) => {
    setSelectedNote(note);
  };

  const handleEditDialogClose = () => {
    setSelectedNote(null);
  };

  return (
    <>
      <div className="md:fixed w-full left-0 top-0 md:bg-gray-50 h-screen md:w-[270px] md:border-r dark:bg-black dark:text-white z-50">
        <div className="space-y-8 md:h-full h-max md:px-3 md:py-4">
          <div className="flex flex-col gap-8">
            <span className="ml-2">
              <h3>
                <Link
                  href={`/`}
                  className="text-2xl md:text-3xl font-bold flex gap-x-1 flex-row leading-tight items-center"
                >
                  <span>
                    <Image
                      height={50}
                      width={50}
                      className="bg-cover mx-auto bg-center object-cover rounded-full"
                      src="/images/logo.jpg"
                      alt="logo"
                    />
                  </span>
                  <span>Next</span>
                  <span className="text-rose-600">Inator</span>
                </Link>
              </h3>
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-1">
              <Link href={"/inator"} className="">
                <Button
                  variant={"ghost"}
                  className="justify-start px-3 gap-2 text-base font-semibold w-full"
                >
                  <MessageSquare size={24} /> <h3>Chat Bot-Inator</h3>
                </Button>
              </Link>
              <Link href={`/inator/alldata`} className="">
                <Button
                  variant={"ghost"}
                  className="justify-start px-3 gap-2 text-base font-semibold w-full"
                >
                  <Database size={24} />
                  <h3 className="">
                    {allNotes.length === 0 ? "Add New Data ⤵️" : "Your Data"}
                  </h3>
                </Button>
              </Link>
            </div>

            <div className="px-4 pr-6 flex flex-col gap-1 max-h-[50vh] flex-nowrap overflow-auto flex-shrink-0">
              {allNotes.map((note: any) => (
                <Button
                  className="flex flex-row gap-2 min-h-[40px] text-start justify-start pl-2 flex-shrink-0 w-full h-[fit-content]"
                  variant={"ghost"}
                  size={"sm"}
                  onClick={() => handleNoteClick(note)}
                  key={note.id}
                >
                  <Notebook size={18} className="shrink-0 flex" />
                  <p className="flex-wrap whitespace-normal flex-grow">
                    {note?.title ? `${note?.title}` : "No Title"}
                  </p>
                </Button>
              ))}
            </div>
            <div className="flex flex-col gap-2 max-h-[50vh] overflow-y-auto mt-4">
              <Button
                className="flex gap-2 items-center font-semibold text-start justify-center pl-2"
                variant={"default"}
                size={"lg"}
                onClick={() => setShowNoteDialog(true)}
              >
                <Notebook size={22} /> Add Data
              </Button>
            </div>
          </div>
          <div></div>
        </div>
      </div>
      {selectedNote && (
        <Addnotedialog
          open={true}
          setOpen={handleEditDialogClose}
          noteToEdit={selectedNote}
        />
      )}
      <Addnotedialog open={showAddNoteDialog} setOpen={setShowNoteDialog} />
    </>
  );
};

export default Sidebar;
