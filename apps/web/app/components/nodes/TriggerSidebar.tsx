import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { useTriggers } from "@/app/hooks/useTriggers";

interface SideBarProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTrigger: (trigger: { id: string; name: string; type: string; icon?: string }) => void;
}

export const TriggerSideBar = ({ isOpen, onClose, onSelectTrigger }:  SideBarProps) => {
  const { triggers, loading, error } = useTriggers(true);

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Select a Trigger</SheetTitle>
        </SheetHeader>

        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p className="text-red-500">Error Fetching Triggers</p>
        ) : (
          <Select onValueChange={(value) => {
            const selected = triggers.find(t => t.type === value);
            if (selected) {
              // We pass icon as undefined (placeholder), since it's missing from trigger
              onSelectTrigger({
                id: selected.id,
                name: selected.name,
                type: selected.type,
                icon: (selected as any).icon ?? "⚡", // fallback or undefined
              });
              onClose();
            }
          }}>
            <SelectTrigger className="w-full mt-4">
              <SelectValue placeholder="Select Trigger" />
            </SelectTrigger>
            <SelectContent>
              {triggers.map((trigger) => (
                <SelectItem key={trigger.id} value={trigger.type}>
                  {/* Display a placeholder icon if 'icon' is missing */}
                  {"icon" in trigger ? (trigger as any).icon : "⚡"} {trigger.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </SheetContent>
    </Sheet>
  );
};