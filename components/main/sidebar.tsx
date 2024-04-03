"use client";

import Link from "next/link";
import React from "react";
import { Button } from "../ui/button";
import { MessageSquare, Notebook } from "lucide-react";

const Sidebar = () => {
  return (
    <div className="fixed left-0 top-0 bg-gray-50/50 h-screen w-[270px] border-r dark:bg-black dark:text-white z-40">
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
              className="justify-between px-3 w-max mt-3 gap-2 text-base font-semibold"
            >
              <MessageSquare size={24} /> Chat Inator
            </Button>
          </span>
        </div>
        <div className="px-4 flex flex-col gap-3">
          <span>
            <h3 className="font-semibold">Your Data</h3>
          </span>
          <div className="flex flex-col gap-2 max-h-[50vh] overflow-y-auto">
            <Button
              className="flex gap-4 text-start justify-start pl-2"
              variant={"ghost"}
              size={"lg"}
            >
              <Notebook /> Post 1
            </Button>
          </div>
        </div>
        <div></div>
      </div>
    </div>
  );
};

export default Sidebar;
