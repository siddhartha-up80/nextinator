"use client";
import React from "react";
import Navbar from "./navbar";
import Sidebar from "./sidebar";

const SidebarContainer = () => {
  return (
    <div>
      <div>
        <Navbar />
      </div>
      <div>
        <Sidebar />
      </div>
    </div>
  );
};

export default SidebarContainer;
