import { Loader2, X } from "lucide-react"
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
import SingleComboBox from "@/components/SingleComboBox"
import FileUpload from "@/components/FileUpload"
import { formatFullName } from "@/lib/utils.jsx"

const resultStatuses = [
  { label: "Passed", value: "Passed" },
  { label: "Failed", value: "Failed" },
  { label: "Did Not Attend", value: "Did Not Attend" },
  { label: "Pending", value: "Pending" },
]

const formatSize = (bytes) => {
  if (!bytes) return ""

  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`
}

const ExamResultDialog = ({
  open,
  onOpenChange,
  applicant,
  testType,
  form,
  existingAttachment,
  errors,
  isSaving,
  onSave,
  onChange,
  onAttachmentChange,
  onRemoveAttachment,
}) => {
  const hasExistingAttachment = Boolean(existingAttachment?.id) && !form.removeFiles?.length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{testType || "Exam"} Result</DialogTitle>
          <DialogDescription>
            Record the assessment result and manage its attachment.
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
            <Label>Date Conducted</Label>
            <DatePicker
              value={form.date_conducted}
              onDateChange={(value) => onChange("date_conducted", value || "")}
              invalidMessage={errors.date_conducted}
            />
          </div>

          <div>
            <Label>Status</Label>
            <SingleComboBox
              items={resultStatuses}
              name="status"
              value={form.status}
              onChange={(value) => onChange("status", value || "")}
              placeholder="Select status"
              width="w-full"
              className="w-full"
              labelWidth="w-full"
              invalidMessage={errors.status}
            />
            {errors.status && <p className="mt-1 text-xs text-red-500">{errors.status}</p>}
          </div>

          <div>
            <Label>Score</Label>
            <TextInput
              value={form.score}
              onChange={(e) => onChange("score", e.target.value)}
              isInvalid={!!errors.score}
            />
            {errors.score && <p className="mt-1 text-xs text-red-500">{errors.score}</p>}
          </div>

          <div className="space-y-2">
            <Label>Attachment</Label>

            {hasExistingAttachment ? (
              <div className="rounded-md border bg-muted/20 px-3 py-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {existingAttachment.name || existingAttachment.filename || "Attachment"}
                    </p>
                    {existingAttachment.size ? (
                      <p className="text-xs text-muted-foreground">{formatSize(existingAttachment.size)}</p>
                    ) : null}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-auto px-2 py-1 text-red-500 hover:bg-transparent hover:underline"
                    onClick={() => onRemoveAttachment(existingAttachment.id)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <FileUpload
                  name="attachment"
                  onFilesSelect={(files) => onAttachmentChange(files?.[0] ?? null)}
                  invalidMessage={errors.attachment}
                />
                <div className="mt-1 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span>{form.attachment?.name || "No file selected"}</span>
                  {form.attachment && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 text-red-500 hover:bg-transparent hover:underline"
                      onClick={() => onAttachmentChange(null)}
                    >
                      <X className="h-3 w-3" />
                      Clear
                    </Button>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Allowed file types: PDF, Word, Excel, PowerPoint, or image files. Max 5MB.
                </p>
              </>
            )}

            {errors.attachment && <p className="mt-1 text-xs text-red-500">{errors.attachment}</p>}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="button" onClick={onSave} disabled={isSaving}>
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Result
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ExamResultDialog
