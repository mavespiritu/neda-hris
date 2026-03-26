import { useState } from "react"
import { Loader2, MessageSquarePlus, MoreHorizontal, Trash2, PencilLine } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { MessengerConversationRow } from "@/components/MessengerConversationRow"

const STICKER_PREVIEWS = {
  heart: "💖",
  like: "👍",
  laugh: "😂",
  celebrate: "🎉",
  hug: "🤗",
  cool: "😎",
}

const formatRelativeMessageTime = (value) => {
  if (!value) return ""

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""

  const diffSeconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000))

  if (diffSeconds < 60) return `${diffSeconds}s`
  if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m`
  if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h`
  if (diffSeconds < 604800) return `${Math.floor(diffSeconds / 86400)}d`

  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(date)
}

const formatConversationPreview = (value) => {
  if (typeof value !== "string") return ""
  return value.startsWith("__sticker__:") ? "" : value
}

const isStickerPreview = (value) => typeof value === "string" && value.startsWith("__sticker__:")
const isImageAttachment = (conversation) =>
  String(conversation?.last_message_attachment_type || "").toLowerCase().startsWith("image/")

const formatRecentConversationPreview = (conversation) => {
  const senderName = conversation?.last_message_sender_name || "Someone"

  if (isStickerPreview(conversation?.last_message)) {
    return ""
  }

  if (conversation?.last_message_attachment_path) {
    return isImageAttachment(conversation)
      ? `${senderName} sent an image`
      : `${senderName} sent an attachment`
  }

  return formatConversationPreview(conversation?.last_message) || "No message yet"
}

const stickerEmojiFromPreview = (value) => {
  if (!isStickerPreview(value)) return ""
  const key = value.split(":")[1] || ""
  return STICKER_PREVIEWS[key] || "✨"
}

export default function Conversations({
  meId,
  onlineUserIds,
  safeUsers = [],
  safeConversations,
  activeId,
  onSelectConversation,
  onNewMessage,
  conversationsLoading,
  loadingMoreConversations,
  convoListRef,
  handleConversationScroll,
  avatarUrl,
  onDeleteConversation,
  onRenameConversation,
}) {
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [actionTargetId, setActionTargetId] = useState(null)
  const [renameTarget, setRenameTarget] = useState(null)
  const [renameValue, setRenameValue] = useState("")

  const openDeleteDialog = (conversation) => {
    setDeleteTarget(conversation)
  }

  const closeDeleteDialog = () => {
    setDeleteTarget(null)
  }

  const openRenameDialog = (conversation) => {
    if (!conversation?.id) return
    setRenameTarget(conversation)
    setRenameValue(conversation?.title || conversation?.name || "")
  }

  const closeRenameDialog = () => {
    setRenameTarget(null)
    setRenameValue("")
  }

  const confirmRename = () => {
    if (!renameTarget?.id) return

    const conversationId = renameTarget.id
    const nextName = renameValue

    closeRenameDialog()
    onRenameConversation?.(conversationId, nextName)
  }

  return (
    <div className="border rounded p-2 min-h-0 flex flex-col overflow-hidden">
      <div className="mb-2 flex items-center justify-between gap-2 shrink-0">
        <div>
          <div className="font-semibold tracking-tight text-lg text-black">Conversations</div>
          <div className="text-xs text-muted-foreground">Browse or start a new message</div>
        </div>

        <button
          type="button"
          onClick={() => {
            setActionTargetId(null)
            onNewMessage?.()
          }}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border bg-background text-muted-foreground transition hover:bg-muted hover:text-foreground"
          aria-label="New message"
          title="New message"
        >
          <MessageSquarePlus className="h-4 w-4" />
        </button>
      </div>

      <div className="relative flex-1 min-h-0">
        <div
          ref={convoListRef}
          onScroll={handleConversationScroll}
          className="h-full overflow-y-auto space-y-1 pr-1 transition"
        >
          {conversationsLoading && safeConversations.length === 0 ? (
            Array.from({ length: 6 }).map((_, index) => (
              <div key={`conversation-skeleton-${index}`} className="flex items-center gap-2 rounded p-2">
                <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-3 w-2/3" />
                  <Skeleton className="h-2.5 w-full" />
                </div>
              </div>
            ))
          ) : (
            safeConversations.map((c) => {
              const previewText = formatRecentConversationPreview(c)
              const isActive = activeId === c.id

              return (
                <div key={`conversation-${c.id}`} className="group relative">
                  <MessengerConversationRow
                    conversation={c}
                    safeUsers={safeUsers}
                    meId={meId}
                    avatarUrl={avatarUrl}
                    onlineUserIds={onlineUserIds}
                    previewText={
                      isStickerPreview(c.last_message) ? `${stickerEmojiFromPreview(c.last_message)} ${previewText}`.trim() : previewText
                    }
                    timeLabel={formatRelativeMessageTime(c.last_message_at)}
                    active={isActive}
                    onClick={() => {
                      setActionTargetId(null)
                      onSelectConversation?.(c.id)
                    }}
                  />

                  <Popover
                    open={actionTargetId === c.id}
                    onOpenChange={(open) => {
                      setActionTargetId(open ? c.id : null)
                    }}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="pointer-events-none absolute right-2 top-1/2 z-30 h-8 w-8 -translate-y-1/2 bg-background/90 shadow-sm opacity-0 transition group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100"
                        onClick={(event) => event.stopPropagation()}
                        aria-label="Conversation actions"
                        title="Conversation actions"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="end" sideOffset={8} className="w-44 p-1">
                      <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                        Chat actions
                      </div>
                      {c.type === "group" && (
                        <button
                          type="button"
                          className="flex w-full items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
                          onClick={() => {
                            setActionTargetId(null)
                            openRenameDialog(c)
                          }}
                        >
                          <PencilLine className="mr-2 h-4 w-4" />
                          Change chat name
                        </button>
                      )}
                      <button
                        type="button"
                        className="flex w-full items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground text-red-600"
                        onClick={() => {
                          setActionTargetId(null)
                          openDeleteDialog(c)
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete chat
                      </button>
                    </PopoverContent>
                  </Popover>
                </div>
              )
            })
          )}

          {!conversationsLoading && safeConversations.length === 0 && (
            <div className="text-xs text-slate-500 text-center py-3">No conversations yet.</div>
          )}
        </div>

        {loadingMoreConversations && !conversationsLoading && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10">
            <div className="rounded-md bg-background/90 px-3 py-2 text-xs flex items-center gap-2 shadow-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading more...</span>
            </div>
          </div>
        )}
      </div>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => (!open ? closeDeleteDialog() : null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete chat?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the chat from your conversation list. Other participants may still keep their copy.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeDeleteDialog}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteTarget?.id) {
                  onDeleteConversation?.(deleteTarget.id)
                }
                closeDeleteDialog()
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={Boolean(renameTarget)} onOpenChange={(open) => (!open ? closeRenameDialog() : null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change chat name</DialogTitle>
            <DialogDescription>
              Rename this group conversation.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <label className="text-sm font-medium">Chat name</label>
            <Input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              placeholder="Enter group chat name"
              autoFocus
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeRenameDialog}>
              Cancel
            </Button>
            <Button type="button" onClick={confirmRename} disabled={!renameValue.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
