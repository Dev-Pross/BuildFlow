"use client";

import React, { useState, useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/sheet";
import { useTriggers } from "@/app/hooks/useTriggers";
import { NodeIcon } from "@/app/components/ui/NodeIcon";
import { Search, Zap, ArrowRight, Loader2 } from "lucide-react";

interface SideBarProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTrigger: (trigger: { id: string; name: string; type: string; icon?: string }) => void;
}

export const TriggerSideBar = ({ isOpen, onClose, onSelectTrigger }: SideBarProps) => {
  const { triggers, loading, error } = useTriggers(true);
  const [search, setSearch] = useState("");

  const filteredTriggers = useMemo(() => {
    if (!triggers) return [];
    if (!search.trim()) return triggers;
    const q = search.toLowerCase();
    return triggers.filter(
      (t) => t.name.toLowerCase().includes(q) || t.type.toLowerCase().includes(q)
    );
  }, [triggers, search]);

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-[380px] sm:w-[480px] bg-card border-l border-border text-foreground p-6 flex flex-col font-sans">
        <SheetHeader className="mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-secondary border border-border text-primary flex items-center justify-center shadow-xs">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <SheetTitle className="text-base sm:text-lg font-bold text-foreground">Choose a Trigger</SheetTitle>
              <p className="text-xs text-muted-foreground">This event initiates your visual workflow</p>
            </div>
          </div>
        </SheetHeader>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search triggers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-secondary border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-all font-medium"
          />
        </div>

        {/* Trigger list */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="text-xs">Loading available triggers...</span>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs">
              Failed to load triggers.
            </div>
          ) : filteredTriggers.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground">
              No triggers found matching &quot;{search}&quot;
            </div>
          ) : (
            filteredTriggers.map((trigger) => (
              <div
                key={trigger.id}
                onClick={() => {
                  onSelectTrigger({
                    id: trigger.id,
                    name: trigger.name,
                    type: trigger.type,
                    icon: (trigger as any).icon ?? undefined,
                  });
                  onClose();
                }}
                className="group p-4 rounded-2xl bg-card border border-border hover:border-primary/50 hover:bg-secondary/40 hover:shadow-md transition-all cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <NodeIcon
                    icon={(trigger as any).icon ?? undefined}
                    name={trigger.name}
                    size="md"
                    nodeType="trigger"
                    className="w-10 h-10 bg-secondary border border-border rounded-xl"
                  />
                  <div>
                    <h5 className="font-bold text-xs text-foreground group-hover:text-primary transition-colors">
                      {trigger.name}
                    </h5>
                    <span className="text-[11px] text-muted-foreground font-mono block">
                      type: {trigger.type}
                    </span>
                  </div>
                </div>

                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default TriggerSideBar;
