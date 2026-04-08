import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function CategoryCreateDialog({
  open,
  onOpenChange,
  value,
  onValueChange,
  onCancel,
  onCreate,
  creating,
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Category</DialogTitle>
          <DialogDescription>Type the new category you want to add to this OPCR planning tree.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Category</Label>
            <Input value={value} onChange={(event) => onValueChange(event.target.value)} placeholder="Type a new category" />
          </div>

          <div className="flex justify-end gap-2 border-t pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="button" className="bg-slate-900 hover:bg-slate-800" onClick={onCreate} disabled={creating || !value.trim()}>
              {creating ? "Adding..." : "Create & Add Category"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
