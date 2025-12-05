import { Button } from "@workspace/ui/components/button"
import { Input } from  "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label" 
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@workspace/ui/components/sheet"

interface sideBarProps {
    isOPen: boolean
    setIsOpen: (open: boolean) => void
}

export default  function SheetDemo({isOPen , setIsOpen} : sideBarProps) {
  return (
    <Sheet open={isOPen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        {/* <Button variant="outline">Open</Button> */}
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Choose The Trigger</SheetTitle>
          {/* <SheetDescription>
            Make changes to your profile here. Click save when you&apos;re done.
          </SheetDescription> */}
        </SheetHeader>
        <div className="grid flex-1 auto-rows-min gap-6 px-4">
          <div className="grid gap-3">
            <Label htmlFor="sheet-demo-name">Name</Label>
            <Input id="sheet-demo-name" defaultValue="Pedro Duarte" />
          </div>
          <div className="grid gap-3">
            <Label htmlFor="sheet-demo-username">Username</Label>
            <Input id="sheet-demo-username" defaultValue="@peduarte" />
          </div>
        </div>
        <SheetFooter>
          <Button type="submit">Save changes</Button>
          <SheetClose asChild>
            <Button variant="outline">Close</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
