import { useState } from "react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/sheet";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { useTriggers } from "@/app/hooks/useTriggers";
import { AvailableTrigger } from "@/app/types/workflow.types";

interface sideBarProps {
  isOPen: boolean;
  setIsOpen: (open: boolean) => void;
  onSelect: (trigger: AvailableTrigger) => void;
}

export default function SheetDemo({ isOPen, setIsOpen, onSelect }: sideBarProps) {
  const { triggers, loading, error } = useTriggers(true);

  const [selected, setSelected] = useState<AvailableTrigger | null>(null);

  const clearTriggers = () => {
    setSelected(null);
  };

  const handleSelectChange = (value: string) => {
    const found = triggers.find(
      (t) => t.type === value || t.name === value
    );
    if (found) {
      setSelected(found);
    }
  };

  const handleSave = () => {
    if (selected) {
      onSelect(selected);
      setIsOpen(false);
    }
  };

  return (
    <Sheet open={isOPen} onOpenChange={setIsOpen}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Choose The Trigger</SheetTitle>
        </SheetHeader>

        {loading && (
          <div className="mb-4 text-gray-500">Loading triggers...</div>
        )}

        {error && (
          <div className="mb-4 rounded p-2 text-red-700 bg-red-100 border border-red-300">
            {error}
          </div>
        )}

        <Select
          disabled={loading || !!error}
          onValueChange={handleSelectChange}
          value={selected ? selected.type || selected.name : undefined}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select a trigger" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Available Triggers</SelectLabel>
              {/* If triggers exist and not loading/error, show list */}
              {!loading && !error && triggers.length === 0 && (
                <div className="px-4 py-2 text-gray-400">
                  No triggers found.
                </div>
              )}
              {!loading &&
                !error &&
                triggers.map((trigger) => (
                  <SelectItem
                    key={trigger.id}
                    value={trigger.type || trigger.name}
                  >
                    {trigger.name}
                  </SelectItem>
                ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        <SheetFooter>
          <Button
            type="button"
            disabled={loading || !!error || !selected}
            onClick={handleSave}
          >
            Save changes
          </Button>
          <Button
            variant="outline"
            type="button"
            onClick={() => {
              clearTriggers();
              setIsOpen(false);
            }}
          >
            Close
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
