import { useEffect, useMemo, useState } from "react"
import { Plus, Trash2, Users } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import RecipientComposer from "@/pages/Messenger/RecipientComposer"

export default function MessengerGroupMembersDialog({
  open,
  onOpenChange,
  conversation,
  me = null,
  safeUsers = [],
  meId = null,
  avatarUrl = (ipmsId) => (ipmsId ? `/employees/image/${ipmsId}` : "https://www.gravatar.com/avatar/?d=mp&s=200"),
  onAddMembers,
  onRemoveMember,
}) {
  const buildPersonName = (person = {}) => {
    const parts = [
      person?.first_name,
      person?.middle_name,
      person?.last_name,
    ]
      .map((part) => String(part || "").trim())
      .filter(Boolean)

    if (parts.length) {
      return parts.join(" ")
    }

    return String(person?.name || person?.email || "You").trim()
  }

  const [selectedUserIds, setSelectedUserIds] = useState([])
  const [adding, setAdding] = useState(false)
  const [removingMemberId, setRemovingMemberId] = useState(null)
  const [visibleMembers, setVisibleMembers] = useState(conversation?.participants || [])

  useEffect(() => {
    if (!open) return
    setVisibleMembers(conversation?.participants || [])
  }, [open, conversation?.id, conversation?.participants])

  const members = useMemo(() => visibleMembers || [], [visibleMembers])
  const hasSelfMember = useMemo(() => {
    if (!me?.id) return false
    return members.some((member) => Number(member.id) === Number(me.id))
  }, [members, me?.id])
  const selfMember = useMemo(() => {
    if (!conversation?.id || conversation?.type !== "group" || !me?.id || hasSelfMember) return null

    return {
      id: Number(me.id),
      ipms_id: me.ipms_id ?? null,
      name: buildPersonName(me),
      email: me.email ?? "",
      avatar: me.avatar || (me.ipms_id ? `/employees/image/${me.ipms_id}` : "https://www.gravatar.com/avatar/?d=mp&s=200"),
      self: true,
    }
  }, [conversation?.id, conversation?.type, me?.id, me?.ipms_id, me?.name, me?.email, me?.avatar, me?.first_name, me?.middle_name, me?.last_name, hasSelfMember])

  const allMembers = useMemo(() => (selfMember ? [selfMember, ...members] : members), [selfMember, members])
  const memberIds = useMemo(
    () => allMembers.map((member) => Number(member.id)).filter((id) => Number.isFinite(id) && id > 0),
    [allMembers]
  )
  const totalMemberCount = useMemo(() => {
    const base = members.length
    if (conversation?.type !== "group") return base
    return hasSelfMember ? base : base + 1
  }, [members.length, conversation?.type, hasSelfMember])

  useEffect(() => {
    if (!open) {
      setSelectedUserIds([])
      setAdding(false)
      setRemovingMemberId(null)
    }
  }, [open])

  const confirmAddMembers = async () => {
    if (!selectedUserIds.length || adding) return

    setAdding(true)
    try {
      const result = await onAddMembers?.(selectedUserIds.map((id) => Number(id)))
      if (result) {
        if (Array.isArray(result.participants)) {
          setVisibleMembers(result.participants)
        }
        setSelectedUserIds([])
      }
    } finally {
      setAdding(false)
    }
  }

  const confirmRemoveMember = async (memberId) => {
    if (!memberId || removingMemberId) return

    const targetId = Number(memberId)
    const snapshotMembers = visibleMembers
    setRemovingMemberId(targetId)
    setVisibleMembers((prev) => prev.filter((member) => Number(member.id) !== targetId))
    try {
      const result = await onRemoveMember?.(targetId)
      if (result && Array.isArray(result.participants)) {
        setVisibleMembers(result.participants)
      }
    } catch {
      setVisibleMembers(snapshotMembers)
    } finally {
      setRemovingMemberId(null)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-visible">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Manage group members
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {totalMemberCount}
              </span>
            </DialogTitle>
            <DialogDescription>
              Add people, remove members, or leave this group chat.
            </DialogDescription>
          </DialogHeader>

          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-visible">
            <div className="flex min-h-0 flex-none flex-col rounded-xl border bg-muted/20 p-3 max-h-[24rem] overflow-visible">
              <div className="mb-3 flex items-center justify-between text-sm font-medium">
                <span>Add people</span>
                <span className="rounded-full bg-background px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {totalMemberCount} members
                </span>
              </div>
              <div className="min-h-0 flex-1 overflow-visible">
                <RecipientComposer
                  me={me}
                  safeUsers={safeUsers}
                  selectedUserIds={selectedUserIds}
                  setSelectedUserIds={setSelectedUserIds}
                  excludeUserIds={memberIds}
                  onPreviewConversation={() => {}}
                  resolveDirectConversationId={() => null}
                  avatarUrl={avatarUrl}
                  keepOpenOnSelect
                  compact
                  floatingDropdown
                />
              </div>

              <div className="mt-3 flex items-center justify-end">
                <Button
                  type="button"
                  onClick={confirmAddMembers}
                  disabled={!selectedUserIds.length || adding}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  {adding ? "Adding..." : "Add people"}
                </Button>
              </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col rounded-xl border bg-background p-3">
              <div className="mb-3 flex items-center justify-between text-sm font-medium">
                <span>Current members</span>
                <span className="text-xs text-muted-foreground">{totalMemberCount} total</span>
              </div>
              <ScrollArea className="h-56 pr-3">
                <div className="space-y-2">
                  {allMembers.length ? (
                    allMembers.map((member) => (
                      <div key={member.id} className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
                        <div className="flex min-w-0 items-center gap-3">
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarImage
                              src={member.avatar || avatarUrl(member.ipms_id)}
                              alt={member.name}
                              loading="lazy"
                            />
                            <AvatarFallback className="text-[10px]">
                              {(member.name || "U")
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .slice(0, 2)
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium">{member.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {member.self || Number(member.id) === Number(meId) ? "You" : "Member"}
                            </div>
                          </div>
                        </div>

                        {!member.self && Number(member.id) !== Number(meId) ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="gap-2 text-red-600 hover:text-red-700"
                            onClick={() => void confirmRemoveMember(member.id, member.name)}
                            disabled={removingMemberId !== null}
                          >
                            <Trash2 className="h-4 w-4" />
                            {removingMemberId === Number(member.id) ? "Removing..." : "Remove"}
                          </Button>
                        ) : null}
                      </div>
                    ))
                  ) : (
                    <div className="rounded-lg border border-dashed px-3 py-4 text-center text-sm text-muted-foreground">
                      No members found.
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange?.(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
