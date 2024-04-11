import React from "react";
import Navbar from "./navbar";
import Sidebar from "./sidebar";
import { auth } from "@clerk/nextjs";
import prisma from "@/lib/db/prisma";

const SidebarContainer = async () => {
  const { userId } = auth();

  if (!userId) throw Error("userId undefined");

  const allNotes = await prisma?.note.findMany({ where: { userId } });

  

  return (
    <div>
      <div>
        <Navbar />
      </div>
      <div className="hidden md:block">
        <Sidebar />
      </div>
    </div>
  );
};

export default SidebarContainer;
