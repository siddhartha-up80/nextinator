import React from "react";
import Navbar from "./navbar";
import Sidebar from "./sidebar";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/db/prisma";

const SidebarContainer = async () => {
  const { userId } = await auth();

  if (!userId) throw Error("userId undefined");

  const allNotes = await prisma?.note.findMany({ where: { userId } });

  return (
    <div>
      <div>
        <Navbar allNotes={allNotes} />
      </div>
      <div className="hidden md:block">
        <Sidebar allNotes={allNotes} />
      </div>
    </div>
  );
};

export default SidebarContainer;
