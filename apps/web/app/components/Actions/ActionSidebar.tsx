"use client";

import React, { useState, useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/sheet";
import { useActions } from "@/app/hooks/useActions";
import { NodeIcon } from "@/app/components/ui/NodeIcon";
import { Search, Layers, ArrowRight, Loader2 } from "lucide-react";

interface SideBarProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAction: (action: { id: string; name: string; type: string; icon?: string }) => void;
}

const getAvailableActions = (actions: any): Array<any> => {
  if (Array.isArray(actions)) return actions;
  if (actions && Array.isArray(actions.Data)) return actions.Data;
  return [];
};

export const ActionSideBar = ({ isOpen, onClose, onSelectAction }: SideBarProps) => {
  const { actions, loading, error } = useActions({ shouldFetch: true });
  const availableActions = getAvailableActions(actions);
  const [search, setSearch] = useState("");

  const filteredActions = useMemo(() => {
    if (!availableActions) return [];
    if (!search.trim()) return availableActions;
    const q = search.toLowerCase();
    return availableActions.filter(
      (a: any) =>
        (a.name || "").toLowerCase().includes(q) ||
        (a.type || "").toLowerCase().includes(q) ||
        (a.description || "").toLowerCase().includes(q)
    );
  }, [availableActions, search]);

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-[380px] sm:w-[480px] bg-card border-l border-border text-foreground p-6 flex flex-col font-sans">
        <SheetHeader className="mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-secondary border border-border text-primary flex items-center justify-center shadow-xs">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <SheetTitle className="text-base sm:text-lg font-bold text-foreground">Add Action Step</SheetTitle>
              <p className="text-xs text-muted-foreground">Choose a tool, app, or transform node</p>
            </div>
          </div>
        </SheetHeader>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search actions & connectors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-secondary border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-all font-medium"
          />
        </div>

        {/* Actions list */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="text-xs">Loading available actions...</span>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs">
              Error fetching actions.
            </div>
          ) : filteredActions.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground">
              No actions found matching &quot;{search}&quot;
            </div>
          ) : (
            filteredActions.map((action: any) => (
              <div
                key={action.id}
                onClick={() => {
                  onSelectAction({
                    id: action.id,
                    name: action.name,
                    type: action.type,
                    icon: "icon" in action && action.icon ? action.icon : undefined,
                  });
                  onClose();
                }}
                className="group p-4 rounded-2xl bg-card border border-border hover:border-primary/50 hover:bg-secondary/40 hover:shadow-md transition-all cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <NodeIcon
                    icon={"icon" in action && action.icon ? action.icon : undefined}
                    name={action.name}
                    size="md"
                    nodeType="action"
                    className="w-10 h-10 bg-secondary border border-border rounded-xl"
                  />
                  <div>
                    <h5 className="font-bold text-xs text-foreground group-hover:text-primary transition-colors">
                      {action.name}
                    </h5>
                    <span className="text-[11px] text-muted-foreground block">
                      {action.description || `Node type: ${action.type}`}
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

export default ActionSideBar;
