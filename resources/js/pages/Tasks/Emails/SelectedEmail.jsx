import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ExternalLink, MailOpen, Paperclip, Users2 } from "lucide-react"

const formatBytes = (bytes) => {
  if (!bytes) return "-"

  const units = ["B", "KB", "MB", "GB"]
  let value = Number(bytes)
  let unitIndex = 0

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024
    unitIndex += 1
  }

  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`
}

const buildAttachmentPreview = (attachment) => {
  if (!attachment?.contentBytes) return null

  const contentType = attachment.contentType || "application/octet-stream"
  return `data:${contentType};base64,${attachment.contentBytes}`
}

const isImageAttachment = (attachment) => (attachment?.contentType || "").toLowerCase().startsWith("image/")

export default function SelectedEmail({
  selectedMessage,
  selectedMessageSummary,
  selectedMessageId,
  isLoadingDetail,
  onOpenRoute,
  onOpenOutlook,
  formatDateTime,
}) {
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewAttachment, setPreviewAttachment] = useState(null)
  const [rotation, setRotation] = useState(0)

  const openPreview = (attachment) => {
    setPreviewAttachment(attachment)
    setRotation(0)
    setPreviewOpen(true)
  }

  const previewUrl = buildAttachmentPreview(previewAttachment)

  return (
    <>
      <Card className="min-h-[72vh] overflow-hidden border-slate-200 bg-white/90 shadow-sm">
        <CardHeader className="border-b bg-slate-50/80">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-xl">
                {selectedMessage?.subject || selectedMessageSummary?.subject || "Select an email"}
              </CardTitle>
              <CardDescription>
                {selectedMessage?.senderName || selectedMessage?.from || selectedMessageSummary?.senderName || selectedMessageSummary?.from || "-"}
              </CardDescription>
            </div>

            <div className="flex flex-wrap gap-2">
              {onOpenOutlook ? (
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2"
                  onClick={onOpenOutlook}
                  disabled={!selectedMessageId}
                >
                  <ExternalLink className="h-4 w-4" />
                  Open in Outlook
                </Button>
              ) : null}

              <Button className="gap-2" onClick={onOpenRoute} disabled={!selectedMessageId}>
                <Users2 className="h-4 w-4" />
                Delegate / Route
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="h-[calc(72vh-84px)] p-0">
          {!selectedMessageId ? (
            <div className="flex h-full items-center justify-center p-8 text-sm text-slate-500">
              Select an email from the inbox to preview it here.
            </div>
          ) : isLoadingDetail && !selectedMessage ? (
            <div className="flex h-full items-center justify-center p-8 text-sm text-slate-500">
              Loading message...
            </div>
          ) : selectedMessage ? (
            <div className="flex h-full flex-col">
              <div className="grid gap-4 border-b p-5 text-sm text-slate-600 sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">Received</p>
                  <p className="mt-1 font-medium text-xs text-slate-900">
                    {formatDateTime ? formatDateTime(selectedMessage.receivedAt) : selectedMessage.receivedAt || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">Recipients</p>
                  <p className="mt-1 font-medium text-xs text-slate-900">
                    {[...(selectedMessage.toRecipients || []), ...(selectedMessage.ccRecipients || [])].join(", ") || "-"}
                  </p>
                </div>
              </div>

              <ScrollArea className="flex-1">
                <div className="space-y-4 p-5">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                    <div className="flex flex-wrap items-center gap-2 text-sm text-slate-700">
                      <Badge variant="secondary" className="gap-1">
                        <MailOpen className="h-3.5 w-3.5" />
                        {selectedMessage.isRead ? "Read" : "Unread"}
                      </Badge>
                      {selectedMessage.hasAttachments && (
                        <Badge variant="outline" className="gap-1">
                          <Users2 className="h-3.5 w-3.5" />
                          Has attachments
                        </Badge>
                      )}
                    </div>
                    <div className="mt-3 text-sm text-slate-500">
                      {selectedMessage.preview || "No preview available."}
                    </div>
                  </div>

                  {selectedMessage.attachments?.length ? (
                    <div className="rounded-2xl border border-slate-200 bg-white p-5">
                      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <Paperclip className="h-4 w-4" />
                        Attachments
                      </div>
                      <div className="space-y-2">
                        {selectedMessage.attachments.map((attachment) => (
                          <button
                            key={attachment.id || attachment.name}
                            type="button"
                            onClick={() => openPreview(attachment)}
                            className="flex w-full items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2 text-left transition hover:bg-slate-50"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-slate-900">{attachment.name}</p>
                              <p className="text-xs text-slate-500">
                                {attachment.contentType || "Unknown type"} · {formatBytes(attachment.size)}
                              </p>
                            </div>
                            <span className="text-xs font-medium text-blue-600">Preview</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : selectedMessage.hasAttachments ? (
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500">
                      Attachments are present, but no previewable file attachments were returned.
                    </div>
                  ) : null}

                  <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <div
                      className="prose max-w-none prose-slate"
                      dangerouslySetInnerHTML={{
                        __html: selectedMessage.bodyType === "html"
                          ? selectedMessage.body || "<p>No body available.</p>"
                          : `<pre class="whitespace-pre-wrap font-sans text-sm">${String(selectedMessage.body || selectedMessage.preview || "No body available.").replace(/<[^>]*>/g, " ")}</pre>`,
                      }}
                    />
                  </div>
                </div>
              </ScrollArea>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center p-8 text-sm text-slate-500">
              No message data available.
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>{previewAttachment?.name || "Attachment Preview"}</DialogTitle>
            <DialogDescription>
              Preview the attached file before opening or downloading it.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span>{previewAttachment?.contentType || "Unknown type"}</span>
              <span>·</span>
              <span>{formatBytes(previewAttachment?.size)}</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {isImageAttachment(previewAttachment) ? (
                <Button type="button" variant="outline" size="sm" onClick={() => setRotation((prev) => (prev + 90) % 360)}>
                  Rotate
                </Button>
              ) : null}
              {previewUrl ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(previewUrl, "_blank", "noreferrer")}
                >
                  Open in New Tab
                </Button>
              ) : null}
            </div>

            <div className="max-h-[70vh] overflow-hidden rounded-xl border bg-slate-50">
              {previewUrl && isImageAttachment(previewAttachment) ? (
                <div className="flex max-h-[70vh] items-center justify-center overflow-auto p-4">
                  <img
                    src={previewUrl}
                    alt={previewAttachment?.name || "Attachment preview"}
                    className="max-h-[65vh] max-w-full object-contain"
                    style={{ transform: `rotate(${rotation}deg)` }}
                  />
                </div>
              ) : previewUrl && (previewAttachment?.contentType || "").toLowerCase() === "application/pdf" ? (
                <iframe
                  title={previewAttachment?.name || "PDF preview"}
                  src={previewUrl}
                  className="h-[70vh] w-full border-0"
                />
              ) : (
                <div className="p-6 text-sm text-slate-600">
                  This file type does not have an inline preview. Use the button above to open it in a new tab.
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

