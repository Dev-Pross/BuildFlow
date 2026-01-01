"use client";

import { SidebarProvider, SidebarTrigger } from "@workspace/ui/components/sidebar";
import CreateWorkFlow from "../components/nodes/CreateWorkFlow";
import { AppSidebar } from "../components/ui/app-sidebar";
// import WorkFlow from "../components/nodes/WorkFlow";
// import CreateWorkFlow from "../components/workflow";

export default function Workf() {

  return (
    <>
    <div className="flex w-screen h-screen bg-white">
    <div className=" w-auto h-full text-black">
      <SidebarProvider>
      <AppSidebar />
      
        {/* {children} */}
      </SidebarProvider>
    </div>
    <div className=" flex -col h-[95vh] w-full fitems-center justify-center bg-[#0f0f1a]">
      <CreateWorkFlow/>
    </div>
    </div>
    </>
  );
}