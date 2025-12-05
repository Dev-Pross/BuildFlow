"use client";
import { useState } from "react";
import PlaceholderNode from "../components/nodes/PlaceHolder";
import SheetDemo from "../components/nodes/TriggerSidebar";
import WorkFlow from "../components/nodes/WorkFlow";
// import CreateWorkFlow from "../components/workflow";

export default function Workf() {

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-[#0f0f1a]">
      <WorkFlow/>
  
    </div>
  );
}