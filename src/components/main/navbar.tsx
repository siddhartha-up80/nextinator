"use client";

import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import React, { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { ThemeToggleButton } from "./themetogglebutton";
import { dark } from "@clerk/themes";
import { useTheme } from "next-themes";
import { Menu, Notebook, Plus } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import Sidebar from "./sidebar";
import { Button } from "../ui/button";
import Addnotedialog from "./addnotedialog";

const Navbar = ({ allNotes }: any) => {
  const [showAddNoteDialog, setShowNoteDialog] = useState(false);
  const { isLoaded, isSignedIn, user } = useUser();
  const { theme } = useTheme();

  return (
    <div className="md:pl-[290px] pl-4 shadow fixed top-0 flex justify-between items-center bg-white dark:bg-black dark:text-white w-full min-h-14 z-40 pr-5">
      <div className="md:hidden">
        <Sheet>
          <SheetTrigger>
            <Menu className="md:hidden" size={28} />
          </SheetTrigger>
          <SheetContent side={"left"}>
            <Sidebar allNotes={allNotes} />
          </SheetContent>
        </Sheet>
      </div>
      {isLoaded || isSignedIn ? (
        <Link href={`/inator`} className="">
          <span className="text-xl font-semibold hidden md:block">
            Welcome {user?.firstName}{" "}
          </span>
          <span className="md:hidden text-2xl font-semibold">
            <span>Next</span>
            <span className="text-rose-600">Inator</span>
          </span>
        </Link>
      ) : (
        <div className="justify-center items-center flex w-full">
          <div className="w-10 h-10 border-4 border-dashed rounded-full animate-spin border-rose-600 mx-auto"></div>
        </div>
      )}

      <div className="flex gap-4 items-center">
        <ThemeToggleButton />
        <Button
          className="flex gap-2 items-center font-semibold text-start justify-center pl-2"
          variant={"default"}
          size={"sm"}
          onClick={() => setShowNoteDialog(true)}
        >
          <Notebook size={22} />{" "}
          <span className="hidden md:block">Add Data</span>{" "}
          <span className="md:hidden">
            <Plus />
          </span>
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
      <Addnotedialog open={showAddNoteDialog} setOpen={setShowNoteDialog} />
    </div>
  );
};

export default Navbar;
