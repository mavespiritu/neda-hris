import { useEffect, useMemo, useRef, useState } from "react"
import axios from "axios"
import { Head, usePage } from "@inertiajs/react"
import Conversations from "./Conversations"
import SelectedConversation from "./SelectedConversation"
import Messages from "./Messages"

const CONVO_LIMIT = 20
const MSG_LIMIT = 20
const CACHE_TTL = 30_000
const CONVERSATIONS_CACHE_KEY = "messenger:conversations"
const MESSAGES_CACHE_KEY = "messenger:messages"

export default function Index() {
  const { auth, users = [] } = usePage().props
  const me = auth?.user

  const [conversations, setConversations] = useState([])
  const [receiverId, setReceiverId] = useState("")
  const [activeId, setActiveId] = useState(null)
  const [onlineUserIds, setOnlineUserIds] = useState(new Set())

  const [messages, setMessages] = useState([])
  const [body, setBody] = useState("")
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [loadingOlder, setLoadingOlder] = useState(false)
  const [hasMore, setHasMore] = useState(true)

  const [conversationsLoading, setConversationsLoading] = useState(false)
  const [loadingMoreConversations, setLoadingMoreConversations] = useState(false)
  const [convoHasMore, setConvoHasMore] = useState(true)
  const [typingUser, setTypingUser] = useState(null)
  const [replyTo, setReplyTo] = useState(null)

  const typingTimeoutRef = useRef(null)
  const lastTypingRef = useRef(0)
  const listRef = useRef(null)
  const convoListRef = useRef(null)

  const conversationsCacheRef = useRef({ data: [], ts: 0 })
  const messagesCacheRef = useRef(new Map())

  const avatarUrl = (ipmsId) =>
    ipmsId ? `/employees/image/${ipmsId}` : "https://www.gravatar.com/avatar/?d=mp&s=200"

  const isFreshCache = (ts) => Date.now() - Number(ts || 0) < CACHE_TTL

  const saveConversationsCache = (data) => {
    const payload = { data, ts: Date.now() }
    conversationsCacheRef.current = payload
    try {
      localStorage.setItem(CONVERSATIONS_CACHE_KEY, JSON.stringify(payload))
    } catch {}
  }

  const saveMessagesCache = (conversationId, data, hasMoreValue) => {
    const key = Number(conversationId)
    const payload = { data, hasMore: Boolean(hasMoreValue), ts: Date.now() }
    messagesCacheRef.current.set(key, payload)

    try {
      localStorage.setItem(
        MESSAGES_CACHE_KEY,
        JSON.stringify(Object.fromEntries(messagesCacheRef.current.entries()))
      )
    } catch {}
  }

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
      window.Echo.leave("presence-messenger.presence")
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

  const orderedMessages = useMemo(() => {
    return [...messages].sort((a, b) => Number(a?.id || 0) - Number(b?.id || 0))
  }, [messages])

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
      saveConversationsCache(next)
      return next
    })
  }

  const upsertConversationToTop = (conversationId, fallbackName = "Conversation") => {
    setConversations((prev) => {
      const idx = prev.findIndex((c) => Number(c.id) === Number(conversationId))

      if (idx >= 0) {
        const found = prev[idx]
        const next = [...prev]
        next.splice(idx, 1)
        next.unshift(found)
        saveConversationsCache(next)
        return next
      }

      const receiver = safeUsers.find((u) => Number(u.id) === Number(receiverId))
      const created = {
        id: Number(conversationId),
        type: "direct",
        name: receiver?.name || fallbackName,
        title: null,
        other_user_id: Number(receiverId),
        other_user_ipms_id: receiver?.ipms_id ?? null,
        last_message: null,
        last_message_at: null,
      }

      const next = [created, ...prev]
      saveConversationsCache(next)
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
          const next = [...uniq.values()]
          saveConversationsCache(next)
          return next
        })
      } else {
        setConversations(chunk)
        saveConversationsCache(chunk)

        if (!activeId && chunk.length) {
          setActiveId(chunk[0].id)
        }
      }
    } finally {
      if (!silent) {
        if (append) setLoadingMoreConversations(false)
        else setConversationsLoading(false)
      }
    }
  }

  const fetchMessages = async ({ beforeId = null, prepend = false, silent = false } = {}) => {
    if (!activeId) return

    const params = { limit: MSG_LIMIT }
    if (beforeId) params.before_id = beforeId

    const convoId = Number(activeId)
    const el = listRef.current
    const prevHeight = el?.scrollHeight ?? 0

    if (prepend) setLoadingOlder(true)
    else if (!silent) setMessagesLoading(true)

    try {
      const res = await axios.get(route("messenger.messages", activeId), { params })
      const chunk = res.data?.data || []
      const nextHasMore = Boolean(res.data?.has_more)

      setHasMore(nextHasMore)

      if (prepend) {
        setMessages((prev) => {
          const merged = [...chunk, ...prev]
          const uniq = new Map()
          for (const m of merged) uniq.set(m.id, m)
          const next = [...uniq.values()].sort((a, b) => Number(a.id) - Number(b.id))
          saveMessagesCache(convoId, next, nextHasMore)
          return next
        })

        requestAnimationFrame(() => {
          if (!el) return
          el.scrollTop = el.scrollHeight - prevHeight
        })
      } else {
        setMessages(chunk)
        saveMessagesCache(convoId, chunk, nextHasMore)

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

  const startDirect = async () => {
    try {
      if (!receiverId) return

      const res = await axios.post(route("messenger.start-direct"), {
        user_id: Number(receiverId),
      })

      const conversationId = res.data?.id
      if (!conversationId) return

      upsertConversationToTop(conversationId)
      setActiveId(conversationId)
      setReceiverId("")
    } catch (error) {
      console.log("startDirect error:", error.response?.data || error)
    }
  }

  useEffect(() => {
    let hasCachedConversations = false

    try {
      const rawConvo = localStorage.getItem(CONVERSATIONS_CACHE_KEY)
      if (rawConvo) {
        const parsed = JSON.parse(rawConvo)
        if (Array.isArray(parsed?.data)) {
          conversationsCacheRef.current = parsed
          setConversations(parsed.data)
          hasCachedConversations = parsed.data.length > 0
          if (!activeId && parsed.data.length) setActiveId(parsed.data[0].id)
        }
      }

      const rawMsg = localStorage.getItem(MESSAGES_CACHE_KEY)
      if (rawMsg) {
        const parsed = JSON.parse(rawMsg)
        if (parsed && typeof parsed === "object") {
          for (const [k, v] of Object.entries(parsed)) {
            messagesCacheRef.current.set(Number(k), v)
          }
        }
      }
    } catch {}

    fetchConversations({ silent: hasCachedConversations })
  }, [])

  useEffect(() => {
    if (!activeId) return
    if (!window.Echo) return

    const cached = messagesCacheRef.current.get(Number(activeId))
    const hasCached = Boolean(cached?.data?.length)

    if (hasCached) {
      setMessages(cached.data)
      setHasMore(Boolean(cached.hasMore))
    } else {
      setMessages([])
      setHasMore(true)
    }

    setTypingUser(null)

    fetchMessages({ silent: hasCached && isFreshCache(cached?.ts) })

    const channelName = `conversation.${activeId}`
    const channel = window.Echo.private(channelName)

    channel.listen(".message.sent", (e) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === e.id)) return prev
        const next = [...prev, e].sort((a, b) => Number(a?.id || 0) - Number(b?.id || 0))
        saveMessagesCache(activeId, next, hasMore)
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
      window.Echo.leave(`private-${channelName}`)
    }
  }, [activeId, me?.id, hasMore])

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
          saveConversationsCache(next)
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
        saveConversationsCache(next)
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
      if (oldestId) fetchMessages({ beforeId: oldestId, prepend: true })
    }
  }

  const send = async (e) => {
    e.preventDefault()
    if (!body.trim() || !activeId) return

    const res = await axios.post(route("messenger.send", activeId), {
      body,
      reply_to_id: replyTo?.id ?? null,
    })
    const msg = res.data?.data

    if (msg) {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev
        const next = [...prev, msg].sort((a, b) => Number(a?.id || 0) - Number(b?.id || 0))
        saveMessagesCache(activeId, next, hasMore)
        return next
      })

      updateConversationPreview(activeId, msg.body, msg.created_at)
      setTypingUser(null)
      setReplyTo(null)

      requestAnimationFrame(() => {
        if (!listRef.current) return
        listRef.current.scrollTop = listRef.current.scrollHeight
      })
    }

    setBody("")
  }

  return (
    <>
      <Head title="Messenger" />

      <div className="h-[calc(100vh-140px)] min-h-0 grid grid-cols-[clamp(240px,28vw,340px)_minmax(0,1fr)] gap-4">
        <Conversations
          me={me}
          safeUsers={safeUsers}
          receiverId={receiverId}
          setReceiverId={setReceiverId}
          startDirect={startDirect}
          onlineUserIds={onlineUserIds}
          safeConversations={safeConversations}
          activeId={activeId}
          setActiveId={setActiveId}
          conversationsLoading={conversationsLoading}
          loadingMoreConversations={loadingMoreConversations}
          convoListRef={convoListRef}
          handleConversationScroll={handleConversationScroll}
          avatarUrl={avatarUrl}
        />

        <div className="border rounded p-2 min-h-0 min-w-0 flex flex-col overflow-hidden">
          <SelectedConversation
            activeConversation={activeConversation}
            onlineUserIds={onlineUserIds}
            avatarUrl={avatarUrl}
            typingUser={typingUser}
          />

          <Messages
            me={me}
            orderedMessages={orderedMessages}
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
