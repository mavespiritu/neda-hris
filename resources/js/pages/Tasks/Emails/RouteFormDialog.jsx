import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

export default function RouteFormDialog({
  open,
  onOpenChange,
  routeForm,
  setRouteForm,
  onCopy,
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Delegate / Route Email</DialogTitle>
          <DialogDescription>
            Copy a routing note you can paste into your task workflow or forward message.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="route_to">Route To</Label>
            <Select
              value={routeForm.route_to}
              onValueChange={(value) => setRouteForm((prev) => ({ ...prev, route_to: value }))}
            >
              <SelectTrigger id="route_to">
                <SelectValue placeholder="Select route" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="For action">For action</SelectItem>
                <SelectItem value="For review">For review</SelectItem>
                <SelectItem value="For information">For information</SelectItem>
                <SelectItem value="For escalation">For escalation</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="route_note">Routing note</Label>
            <Textarea
              id="route_note"
              value={routeForm.note}
              onChange={(e) => setRouteForm((prev) => ({ ...prev, note: e.target.value }))}
              placeholder="Add instructions or context for the next person handling this email."
              className="min-h-32"
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={onCopy}>
            Copy routing note
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
