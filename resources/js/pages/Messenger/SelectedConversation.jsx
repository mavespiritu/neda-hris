import { useState } from "react"
import { MoreHorizontal, PencilLine, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
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
import RecipientComposer from "./RecipientComposer"
import { MessengerConversationAvatar } from "@/components/MessengerConversationRow"
import { useMessengerShared } from "@/providers/MessengerSharedProvider"

export default function SelectedConversation({
  me,
  safeUsers = [],
  activeConversation,
  selectedUserIds = [],
  setSelectedUserIds,
  isComposing = false,
  onlineUserIds,
  avatarUrl,
  typingUser,
  startConversation,
  onPreviewConversation,
  resolveDirectConversationId,
  onDeleteConversation,
  onRenameConversation,
}) {
  const { onlineUserIds: sharedOnlineUserIds } = useMessengerShared()
  const resolvedOnlineUserIds = onlineUserIds ?? sharedOnlineUserIds
  const [actionOpen, setActionOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [renameOpen, setRenameOpen] = useState(false)
  const [renameValue, setRenameValue] = useState("")
  const directOtherUserId = Number(activeConversation?.other_user_id ?? 0)
  const canShowDirectStatus = Number.isFinite(directOtherUserId) && directOtherUserId > 0

  const openRename = () => {
    if (!activeConversation?.id) return
    setActionOpen(false)
    setRenameValue(activeConversation?.title || activeConversation?.name || "")
    setRenameOpen(true)
  }

  const confirmRename = () => {
    const nextTitle = String(renameValue || "").trim()
    if (!nextTitle || !activeConversation?.id) return

    setRenameOpen(false)
    onRenameConversation?.(activeConversation.id, nextTitle)
  }

  const confirmDelete = () => {
    if (!activeConversation?.id) return

    setDeleteOpen(false)
    onDeleteConversation?.(activeConversation.id)
  }

  return (
    <div className="shrink-0 border-b pb-2 mb-2">
      {isComposing ? (
        <RecipientComposer
          me={me}
          safeUsers={safeUsers}
          selectedUserIds={selectedUserIds}
          setSelectedUserIds={setSelectedUserIds}
          startConversation={startConversation}
          onPreviewConversation={onPreviewConversation}
          resolveDirectConversationId={resolveDirectConversationId}
          onlineUserIds={resolvedOnlineUserIds}
          avatarUrl={avatarUrl}
          autoOpen={isComposing}
        />
      ) : activeConversation ? (
        <div className="group relative space-y-2 pr-12">
          <div className="flex items-center gap-3">
            <MessengerConversationAvatar
              conversation={activeConversation}
              safeUsers={safeUsers}
              meId={me?.id}
              avatarUrl={avatarUrl}
              onlineUserIds={resolvedOnlineUserIds}
              directStatusSize="h-3 w-3"
            />

            <div className="min-w-0 flex-1">
              <div className="font-semibold text-sm truncate">{activeConversation.name}</div>
              <div className="text-xs text-slate-500">
                {typingUser
                  ? `${typingUser.name} is typing...`
                  : activeConversation.type === "direct" && canShowDirectStatus
                  ? resolvedOnlineUserIds.has(directOtherUserId)
                    ? "Online"
                    : "Offline"
                  : activeConversation.type === "direct"
                  ? "Conversation"
                  : "Conversation"}
              </div>
            </div>
          </div>

          <Popover open={actionOpen} onOpenChange={setActionOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 z-20 h-8 w-8 transition hover:bg-muted"
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
              {activeConversation.type === "group" && (
                <button
                  type="button"
                  className="flex w-full items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
                  onClick={openRename}
                >
                  <PencilLine className="mr-2 h-4 w-4" />
                  Change chat name
                </button>
              )}
              <button
                type="button"
                className="flex w-full items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground text-red-600"
                onClick={() => {
                  setActionOpen(false)
                  setDeleteOpen(true)
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete chat
              </button>
            </PopoverContent>
          </Popover>
        </div>
      ) : (
        <div className="text-sm text-slate-500">Select a conversation</div>
      )}

      <AlertDialog open={deleteOpen} onOpenChange={(open) => !open && setDeleteOpen(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete chat?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the chat from your conversation list only. Other participants may still keep their copy.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={renameOpen} onOpenChange={(open) => !open && setRenameOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change chat name</DialogTitle>
            <DialogDescription>Rename this group conversation.</DialogDescription>
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
            <Button type="button" variant="outline" onClick={() => setRenameOpen(false)}>
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
