import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import DatePicker from "@/components/DatePicker"
import TextInput from "@/components/TextInput"
import { formatFullName } from "@/lib/utils.jsx"

const RankResultDialog = ({
  open,
  onOpenChange,
  applicant,
  form,
  errors,
  isSaving,
  onSave,
  onChange,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rank Result</DialogTitle>
          <DialogDescription>
            Set or update the applicant rank and the date it was finalized.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div>
            <Label>Applicant</Label>
            <div className="rounded-md border bg-muted/20 px-3 py-2 text-sm">
              {formatFullName(applicant?.name) || "-"}
            </div>
          </div>

          <div>
            <Label>Rank</Label>
            <TextInput
              value={form.rank}
              onChange={(e) => onChange("rank", e.target.value)}
              isInvalid={!!errors.rank}
            />
            {errors.rank && <p className="mt-1 text-xs text-red-500">{errors.rank}</p>}
          </div>

          <div>
            <Label>Date Ranked</Label>
            <DatePicker
              value={form.date_ranked}
              onDateChange={(value) => onChange("date_ranked", value || "")}
              invalidMessage={errors.date_ranked}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="button" onClick={onSave} disabled={isSaving}>
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Rank
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default RankResultDialog
