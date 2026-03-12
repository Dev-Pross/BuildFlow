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
import { useActions } from "@/app/hooks/useActions";

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

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Select an Action</SheetTitle>
        </SheetHeader>

        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p className="text-red-500">Error fetching actions</p>
        ) : (
          <Select onValueChange={(value) => {
            const selected = availableActions.find((a: any) => String(a.id) === value);
            if (selected) {
              onSelectAction({
                id: selected.id,
                name: selected.name,
                type: selected.type,
                icon: 'icon' in selected && selected.icon ? selected.icon : '⚡',
              });
              onClose();
            }
          }}>
            <SelectTrigger className="w-full mt-4">
              <SelectValue placeholder="Select Action" />
            </SelectTrigger>
            <SelectContent>
              {availableActions.length ? (
                availableActions.map((action: any) => (
                  <SelectItem key={action.id} value={String(action.id)}>
                    <div className="flex items-center gap-2">
                      {'icon' in action && action.icon ? <img src={action.icon} className="w-8 h-4" /> : '⚡'} {action.name}
                    </div>
                  </SelectItem>
                ))
              ) : (
                <div className="px-4 py-2 text-muted-foreground">
                  No actions available
                </div>
              )}
            </SelectContent>
          </Select>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default ActionSideBar;
