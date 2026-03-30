import { useEffect, useMemo, useRef, useState } from "react"
import { flushSync } from "react-dom"
import axios from "axios"
import { ArrowUpRight, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import RecipientComposer from "@/pages/Messenger/RecipientComposer"
import SelectedConversation from "@/pages/Messenger/SelectedConversation"
import Messages from "@/pages/Messenger/Messages"
import { useConversationReadSync, useMessengerShared } from "@/providers/MessengerSharedProvider"

const MSG_LIMIT = 20

const avatarUrl = (ipmsId) =>
  ipmsId ? `/employees/image/${ipmsId}` : "https://www.gravatar.com/avatar/?d=mp&s=200"

const sortConversationsByRecent = (items = []) => {
  return [...items].sort((a, b) => {
    const aTime = a?.last_message_at ? new Date(a.last_message_at).getTime() : 0
    const bTime = b?.last_message_at ? new Date(b.last_message_at).getTime() : 0

    if (bTime !== aTime) return bTime - aTime

    return Number(b?.id || 0) - Number(a?.id || 0)
  })
}

const buildPreviewFromMessage = (message = {}) => ({
  last_message: message?.body ?? "",
  last_message_at: message?.created_at ?? null,
  last_message_sender_name: message?.sender_name ?? null,
  last_message_attachment_path: message?.attachment_path ?? null,
  last_message_attachment_url: message?.attachment_url ?? null,
  last_message_attachment_type: message?.attachment_type ?? null,
  last_message_attachment_name: message?.attachment_name ?? null,
})

const formatSentAt = (value) => {
  if (!value) return ""

  try {
    const date = new Date(value)
    const now = new Date()

    const isToday =
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate()

    return new Intl.DateTimeFormat(
      undefined,
      isToday
        ? { timeStyle: "short" }
        : { dateStyle: "medium", timeStyle: "short" }
    ).format(date)
  } catch {
    return value
  }
}

export default function MessengerQuickPanel({
  open,
  mode = "conversation",
  width = "28rem",
  me,
  conversation,
  users = [],
  onClose,
  onOpenFullMessenger,
}) {
  const [activeConversation, setActiveConversation] = useState(conversation || null)
  const [recentConversations, setRecentConversations] = useState([])
  const [messages, setMessages] = useState([])
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [loadingOlder, setLoadingOlder] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [body, setBody] = useState("")
  const [selectedUserIds, setSelectedUserIds] = useState([])
  const [typingUser, setTypingUser] = useState(null)
  const [replyTo, setReplyTo] = useState(null)
  const [conversationReadReceipts, setConversationReadReceipts] = useState([])
  const listRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const activeMessagesRequestRef = useRef(0)
  const { onlineUserIds, markConversationRead } = useMessengerShared()
  useConversationReadSync(setRecentConversations)

  const safeUsers = useMemo(() => {
    const map = new Map()

    for (const user of users || []) {
      if (user?.id == null) continue
      if (!map.has(user.id)) map.set(user.id, user)
    }

    return [...map.values()]
  }, [users])

  const selectedRecipients = useMemo(() => {
    const map = new Map()

    for (const user of safeUsers || []) {
      if (user?.id == null) continue
      map.set(Number(user.id), user)
    }

    return selectedUserIds.map((id) => map.get(Number(id))).filter(Boolean)
  }, [safeUsers, selectedUserIds])

  const safeConversations = useMemo(() => {
    const map = new Map()

    for (const conversationItem of recentConversations || []) {
      if (conversationItem?.id == null) continue
      if (!map.has(conversationItem.id)) map.set(conversationItem.id, conversationItem)
    }

    return [...map.values()]
  }, [recentConversations])

  const avatarUrlFor = (ipmsId) => avatarUrl(ipmsId)

  const fetchRecentConversations = async () => {
    if (!me?.id) return

    try {
      const res = await axios.get(route("messenger.conversations"), { params: { limit: 12 } })
      setRecentConversations(sortConversationsByRecent(res.data?.data || []))
    } catch {
      setRecentConversations([])
    }
  }

  const fetchThread = async (conversationId, { beforeId = null, prepend = false } = {}) => {
    if (!conversationId) return

    const el = listRef.current
    const prevHeight = el?.scrollHeight ?? 0

    if (prepend) setLoadingOlder(true)
    else setMessagesLoading(true)

    try {
      const params = { limit: MSG_LIMIT }
      if (beforeId) params.before_id = beforeId

      const res = await axios.get(route("messenger.messages", conversationId), { params })
      const chunk = res.data?.data || []
      const nextHasMore = Boolean(res.data?.has_more)
      const readReceipts = Array.isArray(res.data?.read_receipts) ? res.data.read_receipts : []

      setHasMore(nextHasMore)
      setConversationReadReceipts(readReceipts)

      if (prepend) {
        setMessages((prev) => {
          const merged = [...chunk, ...prev]
          const uniq = new Map()
          for (const message of merged) uniq.set(message.id, message)
          return [...uniq.values()].sort((a, b) => Number(a.id) - Number(b.id))
        })

        requestAnimationFrame(() => {
          if (!el) return
          el.scrollTop = el.scrollHeight - prevHeight
        })
      } else {
        setMessages(chunk)
        requestAnimationFrame(() => {
          if (!el) return
          el.scrollTop = el.scrollHeight
        })
      }
    } finally {
      if (prepend) setLoadingOlder(false)
      else setMessagesLoading(false)
    }
  }

  const sendTypingWhisper = () => {
    if (!activeConversation?.id || !me?.id || !window.Echo) return

    window.Echo.private(`conversation.${activeConversation.id}`).whisper("typing", {
      user_id: me.id,
      name: me.name,
      ipms_id: me.ipms_id ?? null,
    })
  }

  useEffect(() => {
    if (!open) return

    setActiveConversation(mode === "compose" ? null : (conversation || null))
    setBody("")
    setReplyTo(null)
    setTypingUser(null)
    setSelectedUserIds([])
  }, [open, conversation, mode])

  useEffect(() => {
    if (!open || !activeConversation?.id) return undefined

    let cancelled = false
    activeMessagesRequestRef.current += 1
    const echo = window.Echo

    setMessages([])
    setHasMore(true)
    setTypingUser(null)

    void fetchThread(activeConversation.id).then(() => {
      if (cancelled) return
    })

    void fetchRecentConversations()

    if (!echo) return undefined

    const channel = echo.private(`conversation.${activeConversation.id}`)

    channel.listen(".message.sent", (e) => {
      setMessages((prev) => {
        if (prev.some((message) => message.id === e.id)) return prev
        const next = [...prev, e].sort((a, b) => Number(a?.id || 0) - Number(b?.id || 0))
        return next
      })
      setTypingUser(null)
      setRecentConversations((prev) => {
        const idx = prev.findIndex((item) => Number(item.id) === Number(e.conversation_id ?? activeConversation.id))
        const preview = buildPreviewFromMessage(e)
        if (idx >= 0) {
          const updated = {
            ...prev[idx],
            ...preview,
            conversation_token: e.conversation_token ?? prev[idx].conversation_token ?? null,
          }
          const next = [...prev]
          next.splice(idx, 1)
          next.unshift(updated)
          return sortConversationsByRecent(next)
        }

        return [
          {
            id: Number(e.conversation_id ?? activeConversation.id),
            type: activeConversation?.type || "direct",
            name: activeConversation?.name || "Conversation",
            conversation_token: e.conversation_token ?? activeConversation?.conversation_token ?? null,
            ...preview,
          },
          ...prev,
        ]
      })
    })

    channel.listen(".conversation.read", (e) => {
      const conversationId = Number(e.conversation_id ?? activeConversation.id)
      if (!conversationId) return

      setConversationReadReceipts((prev) => {
        const current = Array.isArray(prev) ? prev : []
        const next = current.filter((receipt) => Number(receipt?.user_id) !== Number(e.user_id))
        next.push({
          user_id: Number(e.user_id),
          last_read_message_id: e.last_read_message_id != null ? Number(e.last_read_message_id) : null,
          last_read_at: e.last_read_at ?? null,
          reader_name: e.reader_name ?? null,
          reader_ipms_id: e.reader_ipms_id ?? null,
        })
        return next
      })

      setRecentConversations((prev) =>
        prev.map((conversation) =>
          Number(conversation.id) === Number(conversationId)
            ? { ...conversation, unread_count: 0 }
            : conversation
        )
      )

      markConversationRead(conversationId)
    })

    if (me?.id) {
      echo.private(`user.${me.id}`).listen(".messenger.conversation.renamed", (e) => {
        if (Number(e.conversation_id) !== Number(activeConversation.id)) return

        setActiveConversation((prev) => ({
          ...prev,
          type: "group",
          title: e.title ?? prev?.title ?? null,
          name: e.name ?? e.title ?? prev?.name ?? "Conversation",
        }))

        setRecentConversations((prev) =>
          prev.map((item) =>
            Number(item.id) === Number(e.conversation_id)
              ? {
                  ...item,
                  type: "group",
                  title: e.title ?? item.title ?? null,
                  name: e.name ?? e.title ?? item.name ?? "Conversation",
                }
              : item
          )
        )
      })
    }

    channel.listenForWhisper("typing", (payload) => {
      if (Number(payload.user_id) === Number(me?.id)) return

      setTypingUser({
        id: payload.user_id,
        name: payload.name || "Someone",
        ipms_id: payload.ipms_id ?? null,
      })

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }

      typingTimeoutRef.current = setTimeout(() => {
        setTypingUser(null)
      }, 1500)
    })

    return () => {
      cancelled = true
      activeMessagesRequestRef.current += 1
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      if (echo) {
        echo.leave(`private-conversation.${activeConversation.id}`)
        echo.leave(`private-user.${me.id}`)
      }
    }
  }, [activeConversation?.id, me?.id, open])

  const handleMessageScroll = () => {
    const el = listRef.current
    if (!el || !hasMore || loadingOlder || messagesLoading || messages.length === 0) return

    if (el.scrollTop <= 10) {
      const oldestId = messages[0]?.id
      if (oldestId) {
        void fetchThread(activeConversation.id, { beforeId: oldestId, prepend: true })
      }
    }
  }

  const updateActiveConversationPreview = (messageLike = {}, conversationId = activeConversation?.id) => {
    const preview = buildPreviewFromMessage(messageLike)

    setActiveConversation((prev) => prev ? { ...prev, ...preview } : prev)
    setRecentConversations((prev) => {
      const idx = prev.findIndex((item) => Number(item.id) === Number(conversationId))
      if (idx === -1) return prev

      const updated = {
        ...prev[idx],
        ...preview,
      }
      const next = [...prev]
      next.splice(idx, 1)
      next.unshift(updated)
      return sortConversationsByRecent(next)
    })
  }

  const sendMessage = async (payload = {}) => {
    const draft = typeof payload === "string"
      ? payload
      : String(payload?.body ?? "").trim()
    const attachment = typeof payload === "object" && payload !== null ? payload.attachment ?? null : null
    const replyTarget = typeof payload === "object" && payload !== null ? payload.replyTo ?? replyTo : replyTo

    if (!draft && !attachment) return false

    const targetConversationId = activeConversation?.id || await startConversationWithRecipientIds(selectedUserIds)
    if (!targetConversationId) return false

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`
    const attachmentPreviewUrl = attachment ? URL.createObjectURL(attachment) : null
    const optimisticMessage = {
      id: tempId,
      sender_id: me?.id,
      sender_name: me?.name || "You",
      sender_ipms_id: me?.ipms_id ?? null,
      sender_gender: null,
      body: draft,
      attachment_path: attachmentPreviewUrl,
      attachment_url: attachmentPreviewUrl,
      attachment_name: attachment?.name ?? null,
      attachment_type: attachment?.type ?? null,
      attachment_size: attachment?.size ?? null,
      created_at: new Date().toISOString(),
      reply_to: replyTarget || null,
    }

    setBody("")
    setReplyTo(null)
    setMessages((prev) => [...prev, optimisticMessage].sort((a, b) => Number(a?.id || 0) - Number(b?.id || 0)))
    updateActiveConversationPreview(optimisticMessage, targetConversationId)

    try {
      const formData = new FormData()
      formData.append("body", draft)
      if (attachment) formData.append("attachment", attachment)
      if (replyTarget?.id) formData.append("reply_to_id", replyTarget.id)

      const res = await axios.post(route("messenger.send", targetConversationId), formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })

      const msg = res.data?.data
      if (msg) {
        setMessages((prev) => {
          const replaced = prev.map((item) => (item.id === tempId ? msg : item))
          return [...new Map(replaced.map((item) => [item.id, item])).values()].sort((a, b) => Number(a?.id || 0) - Number(b?.id || 0))
        })
        updateActiveConversationPreview(msg, targetConversationId)
      }

      await fetchRecentConversations()
      return true
    } catch (error) {
      setMessages((prev) => prev.filter((item) => item.id !== tempId))
      setBody(draft)
      setReplyTo(replyTarget)
      console.log("quick messenger.send error:", error.response?.data || error)
      return false
    } finally {
      if (attachmentPreviewUrl) {
        URL.revokeObjectURL(attachmentPreviewUrl)
      }
    }
  }

  const send = async (payload) => {
    if (payload && typeof payload === "object" && !payload.preventDefault) {
      return sendMessage(payload)
    }

    if (payload?.preventDefault) {
      payload.preventDefault()
      return false
    }

    return sendMessage({ body })
  }

  const sendQuickLike = async () => {
    await sendMessage({ body: "__sticker__:like" })
  }

  const sendSticker = async (stickerBody) => {
    await sendMessage({ body: stickerBody })
  }

  const forwardMessage = async (sourceMessage, targetConversationId) => {
    if (!sourceMessage?.id || !targetConversationId) return false

    try {
      const res = await axios.post(route("messenger.forward", targetConversationId), {
        message_id: sourceMessage.id,
      })

      const msg = res.data?.data
      if (msg && Number(targetConversationId) === Number(activeConversation?.id)) {
        setMessages((prev) => {
          if (prev.some((item) => item.id === msg.id)) return prev
          return [...prev, msg].sort((a, b) => Number(a?.id || 0) - Number(b?.id || 0))
        })
      }

      await fetchRecentConversations()
      return true
    } catch (error) {
      console.log("quick messenger.forward error:", error.response?.data || error)
      return false
    }
  }

  const handleOpenConversation = (targetConversationId) => {
    const match = recentConversations.find((item) => Number(item.id) === Number(targetConversationId))
    flushSync(() => {
      setActiveConversation(
        match || {
          id: Number(targetConversationId),
          type: "direct",
          name: "Conversation",
        }
      )
      setSelectedUserIds([])
      setBody("")
      setMessages([])
      setHasMore(true)
      setReplyTo(null)
      setTypingUser(null)
      setMessagesLoading(true)
    })
  }

  const handleDeleteConversation = async (conversationId) => {
    if (!conversationId) return

    try {
      await axios.delete(route("messenger.destroy", conversationId))
      setRecentConversations((prev) => prev.filter((item) => Number(item.id) !== Number(conversationId)))
      if (Number(activeConversation?.id) === Number(conversationId)) {
        onClose?.()
      }
    } catch (error) {
      console.log("quick messenger.destroy error:", error.response?.data || error)
    }
  }

  const handleRenameConversation = async (conversationId, title) => {
    if (!conversationId) return

    const nextTitle = String(title || "").trim()
    if (!nextTitle) return

    try {
      const res = await axios.patch(route("messenger.update-title", conversationId), {
        title: nextTitle,
      })

      setActiveConversation((prev) =>
        prev && Number(prev.id) === Number(conversationId)
          ? {
              ...prev,
              type: "group",
              title: res.data?.title || nextTitle,
              name: res.data?.name || res.data?.title || nextTitle,
            }
          : prev
      )

      setRecentConversations((prev) =>
        prev.map((item) =>
          Number(item.id) === Number(conversationId)
            ? {
                ...item,
                type: "group",
                title: res.data?.title || nextTitle,
                name: res.data?.name || res.data?.title || nextTitle,
              }
            : item
        )
      )
    } catch (error) {
      console.log("quick messenger.update-title error:", error.response?.data || error)
    }
  }

  const resolveDirectConversationId = (userId) => {
    const match = recentConversations.find((item) => {
      if (item?.type !== "direct") return false
      return Number(item?.other_user_id) === Number(userId)
    })

    return match?.id ?? null
  }

  const buildGroupTitle = (names = []) => {
    const clean = names
      .map((name) => String(name || "").trim())
      .filter(Boolean)

    if (!clean.length) return "Group Chat"
    if (clean.length <= 3) return clean.join(", ")
    return `${clean.slice(0, 2).join(", ")} + ${clean.length - 2} others`
  }

  const buildParticipantSnapshot = (user) => ({
    id: Number(user?.id),
    ipms_id: user?.ipms_id ?? null,
    name: user?.name ?? "Member",
    avatar: user?.avatar || (user?.ipms_id ? `/employees/image/${user.ipms_id}` : null),
  })

  const buildSelfSnapshot = () => ({
    id: Number(me?.id || 0),
    ipms_id: me?.ipms_id ?? null,
    name: me?.name || "You",
    avatar: me?.avatar || (me?.ipms_id ? `/employees/image/${me.ipms_id}` : null),
  })

  const startConversationWithRecipientIds = async (recipientIds = selectedUserIds) => {
    const normalizedRecipientIds = [...new Set(recipientIds.map((id) => Number(id)).filter(Boolean))]
    if (!normalizedRecipientIds.length) return false

    try {
      const selectedRecipients = normalizedRecipientIds
        .map((id) => safeUsers.find((user) => Number(user.id) === Number(id)))
        .filter(Boolean)
      const isGroup = selectedRecipients.length > 1

      const res = await axios.post(route("messenger.start-conversation"), {
        user_ids: normalizedRecipientIds,
      })

      const conversationId = res.data?.id
      if (!conversationId) return false

      const createdConversation = {
        id: Number(conversationId),
        type: isGroup ? "group" : "direct",
        conversation_token: res.data?.conversation_token ?? null,
        name: isGroup
          ? buildGroupTitle(selectedRecipients.map((user) => user.name))
          : (selectedRecipients[0]?.name || "Conversation"),
        title: isGroup ? buildGroupTitle(selectedRecipients.map((user) => user.name)) : null,
        other_user_id: isGroup ? null : Number(selectedRecipients[0]?.id || 0) || null,
        other_user_ipms_id: isGroup ? null : selectedRecipients[0]?.ipms_id ?? null,
        other_user_avatar: isGroup
          ? null
          : (selectedRecipients[0]?.avatar
            || (selectedRecipients[0]?.ipms_id ? `/employees/image/${selectedRecipients[0].ipms_id}` : null)
            || "https://www.gravatar.com/avatar/?d=mp&s=200"),
        participants: isGroup
          ? [buildSelfSnapshot(), ...selectedRecipients.map((user) => buildParticipantSnapshot(user))]
          : selectedRecipients.map((user) => buildParticipantSnapshot(user)),
        last_message: null,
        last_message_at: null,
      }

      setRecentConversations((prev) => sortConversationsByRecent([createdConversation, ...prev]))
      setActiveConversation(createdConversation)
      setMessages([])
      setHasMore(true)
      setReplyTo(null)
      setTypingUser(null)
      setSelectedUserIds([])
      setMessagesLoading(true)

      if (isGroup) {
        setSelectedUserIds([])
      }

      return conversationId
    } catch (error) {
      console.log("quick panel startConversation error:", error.response?.data || error)
      return false
    } finally {
      setMessagesLoading(false)
    }
  }

  const startConversation = async (recipientIds = selectedUserIds) => {
    return startConversationWithRecipientIds(recipientIds)
  }

  const handlePreviewConversation = (conversationId, options = {}) => {
    const match = recentConversations.find((item) => Number(item.id) === Number(conversationId))
    if (!match) {
      if (!conversationId) {
        flushSync(() => {
          setActiveConversation(null)
          setMessages([])
          setHasMore(true)
          setReplyTo(null)
          setTypingUser(null)
          setMessagesLoading(false)
          if (!options?.preserveSelection) {
            setSelectedUserIds([])
          }
        })
      }
      return
    }

    flushSync(() => {
      setActiveConversation(match)
      setMessages([])
      setHasMore(true)
      setReplyTo(null)
      setTypingUser(null)
      if (!options?.preserveSelection) {
        setSelectedUserIds([])
      }
      setMessagesLoading(true)
    })
  }

  const isOpen = Boolean(open && (mode === "compose" || activeConversation?.id))

  if (!open && !conversation?.id && mode !== "compose") {
    return null
  }

  return (
    <aside
      className={`fixed right-0 top-16 bottom-0 z-40 flex flex-col border-l bg-background shadow-2xl transition-all duration-300 ease-out ${
        isOpen ? "translate-x-0 opacity-100" : "translate-x-full opacity-0 pointer-events-none"
      }`}
      style={{ width }}
    >
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div>
          <div className="text-sm font-semibold">Messages</div>
          <div className="text-xs text-muted-foreground">Quick conversation view</div>
        </div>

        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onOpenFullMessenger}>
            <ArrowUpRight className="mr-2 h-4 w-4" />
            Open Messenger
          </Button>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close messenger panel">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div
        className={`flex min-h-0 flex-1 flex-col p-3 ${
          mode === "compose" ? "overflow-visible" : "overflow-hidden"
        }`}
      >
        {mode === "compose" ? (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="shrink-0 rounded-xl border bg-background px-3 py-2">
              <RecipientComposer
                me={me}
                safeUsers={safeUsers}
                selectedUserIds={selectedUserIds}
                setSelectedUserIds={setSelectedUserIds}
                startConversation={startConversation}
                onPreviewConversation={handlePreviewConversation}
                resolveDirectConversationId={resolveDirectConversationId}
                onlineUserIds={onlineUserIds}
                avatarUrl={avatarUrlFor}
                autoOpen
                draftOnMissingConversation
              />
            </div>

            {activeConversation || selectedUserIds.length ? (
              <div className="flex min-h-0 flex-1 flex-col">
                <Messages
                  key={`quick-msgs-${activeConversation?.id || "draft"}`}
                  me={me}
                  orderedMessages={messages}
                  activeConversationId={activeConversation?.id || null}
                  activeConversation={activeConversation}
                  conversations={safeConversations}
                  safeUsers={safeUsers}
                  conversationReadReceipts={conversationReadReceipts}
                  listRef={listRef}
                  handleMessageScroll={handleMessageScroll}
                  messagesLoading={messagesLoading}
                  loadingOlder={loadingOlder}
                  avatarUrl={avatarUrlFor}
                  formatSentAt={formatSentAt}
                  body={body}
                  setBody={setBody}
                  send={send}
                  onBodyChange={(value) => {
                    setBody(value)
                    if (value.trim()) sendTypingWhisper()
                  }}
                  typingUser={typingUser}
                  replyTo={replyTo}
                  setReplyTo={setReplyTo}
                  sendQuickLike={sendQuickLike}
                  sendSticker={sendSticker}
                  onForwardMessage={forwardMessage}
                  onOpenConversation={handleOpenConversation}
                />
              </div>
            ) : (
              <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed text-sm text-muted-foreground">
                Select recipients to start a conversation.
              </div>
            )}
          </div>
        ) : activeConversation ? (
          <>
            <div className="shrink-0">
              <SelectedConversation
                me={me}
                safeUsers={safeUsers}
                activeConversation={activeConversation}
                onlineUserIds={onlineUserIds}
                avatarUrl={avatarUrlFor}
                typingUser={typingUser}
                onDeleteConversation={handleDeleteConversation}
                onRenameConversation={handleRenameConversation}
              />
            </div>

            <div className="flex min-h-0 flex-1 flex-col">
              <Messages
                key={`quick-msgs-${activeConversation.id}`}
                me={me}
                orderedMessages={messages}
                activeConversationId={activeConversation.id}
                activeConversation={activeConversation}
                conversations={safeConversations}
                safeUsers={safeUsers}
                conversationReadReceipts={conversationReadReceipts}
                listRef={listRef}
                handleMessageScroll={handleMessageScroll}
                messagesLoading={messagesLoading}
                loadingOlder={loadingOlder}
                avatarUrl={avatarUrlFor}
                formatSentAt={formatSentAt}
                body={body}
                setBody={setBody}
                send={send}
                onBodyChange={(value) => {
                  setBody(value)
                  if (value.trim()) sendTypingWhisper()
                }}
                typingUser={typingUser}
                replyTo={replyTo}
                setReplyTo={setReplyTo}
                sendQuickLike={sendQuickLike}
                sendSticker={sendSticker}
                onForwardMessage={forwardMessage}
                onOpenConversation={handleOpenConversation}
              />
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed text-sm text-muted-foreground">
            No conversation selected.
          </div>
        )}
      </div>
      <Separator />
    </aside>
  )
}
