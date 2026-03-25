import { useEffect, useMemo, useRef, useState } from "react"
import axios from "axios"
import { Head, usePage } from "@inertiajs/react"
import Conversations from "./Conversations"
import SelectedConversation from "./SelectedConversation"
import Messages from "./Messages"

const CONVO_LIMIT = 20
const MSG_LIMIT = 20

export default function Index() {
  const { auth, users = [] } = usePage().props
  const me = auth?.user

  const [conversations, setConversations] = useState([])
  const [selectedUserIds, setSelectedUserIds] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [onlineUserIds, setOnlineUserIds] = useState(new Set())

  const [messages, setMessages] = useState([])
  const [body, setBody] = useState("")
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [loadingOlder, setLoadingOlder] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [isCreatingConversation, setIsCreatingConversation] = useState(false)

  const [conversationsLoading, setConversationsLoading] = useState(false)
  const [loadingMoreConversations, setLoadingMoreConversations] = useState(false)
  const [convoHasMore, setConvoHasMore] = useState(true)
  const [typingUser, setTypingUser] = useState(null)
  const [replyTo, setReplyTo] = useState(null)

  const typingTimeoutRef = useRef(null)
  const lastTypingRef = useRef(0)
  const listRef = useRef(null)
  const convoListRef = useRef(null)
  const messagesByConversationRef = useRef(new Map())
  const activeMessagesRequestRef = useRef(0)

  const avatarUrl = (ipmsId) =>
    ipmsId ? `/employees/image/${ipmsId}` : "https://www.gravatar.com/avatar/?d=mp&s=200"

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

  const sendTypingWhisper = () => {
    if (!activeId || !me?.id || !window.Echo) return

    const now = Date.now()
    if (now - lastTypingRef.current < 700) return
    lastTypingRef.current = now

    window.Echo.private(`conversation.${activeId}`).whisper("typing", {
      user_id: me.id,
      name: me.name,
      ipms_id: me.ipms_id ?? null,
    })
  }

  useEffect(() => {
    if (!window.Echo) {
      return undefined
    }

    window.Echo.join("messenger.presence")
      .here((presenceUsers) => {
        setOnlineUserIds(new Set(presenceUsers.map((u) => Number(u.id))))
      })
      .joining((user) => {
        setOnlineUserIds((prev) => new Set([...prev, Number(user.id)]))
      })
      .leaving((user) => {
        setOnlineUserIds((prev) => {
          const next = new Set(prev)
          next.delete(Number(user.id))
          return next
        })
      })

    return () => {
      window.Echo.leave("messenger.presence")
    }
  }, [])

  const safeUsers = useMemo(() => {
    const map = new Map()

    for (const u of users || []) {
      if (u?.id == null) continue
      if (!map.has(u.id)) map.set(u.id, u)
    }

    return [...map.values()]
  }, [users])

  const safeConversations = useMemo(() => {
    const map = new Map()

    for (const c of conversations || []) {
      if (c?.id == null) continue
      if (!map.has(c.id)) map.set(c.id, c)
    }

    return [...map.values()]
  }, [conversations])

  const activeConversation = useMemo(
    () => safeConversations.find((c) => Number(c.id) === Number(activeId)) || null,
    [safeConversations, activeId]
  )

  const selectedUsers = useMemo(() => {
    const map = new Map()

    for (const u of safeUsers || []) {
      if (u?.id == null || Number(u.id) === Number(me?.id)) continue
      map.set(Number(u.id), u)
    }

    return selectedUserIds.map((id) => map.get(Number(id))).filter(Boolean)
  }, [safeUsers, me?.id, selectedUserIds])

  const orderedMessages = useMemo(() => {
    return [...messages].sort((a, b) => Number(a?.id || 0) - Number(b?.id || 0))
  }, [messages])

  const cacheConversationMessages = (conversationId, data, hasMoreValue) => {
    messagesByConversationRef.current.set(Number(conversationId), {
      data,
      hasMore: Boolean(hasMoreValue),
      ts: Date.now(),
    })
  }

  const getCachedConversationMessages = (conversationId) => {
    return messagesByConversationRef.current.get(Number(conversationId)) || null
  }

  const fetchConversationMessages = async (conversationId, { beforeId = null, limit = MSG_LIMIT } = {}) => {
    const params = { limit }
    if (beforeId) params.before_id = beforeId

    const res = await axios.get(route("messenger.messages", conversationId), { params })
    const chunk = res.data?.data || []
    const nextHasMore = Boolean(res.data?.has_more)

    cacheConversationMessages(conversationId, chunk, nextHasMore)

    return { chunk, hasMore: nextHasMore }
  }

  const prefetchConversationMessages = async (conversationIds = []) => {
    const ids = [...new Set(conversationIds.map((id) => Number(id)).filter(Boolean))]

    await Promise.allSettled(
      ids.map(async (conversationId) => {
        if (conversationId === Number(activeId)) return
        if (getCachedConversationMessages(conversationId)?.data?.length) return

        try {
          await fetchConversationMessages(conversationId, { limit: MSG_LIMIT })
        } catch {
          // Prefetch is opportunistic only.
        }
      })
    )
  }

  const updateConversationPreview = (conversationId, lastMessage, lastAt) => {
    setConversations((prev) => {
      const idx = prev.findIndex((c) => Number(c.id) === Number(conversationId))
      if (idx === -1) return prev

      const updated = {
        ...prev[idx],
        last_message: lastMessage,
        last_message_at: lastAt,
      }

      const next = [...prev]
      next.splice(idx, 1)
      next.unshift(updated)
      return next
    })
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

  const upsertConversationToTop = (
    conversationId,
    fallbackName = "Conversation",
    type = "direct",
    participants = [],
    options = {}
  ) => {
    setConversations((prev) => {
      const idx = prev.findIndex((c) => Number(c.id) === Number(conversationId))
      const resolvedParticipants = participants.length
        ? participants
        : (idx >= 0 ? prev[idx].participants || [] : [])
      const directParticipant = type === "direct" ? resolvedParticipants[0] || null : null
      const resolvedName = type === "group"
        ? fallbackName
        : (directParticipant?.name || fallbackName)

      if (idx >= 0) {
        const found = {
          ...prev[idx],
          type,
          name: resolvedName,
          title: type === "group" ? fallbackName : null,
          other_user_id: type === "direct"
            ? (Number(directParticipant?.id ?? prev[idx].other_user_id ?? 0) || null)
            : null,
          other_user_ipms_id: type === "direct"
            ? (directParticipant?.ipms_id ?? prev[idx].other_user_ipms_id ?? null)
            : null,
          other_user_avatar: type === "direct"
            ? (directParticipant?.avatar
              || (directParticipant?.ipms_id ? `/employees/image/${directParticipant.ipms_id}` : prev[idx].other_user_avatar)
              || "https://www.gravatar.com/avatar/?d=mp&s=200")
            : null,
          skip_initial_fetch: Boolean(options.skipInitialFetch ?? prev[idx].skip_initial_fetch ?? false),
          participants: type === "group"
            ? resolvedParticipants
            : prev[idx].participants || resolvedParticipants,
        }
        const next = [...prev]
        next.splice(idx, 1)
        next.unshift(found)
        return next
      }

      const created = {
        id: Number(conversationId),
        type,
        name: resolvedName,
        title: type === "group" ? fallbackName : null,
        other_user_id: type === "direct"
          ? (Number(directParticipant?.id ?? 0) || null)
          : null,
        other_user_ipms_id: type === "direct"
          ? (directParticipant?.ipms_id ?? null)
          : null,
        other_user_avatar: type === "direct"
          ? (directParticipant?.avatar
            || (directParticipant?.ipms_id ? `/employees/image/${directParticipant.ipms_id}` : null)
            || "https://www.gravatar.com/avatar/?d=mp&s=200")
          : null,
        skip_initial_fetch: Boolean(options.skipInitialFetch),
        participants: resolvedParticipants,
        last_message: null,
        last_message_at: null,
      }

      const next = [created, ...prev]
      return next
    })
  }

  const fetchConversations = async ({ beforeId = null, append = false, silent = false } = {}) => {
    const params = { limit: CONVO_LIMIT }
    if (beforeId) params.before_id = beforeId

    if (!silent) {
      if (append) setLoadingMoreConversations(true)
      else setConversationsLoading(true)
    }

    try {
      const res = await axios.get(route("messenger.conversations"), { params })
      const chunk = res.data?.data || []
      const hasMoreFromApi = res.data?.has_more

      setConvoHasMore(
        typeof hasMoreFromApi === "boolean" ? hasMoreFromApi : chunk.length === CONVO_LIMIT
      )

      if (append) {
        setConversations((prev) => {
          const merged = [...prev, ...chunk]
          const uniq = new Map()
          for (const c of merged) uniq.set(c.id, c)
          return [...uniq.values()]
        })
      } else {
        setConversations(chunk)

        if (!activeId && chunk.length) {
          setActiveId(chunk[0].id)
        }

        void prefetchConversationMessages(chunk.slice(0, 8).map((conversation) => conversation.id))
      }
    } finally {
      if (!silent) {
        if (append) setLoadingMoreConversations(false)
        else setConversationsLoading(false)
      }
    }
  }

  const fetchMessages = async ({
    conversationId = activeId,
    beforeId = null,
    prepend = false,
    silent = false,
    requestToken = null,
  } = {}) => {
    if (!conversationId) return

    const el = listRef.current
    const prevHeight = el?.scrollHeight ?? 0

    if (prepend) setLoadingOlder(true)
    else if (!silent) setMessagesLoading(true)

    try {
      const convoId = Number(conversationId)
      const { chunk, hasMore: nextHasMore } = await fetchConversationMessages(convoId, {
        beforeId,
        limit: MSG_LIMIT,
      })

      if (requestToken != null && requestToken !== activeMessagesRequestRef.current) {
        return
      }

      setHasMore(nextHasMore)

      if (prepend) {
        setMessages((prev) => {
          const merged = [...chunk, ...prev]
          const uniq = new Map()
          for (const m of merged) uniq.set(m.id, m)
          const next = [...uniq.values()].sort((a, b) => Number(a.id) - Number(b.id))
          cacheConversationMessages(convoId, next, nextHasMore)
          return next
        })

        requestAnimationFrame(() => {
          if (!el) return
          el.scrollTop = el.scrollHeight - prevHeight
        })
      } else {
        setMessages(chunk)
        cacheConversationMessages(convoId, chunk, nextHasMore)

        requestAnimationFrame(() => {
          if (!el) return
          el.scrollTop = el.scrollHeight
        })
      }
    } finally {
      if (prepend) setLoadingOlder(false)
      else if (!silent) setMessagesLoading(false)
    }
  }

  const startConversation = async () => {
    try {
      if (!selectedUserIds.length) return

      const selectedRecipients = selectedUsers
      const isGroup = selectedRecipients.length > 1
      const displayName = isGroup
        ? buildGroupTitle(selectedRecipients.map((user) => user.name))
        : (selectedRecipients[0]?.name || "Conversation")

      const res = await axios.post(route("messenger.start-conversation"), {
        user_ids: selectedUserIds.map((id) => Number(id)),
      })

      const conversationId = res.data?.id
      if (!conversationId) return

      const shouldSkipInitialFetch = true

      upsertConversationToTop(
        conversationId,
        displayName,
        isGroup ? "group" : "direct",
        selectedRecipients.map((user) => buildParticipantSnapshot(user)),
        { skipInitialFetch: shouldSkipInitialFetch }
      )
      setActiveId(conversationId)
      setSelectedUserIds([])
      setIsCreatingConversation(false)
      return true
    } catch (error) {
      console.log("startConversation error:", error.response?.data || error)
      return false
    }
  }

  const handleNewMessage = () => {
    setActiveId(null)
    setMessages([])
    setHasMore(true)
    setBody("")
    setReplyTo(null)
    setTypingUser(null)
    setSelectedUserIds([])
    setIsCreatingConversation(true)
  }

  const handleSelectConversation = (conversationId) => {
    setActiveId(conversationId)
    setIsCreatingConversation(false)
    setSelectedUserIds([])
    setReplyTo(null)
    setBody("")
  }

  const handlePreviewConversation = (conversationId) => {
    setActiveId(conversationId)
    setIsCreatingConversation(true)
    setBody("")
    setReplyTo(null)
    setTypingUser(null)
  }

  const resolveDirectConversationId = (userId) => {
    const match = safeConversations.find((c) => {
      if (c?.type !== "direct") return false
      return Number(c.other_user_id) === Number(userId)
    })

    return match?.id ?? null
  }

  useEffect(() => {
    fetchConversations()
  }, [])

  useEffect(() => {
    if (!activeId) return
    if (!window.Echo) return

    const requestToken = ++activeMessagesRequestRef.current
    setTypingUser(null)
    const cached = getCachedConversationMessages(activeId)
    const shouldSkipInitialFetch = Boolean(activeConversation?.skip_initial_fetch && !cached?.data?.length)

    if (cached?.data?.length) {
      setMessages(cached.data)
      setHasMore(Boolean(cached.hasMore))
    } else {
      setMessages([])
      setHasMore(true)
    }

    if (!shouldSkipInitialFetch) {
      fetchMessages({
        conversationId: activeId,
        silent: Boolean(cached?.data?.length),
        requestToken,
      })
    }

    const channelName = `conversation.${activeId}`
    const channel = window.Echo.private(channelName)

    channel.listen(".message.sent", (e) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === e.id)) return prev
        const next = [...prev, e].sort((a, b) => Number(a?.id || 0) - Number(b?.id || 0))
        cacheConversationMessages(activeId, next, hasMore)
        return next
      })

      updateConversationPreview(e.conversation_id ?? activeId, e.body, e.created_at)
      setTypingUser(null)

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }

      requestAnimationFrame(() => {
        if (!listRef.current) return
        listRef.current.scrollTop = listRef.current.scrollHeight
      })
    })

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
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      activeMessagesRequestRef.current += 1
      window.Echo.leave(`private-${channelName}`)
    }
  }, [activeId, activeConversation?.skip_initial_fetch, me?.id])

  useEffect(() => {
    if (!me?.id) return
    if (!window.Echo) return

    window.Echo.private(`user.${me.id}`).listen(".messenger.conversation.ping", (e) => {
      setConversations((prev) => {
        const idx = prev.findIndex((c) => Number(c.id) === Number(e.conversation_id))

        if (idx >= 0) {
          const updated = {
            ...prev[idx],
            last_message: e.last_message,
            last_message_at: e.last_message_at,
          }
          const next = [...prev]
          next.splice(idx, 1)
          next.unshift(updated)
          return next
        }

        const next = [
          {
            id: Number(e.conversation_id),
            type: "direct",
            name: e.sender_name || "Conversation",
            title: null,
            other_user_id: Number(e.sender_id),
            other_user_ipms_id: e.sender_ipms_id ?? null,
            last_message: e.last_message,
            last_message_at: e.last_message_at,
          },
          ...prev,
        ]
        return next
      })
    })

    return () => {
      window.Echo.leave(`private-user.${me.id}`)
    }
  }, [me?.id])

  const handleConversationScroll = () => {
    const el = convoListRef.current
    if (!el || conversationsLoading || loadingMoreConversations || !convoHasMore) return

    const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 20
    if (!nearBottom) return

    const lastId = safeConversations[safeConversations.length - 1]?.id
    if (lastId) fetchConversations({ beforeId: lastId, append: true })
  }

  const handleMessageScroll = () => {
    const el = listRef.current
    if (!el || !hasMore || loadingOlder || messagesLoading || orderedMessages.length === 0) return

    if (el.scrollTop <= 10) {
      const oldestId = orderedMessages[0]?.id
      if (oldestId) fetchMessages({ conversationId: activeId, beforeId: oldestId, prepend: true })
    }
  }

  const send = async (e) => {
    e.preventDefault()
    if (!body.trim() || !activeId) return

    const draft = body
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`
    const optimisticMessage = {
      id: tempId,
      sender_id: me?.id,
      sender_name: me?.name || "You",
      sender_ipms_id: me?.ipms_id ?? null,
      sender_gender: null,
      body: draft,
      created_at: new Date().toISOString(),
      reply_to: replyTo
        ? {
            id: replyTo.id,
            sender_id: replyTo.sender_id,
            sender_name: replyTo.sender_name,
            sender_gender: replyTo.sender_gender ?? null,
            body: replyTo.body,
          }
        : null,
    }

    setBody("")
    setReplyTo(null)

    setMessages((prev) => {
      const next = [...prev, optimisticMessage]
      cacheConversationMessages(activeId, next, hasMore)
      return next
    })

    updateConversationPreview(activeId, draft, optimisticMessage.created_at)

    try {
      const res = await axios.post(route("messenger.send", activeId), {
        body: draft,
        reply_to_id: replyTo?.id ?? null,
      })
      const msg = res.data?.data

      if (msg) {
        setMessages((prev) => {
          const replaced = prev.map((m) => (m.id === tempId ? msg : m))
          const uniq = new Map()
          for (const m of replaced) uniq.set(m.id, m)
          const next = [...uniq.values()].sort((a, b) => Number(a?.id || 0) - Number(b?.id || 0))
          cacheConversationMessages(activeId, next, hasMore)
          return next
        })

        updateConversationPreview(activeId, msg.body, msg.created_at)
        setTypingUser(null)

        requestAnimationFrame(() => {
          if (!listRef.current) return
          listRef.current.scrollTop = listRef.current.scrollHeight
        })
      }
    } catch (error) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId))
      setBody(draft)
      setReplyTo(replyTo)
      console.log("messenger.send error:", error.response?.data || error)
    }
  }

  return (
    <>
      <Head title="Messenger" />

      <div className="h-[calc(100vh-140px)] min-h-0 grid grid-cols-[clamp(240px,28vw,340px)_minmax(0,1fr)] gap-4">
        <Conversations
          onlineUserIds={onlineUserIds}
          safeConversations={safeConversations}
          activeId={activeId}
          onNewMessage={handleNewMessage}
          onSelectConversation={handleSelectConversation}
          conversationsLoading={conversationsLoading}
          loadingMoreConversations={loadingMoreConversations}
          convoListRef={convoListRef}
          handleConversationScroll={handleConversationScroll}
          avatarUrl={avatarUrl}
        />

        <div className="border rounded p-2 min-h-0 min-w-0 flex flex-col overflow-hidden">
          <SelectedConversation
            me={me}
            safeUsers={safeUsers}
            activeConversation={activeConversation}
            selectedUserIds={selectedUserIds}
            setSelectedUserIds={setSelectedUserIds}
            isComposing={isCreatingConversation || selectedUserIds.length > 0}
            onlineUserIds={onlineUserIds}
            avatarUrl={avatarUrl}
            typingUser={typingUser}
            startConversation={startConversation}
            onPreviewConversation={handlePreviewConversation}
            resolveDirectConversationId={resolveDirectConversationId}
          />

          <Messages
            me={me}
            orderedMessages={orderedMessages}
            activeConversationId={activeId}
            listRef={listRef}
            handleMessageScroll={handleMessageScroll}
            messagesLoading={messagesLoading}
            loadingOlder={loadingOlder}
            avatarUrl={avatarUrl}
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
          />
        </div>
      </div>
    </>
  )
}

