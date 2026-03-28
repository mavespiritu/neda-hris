import { useEffect, useMemo, useRef, useState } from "react"
import axios from "axios"
import { Link } from "@inertiajs/react"
import { ChevronRight, MessageSquareMore, MessageSquarePlus, MoreHorizontal, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { useConversationReadSync, useMessengerShared } from "@/providers/MessengerSharedProvider"
import { MessengerConversationRow } from "@/components/MessengerConversationRow"
import MessengerGroupMembersDialog from "@/components/MessengerGroupMembersDialog"
import {
  isConversationListNearBottom,
  mergeConversationPages,
  resolveConversationHasMore,
  sortConversationsByRecent,
} from "@/lib/messengerConversationPagination"
import { applyConversationMembershipUpdate, pushConversationRecentSender } from "@/lib/messengerConversationMembership"

const CONVO_LIMIT = 10

const formatRelativeTime = (value) => {
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

const isStickerPreview = (value) => typeof value === "string" && value.startsWith("__sticker__:")
const isImageAttachment = (conversation) =>
  String(conversation?.last_message_attachment_type || "").toLowerCase().startsWith("image/")

const formatPreview = (conversation) => {
  const senderName = conversation?.last_message_sender_name || "Someone"

  if (isStickerPreview(conversation?.last_message)) {
    return "Sticker"
  }

  if (conversation?.last_message_attachment_path) {
    return isImageAttachment(conversation)
      ? `${senderName} sent an image`
      : `${senderName} sent an attachment`
  }

  return conversation?.last_message || "No message yet"
}

export default function MessengerMiniInbox({
  userId,
  meId = null,
  me = null,
  users = [],
  onOpenConversation,
  onComposeNewMessage,
  isMessengerPage = false,
}) {
  const [open, setOpen] = useState(false)
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [actionConversationId, setActionConversationId] = useState(null)
  const [membersConversation, setMembersConversation] = useState(null)
  const listRef = useRef(null)
  const { onlineUserIds, markConversationRead } = useMessengerShared()
  useConversationReadSync(setConversations)
  const safeUsers = useMemo(() => {
    const map = new Map()

    for (const user of users || []) {
      if (user?.id == null) continue
      if (!map.has(user.id)) map.set(user.id, user)
    }

    return [...map.values()]
  }, [users])

  const buildRecentSenderSnapshot = (sender = {}) => ({
    id: Number(sender?.id || 0),
    ipms_id: sender?.ipms_id ?? null,
    name: sender?.name ?? "Member",
    avatar: sender?.avatar || (sender?.ipms_id ? `/employees/image/${sender.ipms_id}` : null),
  })

  const buildSelfAvatar = () => {
    const selfUser = meId != null
      ? safeUsers.find((user) => Number(user?.id) === Number(meId)) || null
      : null

    return selfUser
      ? {
          id: Number(selfUser.id),
          ipms_id: selfUser.ipms_id ?? null,
          name: selfUser.name || "You",
          avatar: selfUser.avatar || (selfUser.ipms_id ? `/employees/image/${selfUser.ipms_id}` : null),
        }
      : null
  }

  const fetchConversations = async ({ beforeId = null, append = false, silent = false } = {}) => {
    if (!userId) return

    if (!silent) {
      if (append) setLoadingMore(true)
      else setLoading(true)
    }

    try {
      const params = { limit: CONVO_LIMIT }
      if (beforeId) params.before_id = beforeId

      const res = await axios.get(route("messenger.conversations"), { params })
      const chunk = Array.isArray(res.data?.data) ? res.data.data : []
      const hasMoreFromApi = res.data?.has_more

      setHasMore(resolveConversationHasMore(hasMoreFromApi, chunk.length, CONVO_LIMIT))

      if (append) {
        setConversations((prev) => mergeConversationPages(prev, chunk))
      } else {
        setConversations(sortConversationsByRecent(chunk))
      }
    } catch {
      if (!append) setConversations([])
    } finally {
      if (!silent) {
        if (append) setLoadingMore(false)
        else setLoading(false)
      }
    }
  }

  useEffect(() => {
    void fetchConversations()
  }, [userId, meId])

  useEffect(() => {
    if (open && userId && conversations.length === 0) {
      void fetchConversations()
    }
  }, [open, userId, conversations.length])

  useEffect(() => {
    if (typeof window === "undefined") return undefined

    const handleConversationSync = (event) => {
      const conversationId = Number(event?.detail?.conversationId || 0)
      if (conversationId) {
        void fetchConversations({ silent: true })
      }
    }

    window.addEventListener("messenger:conversation-sync", handleConversationSync)
    return () => window.removeEventListener("messenger:conversation-sync", handleConversationSync)
  }, [userId, open, conversations.length])

  useEffect(() => {
    if (!open || !userId) return undefined

    const el = listRef.current
    if (!el || loading || loadingMore || !hasMore) return undefined

    const contentFits = el.scrollHeight <= el.clientHeight + 8
    if (!contentFits) return undefined

    const lastId = conversations[conversations.length - 1]?.id
    if (!lastId) return undefined

    const raf = requestAnimationFrame(() => {
      void fetchConversations({ beforeId: lastId, append: true, silent: true })
    })

    return () => cancelAnimationFrame(raf)
  }, [open, userId, conversations, loading, loadingMore, hasMore])

  const handleConversationScroll = () => {
    const el = listRef.current
    if (!el || loading || loadingMore || !hasMore) return

    if (!isConversationListNearBottom(el)) return

    const lastId = conversations[conversations.length - 1]?.id
    if (lastId) {
      void fetchConversations({ beforeId: lastId, append: true })
    }
  }

  useEffect(() => {
    if (!userId || !window.Echo) return undefined

    const channel = window.Echo.private(`user.${userId}`)

    channel.listen(".messenger.conversation.ping", (e) => {
      setConversations((prev) => {
        const idx = prev.findIndex((conversation) => Number(conversation.id) === Number(e.conversation_id))
        const unreadDelta = Number(e.sender_id) === Number(userId) ? 0 : 1
        const senderSnapshot = buildRecentSenderSnapshot({
          id: e.sender_id,
          ipms_id: e.sender_ipms_id,
          name: e.sender_name,
          avatar: e.sender_avatar,
        })

        if (idx >= 0) {
          const current = prev[idx]
          const selfAvatar = buildSelfAvatar()
          const participants = Array.isArray(e.participants) ? e.participants : current.participants ?? []
          const updated = {
            ...current,
            last_message: e.last_message ?? current.last_message ?? null,
            last_message_at: e.last_message_at ?? current.last_message_at ?? null,
            last_message_sender_name: e.sender_name ?? current.last_message_sender_name ?? null,
            last_message_attachment_path: e.last_message_attachment_path ?? current.last_message_attachment_path ?? null,
            last_message_attachment_url: e.last_message_attachment_url ?? current.last_message_attachment_url ?? null,
            last_message_attachment_name: e.last_message_attachment_name ?? current.last_message_attachment_name ?? null,
            last_message_attachment_type: e.last_message_attachment_type ?? current.last_message_attachment_type ?? null,
            title: e.conversation_title ?? current.title ?? null,
            conversation_token: e.conversation_token ?? current.conversation_token ?? null,
            name: e.conversation_type === "group"
              ? (e.conversation_title || current.name || "Conversation")
              : (current.name || e.sender_name || "Conversation"),
            participants,
            recent_senders: participants.length === 1 && selfAvatar
              ? [selfAvatar, ...participants]
              : participants,
            unread_count: Math.max(0, Number(current.unread_count || 0) + unreadDelta),
            type: e.conversation_type || current.type,
          }

          const next = [...prev]
          next.splice(idx, 1)
          next.unshift(updated)
          return pushConversationRecentSender(sortConversationsByRecent(next), e.conversation_id, senderSnapshot)
        }

        const next = [
          {
            id: Number(e.conversation_id),
            type: e.conversation_type || "direct",
            name: e.conversation_type === "group"
              ? (e.conversation_title || "Conversation")
              : (e.sender_name || "Conversation"),
            title: e.conversation_title || null,
            conversation_token: e.conversation_token ?? null,
            other_user_id: e.conversation_type === "direct" ? Number(e.sender_id) : null,
            other_user_ipms_id: e.conversation_type === "direct" ? (e.sender_ipms_id ?? null) : null,
            other_user_avatar: e.conversation_type === "direct" && e.sender_ipms_id
              ? `/employees/image/${e.sender_ipms_id}`
              : "https://www.gravatar.com/avatar/?d=mp&s=200",
            participants: Array.isArray(e.participants) ? e.participants : [],
            last_message: e.last_message,
            last_message_sender_name: e.sender_name ?? null,
            last_message_attachment_path: e.last_message_attachment_path ?? null,
            last_message_attachment_url: e.last_message_attachment_url ?? null,
            last_message_attachment_name: e.last_message_attachment_name ?? null,
            last_message_attachment_type: e.last_message_attachment_type ?? null,
            last_message_at: e.last_message_at,
            unread_count: unreadDelta,
            recent_senders: [],
          },
          ...prev,
        ]
        return pushConversationRecentSender(sortConversationsByRecent(next), e.conversation_id, senderSnapshot)
      })
    })

    channel.listen(".messenger.conversation.renamed", (e) => {
      if (!e?.conversation_id) return

      setConversations((prev) =>
        prev.map((conversation) =>
          Number(conversation.id) === Number(e.conversation_id)
            ? {
                ...conversation,
                type: "group",
                title: e.title ?? conversation.title ?? null,
                name: e.name ?? e.title ?? conversation.name ?? "Conversation",
              }
            : conversation
        )
      )
    })

    channel.listen(".messenger.conversation.members-updated", (e) => {
      if (!e?.conversation_id) return

      const removedUserIds = Array.isArray(e.removed_user_ids) ? e.removed_user_ids.map((id) => Number(id)) : []
      const removedForMe = Number(meId) > 0 && removedUserIds.includes(Number(meId))
      const deleted = Boolean(e.deleted)

      setConversations((prev) => applyConversationMembershipUpdate(prev, e, meId).conversations)

      if (removedForMe || deleted) {
        setActionConversationId((current) => (Number(current) === Number(e.conversation_id) ? null : current))
        setMembersConversation((current) =>
          Number(current?.id) === Number(e.conversation_id) ? null : current
        )
      }
    })

    return () => {
      window.Echo.leave(`private-user.${userId}`)
    }
  }, [userId])

  useEffect(() => {
    if (!membersConversation?.id) return

    const latestConversation = conversations.find(
      (conversation) => Number(conversation.id) === Number(membersConversation.id)
    )

    if (latestConversation && latestConversation !== membersConversation) {
      setMembersConversation(latestConversation)
    }
  }, [conversations, membersConversation?.id])

  const unreadCount = useMemo(
    () => conversations.reduce((sum, conversation) => sum + Number(conversation.unread_count || 0), 0),
    [conversations]
  )

  const loadingSkeletonRows = Array.from({ length: 4 }, (_, index) => index)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="ghost" size="icon" className="relative h-9 w-9">
          <MessageSquareMore className="h-4 w-4" />
          {unreadCount > 0 ? (
            <Badge className="absolute -right-1 -top-1 h-5 min-w-5 justify-center rounded-full px-1 text-[10px]">
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          ) : null}
          <span className="sr-only">Open messages</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" sideOffset={10} className="w-[22rem] p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <div className="text-sm font-semibold">Messages</div>
            <div className="text-xs text-muted-foreground">Recent conversations</div>
          </div>
          {onComposeNewMessage ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                setOpen(false)
                onComposeNewMessage()
              }}
              aria-label="New message"
              title="New message"
            >
              <MessageSquarePlus className="h-4 w-4" />
            </Button>
          ) : !isMessengerPage ? (
            <Button type="button" variant="ghost" size="sm" asChild>
              <Link href={route("messenger.index")}>Open Messenger</Link>
            </Button>
          ) : null}
        </div>

        <div
          ref={listRef}
          onScroll={handleConversationScroll}
          className="max-h-[26rem] overflow-y-auto"
        >
          {loading && conversations.length === 0 ? (
            <div className="space-y-2 p-3">
              {loadingSkeletonRows.map((row) => (
                <div key={row} className="flex items-center gap-3 rounded-xl px-2 py-2">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-3.5 w-2/3" />
                    <Skeleton className="h-3 w-5/6" />
                  </div>
                </div>
              ))}
            </div>
          ) : conversations.length ? (
            <div className="p-2">
              {conversations.map((conversation) => (
                <MessengerConversationRow
                  key={conversation.id}
                  conversation={conversation}
                  me={me}
                  safeUsers={safeUsers}
                  meId={meId}
                  onlineUserIds={onlineUserIds}
                  previewText={formatPreview(conversation)}
                  timeLabel={formatRelativeTime(conversation.last_message_at)}
                  unreadCount={conversation.unread_count}
                  showUnreadBadge={true}
                  trailing={
                    conversation.type === "group" ? (
                      <Popover
                        open={actionConversationId === conversation.id}
                        onOpenChange={(open) => setActionConversationId(open ? conversation.id : null)}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(event) => {
                              event.stopPropagation()
                              setActionConversationId((current) =>
                                Number(current) === Number(conversation.id) ? null : conversation.id
                              )
                            }}
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
                          <button
                            type="button"
                            className="flex w-full items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
                            onClick={() => {
                              setActionConversationId(null)
                              setMembersConversation(conversation)
                              setOpen(true)
                            }}
                          >
                            <Users className="mr-2 h-4 w-4" />
                            Manage members
                          </button>
                        </PopoverContent>
                      </Popover>
                    ) : (
                      <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
                    )
                  }
                  onClick={() => {
                    markConversationRead(conversation.id)
                    setOpen(false)

                    if (onOpenConversation) {
                      onOpenConversation(conversation)
                    }
                  }}
                  href={
                    onOpenConversation
                      ? null
                      : (conversation.conversation_token
                        ? route("messenger.conversation", conversation.conversation_token)
                        : route("messenger.index"))
                  }
                />
              ))}
              {loadingMore ? (
                <div className="space-y-2 px-3 pb-3 pt-1">
                  {loadingSkeletonRows.slice(0, 2).map((row) => (
                    <div key={`more-${row}`} className="flex items-center gap-3 rounded-xl px-2 py-2">
                      <Skeleton className="h-9 w-9 rounded-full" />
                      <div className="min-w-0 flex-1 space-y-2">
                        <Skeleton className="h-3.5 w-1/2" />
                        <Skeleton className="h-3 w-4/5" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="p-4 text-sm text-center text-slate-500">No recent conversations yet.</div>
          )}
        </div>

        {!isMessengerPage ? (
          <>
            <Separator />
            <div className="flex items-center justify-end px-4 py-3">
              <Button type="button" variant="outline" asChild>
                <Link href={route("messenger.index")}>Go to Messenger</Link>
              </Button>
            </div>
          </>
        ) : null}

              <MessengerGroupMembersDialog
          open={Boolean(membersConversation)}
          onOpenChange={(open) => {
            if (!open) setMembersConversation(null)
          }}
          conversation={membersConversation}
          me={me}
          safeUsers={safeUsers}
          meId={meId}
          onAddMembers={async (conversationUserIds) => {
            if (!membersConversation?.id) return false

            try {
              const res = await axios.post(route("messenger.members", membersConversation.id), {
                action: "add",
                user_ids: conversationUserIds.map((id) => Number(id)),
              })

              if (res.data) {
                setConversations((prev) => applyConversationMembershipUpdate(prev, res.data, meId).conversations)
                void fetchConversations({ silent: true })
              }

              return res.data || true
            } catch (error) {
              console.log("messenger.members add error:", error.response?.data || error)
              return false
            }
          }}
          onRemoveMember={async (userId) => {
            if (!membersConversation?.id) return false

            try {
              const res = await axios.post(route("messenger.members", membersConversation.id), {
                action: "remove",
                user_ids: [Number(userId)],
              })

              if (res.data) {
                setConversations((prev) => applyConversationMembershipUpdate(prev, res.data, meId).conversations)
                void fetchConversations({ silent: true })
              }

              return res.data || true
            } catch (error) {
              console.log("messenger.members remove error:", error.response?.data || error)
              return false
            }
          }}
          onLeaveGroup={async () => {
            if (!membersConversation?.id) return false

            try {
              const res = await axios.post(route("messenger.members", membersConversation.id), {
                action: "leave",
              })

              if (res.data) {
                setConversations((prev) => applyConversationMembershipUpdate(prev, res.data, meId).conversations)
                void fetchConversations({ silent: true })
              }

              setMembersConversation(null)
              setOpen(false)
              return res.data || true
            } catch (error) {
              console.log("messenger.members leave error:", error.response?.data || error)
              return false
            }
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
