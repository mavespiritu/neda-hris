import { useMemo, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ExternalLink, RotateCw } from "lucide-react"

const previewableImageExtensions = ["jpg", "jpeg", "png", "gif", "webp", "svg"]

const getFileUrl = (file) => {
  if (!file) return ""

  if (file.preview_url) return file.preview_url
  if (file.id) return route("files.preview", file.id)

  const filePath = file?.path || file?.filepath || ""

  if (!filePath) return ""
  if (/^https?:\/\//i.test(filePath)) return filePath
  if (filePath.startsWith("/storage/")) return filePath

  return "/storage/" + filePath.replace(/^\/+/, "")
}

const getExtension = (file) => {
  const fileType = (file?.type || file?.filetype || "").toLowerCase()
  const filePath = (file?.path || file?.filepath || "").toLowerCase()

  if (fileType.includes("/")) {
    return fileType.split("/").pop()
  }

  if (filePath.includes(".")) {
    return filePath.split(".").pop()
  }

  return ""
}

const AttachmentPreviewDialog = ({ open, onOpenChange, file, title }) => {
  const [rotation, setRotation] = useState(0)

  const fileUrl = useMemo(() => getFileUrl(file), [file])
  const extension = useMemo(() => getExtension(file), [file])
  const isImage = previewableImageExtensions.includes(extension)
  const isPdf = extension === "pdf"

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360)
  }

  const handleOpenChange = (nextOpen) => {
    if (!nextOpen) {
      setRotation(0)
    }

    onOpenChange(nextOpen)
  }



  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-5xl w-full h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title || file?.filename || file?.name || "Attachment Preview"}</DialogTitle>
          <DialogDescription>Preview the attachment before opening it.</DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-end gap-2">
          {(isImage || isPdf) && (
            <Button type="button" variant="outline" size="sm" onClick={handleRotate}>
              <RotateCw className="mr-2 h-4 w-4" />
              Rotate
            </Button>
          )}
          {fileUrl && (
            <Button type="button" variant="outline" size="sm" asChild>
              <a href={fileUrl} target="_blank" rel="noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Open in New Tab
              </a>
            </Button>
          )}
        </div>

        <div className="flex-1 min-h-0 overflow-auto rounded-md border bg-muted/20 p-4">
          {!fileUrl ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              No attachment available for preview.
            </div>
          ) : isImage ? (
            <div className="flex min-h-full items-center justify-center">
              <img
                src={fileUrl}
                alt={title || "Attachment preview"}
                className="max-w-full object-contain transition-transform duration-200"
                style={{ transform: `rotate(${rotation}deg)` }}
              />
            </div>
          ) : isPdf ? (
            <div className="flex min-h-full items-center justify-center overflow-auto">
              <iframe
                src={fileUrl}
                title={title || "PDF preview"}
                className="h-[72vh] w-full bg-white transition-transform duration-200"
                style={{ transform: `rotate(${rotation}deg)`, transformOrigin: "center center" }}
              />
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Preview is available for image and PDF attachments only. Use "Open in New Tab" for this file.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default AttachmentPreviewDialog
