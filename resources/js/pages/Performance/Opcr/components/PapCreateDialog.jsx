import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import AmountInput from "@/components/AmountInput"

export default function PapCreateDialog({
  open,
  onOpenChange,
  categoryName,
  value,
  onValueChange,
  weight,
  amount,
  onWeightChange,
  onAmountChange,
  onCancel,
  onCreate,
  creating,
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add MFO/PAP</DialogTitle>
          <DialogDescription>Type the new MFO/PAP you want to add for {categoryName}.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>MFO/PAP</Label>
            <Input value={value} onChange={(event) => onValueChange(event.target.value)} placeholder="Type a new MFO/PAP" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Weight</Label>
              <AmountInput
                value={weight}
                onChange={(nextValue) => onWeightChange(nextValue ?? "")}
                placeholder="Enter weight"
              />
            </div>

            <div className="space-y-2">
              <Label>Allocated Budget</Label>
              <AmountInput
                value={amount}
                onChange={(nextValue) => onAmountChange(nextValue ?? "")}
                placeholder="Enter allocated budget"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="button" className="bg-slate-900 hover:bg-slate-800" onClick={onCreate} disabled={creating || !value.trim()}>
              {creating ? "Adding..." : "Create & Add MFO/PAP"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
