"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import Image from "next/image";
import Link from "next/link";
import { dark } from "@clerk/themes";
import React from "react";
import { Button } from "../ui/button";
import { ThemeToggleButton } from "./themetogglebutton";

const Homenav = () => {
  const { theme } = useTheme();
  const { user } = useUser();

  return (
    <div className="pb-24 flex items-center justify-center w-full">
      <header className="px-4 py-3 shadow text-gray-800 w-full h-max bg-white dark:bg-black dark:text-white fixed md:top-3 top-0 max-w-7xl mx-auto rounded-md z-50">
        <div className="flex justify-between items-center">
          <Link
            href="/"
            aria-label="Back to homepage"
            className=" flex md:justify-between justify-between items-center gap-2"
          >
            <Image
              height={50}
              width={50}
              className="bg-cover mx-auto bg-center object-cover rounded-full"
              src="/images/logo.jpg"
              alt="logo"
            />
            <span className="text-2xl md:text-3xl font-bold flex gap-x-1 flex-row leading-tight">
              <span>Next</span>
              <span className="text-primary">Inator</span>
            </span>
          </Link>
          <div className="flex gap-4 items-center">
            <ThemeToggleButton />
            {user ? (
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
            ) : (
              <Button>Sign In</Button>
            )}
          </div>
        </div>
      </header>
    </div>
  );
};

export default Homenav;
