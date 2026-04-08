import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import AmountInput from "@/components/AmountInput"

export default function PapEditorSheet({
  open,
  onOpenChange,
  pap,
  categoryName,
  categoryDraft,
  setCategoryDraft,
  onSave,
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader className="text-left">
          <SheetTitle className="text-base">Edit MFO/PAP</SheetTitle>
          <SheetDescription>Set the local weight and allocated budget for this MFO/PAP row.</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label>Category</Label>
            <Input value={categoryName ?? ""} disabled />
          </div>

          <div className="space-y-2">
            <Label>MFO/PAP</Label>
            <Input value={pap?.label || pap?.activity || pap?.title || ""} disabled />
          </div>

          <div className="space-y-2">
            <Label>Weight</Label>
            <AmountInput
              value={categoryDraft.weight}
              onChange={(value) => setCategoryDraft((current) => ({ ...current, weight: value ?? "" }))}
              placeholder="Enter weight"
            />
          </div>

          <div className="space-y-2">
            <Label>Allocated Budget</Label>
            <AmountInput
              value={categoryDraft.amount}
              onChange={(value) => setCategoryDraft((current) => ({ ...current, amount: value ?? "" }))}
              placeholder="Enter allocated budget"
            />
          </div>

          <div className="flex justify-end gap-2 border-t pt-4">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="button" className="bg-slate-900 hover:bg-slate-800" onClick={onSave}>
              Save MFO/PAP
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
