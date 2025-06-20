import React from "react";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/db/prisma";
import ClientSidebarContainer from "./clientsidebarcontainer";

interface SidebarContainerProps {
  children?: React.ReactNode;
}

const SidebarContainer = async ({ children }: SidebarContainerProps) => {
  const { userId } = await auth();

  if (!userId) throw Error("userId undefined");

  const allNotes = await prisma?.note.findMany({ where: { userId } });

  return <ClientSidebarContainer allNotes={allNotes} children={children} />;
};

export default SidebarContainer;
