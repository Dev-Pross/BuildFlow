"use client";
import { useState } from "react";
import { Button } from "@workspace/ui/components/button";
import { CardDemo } from "./WorkflowCard";


export default function ParentComponent() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-2 md:flex-row">
      <Button onClick={() => setIsOpen(true)} variant={"outline"}>Create WorkFlow</Button>

      {/* The Modal is conditionally rendered here */}
      {isOpen && <CardDemo onClose={() => setIsOpen(false)} />}
    </div>
  );
}
