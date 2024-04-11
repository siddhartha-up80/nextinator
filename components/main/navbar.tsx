"use client";

import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import React from "react";
import { useUser } from "@clerk/nextjs";

const Navbar = () => {
  const { isLoaded, isSignedIn, user } = useUser();

  return (
    <div className="md:pl-[290px] shadow fixed top-0 flex justify-between items-center bg-white dark:bg-black dark:text-white w-full min-h-14 z-40 pr-5">
      {isLoaded || isSignedIn ? (
        <Link href={`/inator`} className="">
          <span className="text-xl font-semibold">
            Welcome {user?.firstName}{" "}
          </span>
        </Link>
      ) : (
        <div className="justify-center items-center flex w-full">
          <div className="w-10 h-10 border-4 border-dashed rounded-full animate-spin border-rose-600 mx-auto"></div>
        </div>
      )}

      <div>
        <UserButton
          afterSignOutUrl="/"
          appearance={{
            // baseTheme: theme === "dark" ? dark : undefined,
            elements: {
              avatarBox: {
                width: "2.5rem",
                height: "2.5rem",
              },
            },
          }}
        />
      </div>
    </div>
  );
};

export default Navbar;
