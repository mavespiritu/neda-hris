import { useEffect, useMemo, useRef, useState } from "react"
import axios from "axios"
import { Head, usePage } from "@inertiajs/react"
import Conversations from "./Conversations"
import SelectedConversation from "./SelectedConversation"
import Messages from "./Messages"
import {
  isConversationListNearBottom,
  mergeConversationPages,
  resolveConversationHasMore,
  sortConversationsByRecent,
} from "@/lib/messengerConversationPagination"
import { applyConversationMembershipUpdate, pushConversationRecentSender } from "@/lib/messengerConversationMembership"
import { useConversationReadSync, useMessengerShared } from "@/providers/MessengerSharedProvider"

const CONVO_LIMIT = 20
const MSG_LIMIT = 20

const readConversationTokenFromLocation = () => {
  if (typeof window === "undefined") return null

  const segments = window.location.pathname.split("/").filter(Boolean)
  if (segments[0] !== "messenger" || segments[1] !== "conversation" || !segments[2]) {
    return null
  }

  return decodeURIComponent(segments[2])
}

export default function Index() {
  const { auth, users = [], initialConversationId = null } = usePage().props
  const me = auth?.user

  const [conversations, setConversations] = useState([])
  const [selectedUserIds, setSelectedUserIds] = useState([])
  const [activeId, setActiveId] = useState(null)

  const [messages, setMessages] = useState([])
  const [body, setBody] = useState("")
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [loadingOlder, setLoadingOlder] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [isCreatingConversation, setIsCreatingConversation] = useState(false)
  const [conversationReadReceiptsById, setConversationReadReceiptsById] = useState({})

  const [conversationsLoading, setConversationsLoading] = useState(false)
  const [loadingMoreConversations, setLoadingMoreConversations] = useState(false)
  const [convoHasMore, setConvoHasMore] = useState(true)
  const [typingUser, setTypingUser] = useState(null)
  const [replyTo, setReplyTo] = useState(null)
  const { onlineUserIds, markConversationRead } = useMessengerShared()
  useConversationReadSync(setConversations)

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

  const findConversationByToken = (token) =>
    safeConversations.find((conversation) => conversation?.conversation_token === token) || null

  const activeConversation = useMemo(
    () => safeConversations.find((c) => Number(c.id) === Number(activeId)) || null,
    [safeConversations, activeId]
  )

  const activeConversationReadReceipts = useMemo(
    () => conversationReadReceiptsById[Number(activeId)] || [],
    [activeId, conversationReadReceiptsById]
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

  const buildPreviewFromMessage = (message = {}) => ({
    last_message: message?.body ?? "",
    last_message_at: message?.created_at ?? null,
    last_message_sender_name: message?.sender_name ?? null,
    last_message_attachment_path: message?.attachment_path ?? null,
    last_message_attachment_url: message?.attachment_url ?? null,
    last_message_attachment_type: message?.attachment_type ?? null,
    last_message_attachment_name: message?.attachment_name ?? null,
  })

  const fetchConversationMessages = async (conversationId, { beforeId = null, limit = MSG_LIMIT } = {}) => {
    const params = { limit }
    if (beforeId) params.before_id = beforeId

    const res = await axios.get(route("messenger.messages", conversationId), { params })
    const chunk = res.data?.data || []
    const nextHasMore = Boolean(res.data?.has_more)
    const readReceipts = Array.isArray(res.data?.read_receipts) ? res.data.read_receipts : []

    cacheConversationMessages(conversationId, chunk, nextHasMore)

    return { chunk, hasMore: nextHasMore, readReceipts }
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

  const updateConversationPreview = (conversationId, messageLike = {}) => {
    const preview = buildPreviewFromMessage(messageLike)
    const senderSnapshot = buildRecentSenderSnapshot({
      id: messageLike?.sender_id,
      ipms_id: messageLike?.sender_ipms_id,
      name: messageLike?.sender_name,
      avatar: messageLike?.sender_avatar,
    })

    setConversations((prev) => {
      const idx = prev.findIndex((c) => Number(c.id) === Number(conversationId))
      if (idx === -1) return prev

      const updated = {
        ...prev[idx],
        ...preview,
      }

      const next = [...prev]
      next.splice(idx, 1)
      next.unshift(updated)
      return pushConversationRecentSender(sortConversationsByRecent(next), conversationId, senderSnapshot)
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

  const buildRecentSenderSnapshot = (sender = {}) => ({
    id: Number(sender?.id || 0),
    ipms_id: sender?.ipms_id ?? null,
    name: sender?.name ?? "Member",
    avatar: sender?.avatar || (sender?.ipms_id ? `/employees/image/${sender.ipms_id}` : null),
  })

  const emitConversationSync = (conversationId) => {
    if (typeof window === "undefined") return

    window.dispatchEvent(
      new CustomEvent("messenger:conversation-sync", {
        detail: { conversationId: Number(conversationId) || null },
      })
    )
  }

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
          conversation_token: options.conversationToken ?? prev[idx].conversation_token ?? null,
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
        return sortConversationsByRecent(next)
      }

      const created = {
        id: Number(conversationId),
        type,
        conversation_token: options.conversationToken ?? null,
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
      return sortConversationsByRecent(next)
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

      setConvoHasMore(resolveConversationHasMore(hasMoreFromApi, chunk.length, CONVO_LIMIT))

      if (append) {
        setConversations((prev) => mergeConversationPages(prev, chunk))
      } else {
        setConversations(sortConversationsByRecent(chunk))

        if (!activeId && chunk.length && !initialConversationId) {
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
      const { chunk, hasMore: nextHasMore, readReceipts } = await fetchConversationMessages(convoId, {
        beforeId,
        limit: MSG_LIMIT,
      })

      if (requestToken != null && requestToken !== activeMessagesRequestRef.current) {
        return
      }

      setHasMore(nextHasMore)
      setConversationReadReceiptsById((prev) => ({
        ...prev,
        [convoId]: readReceipts,
      }))

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

  const startConversation = async (recipientIds = selectedUserIds) => {
    try {
      if (!recipientIds.length) return

      const selectedRecipients = recipientIds
        .map((id) => safeUsers.find((user) => Number(user.id) === Number(id)))
        .filter(Boolean)
      const isGroup = selectedRecipients.length > 1
      const displayName = isGroup
        ? buildGroupTitle(selectedRecipients.map((user) => user.name))
        : (selectedRecipients[0]?.name || "Conversation")

      const res = await axios.post(route("messenger.start-conversation"), {
        user_ids: recipientIds.map((id) => Number(id)),
      })

      const conversationId = res.data?.id
      const conversationToken = res.data?.conversation_token ?? null
      if (!conversationId) return

      const shouldSkipInitialFetch = true

      upsertConversationToTop(
        conversationId,
        displayName,
        isGroup ? "group" : "direct",
        selectedRecipients.map((user) => buildParticipantSnapshot(user)),
        { skipInitialFetch: shouldSkipInitialFetch, conversationToken }
      )
      setActiveId(conversationId)
      setSelectedUserIds([])
      setIsCreatingConversation(false)
      emitConversationSync(conversationId)
      return conversationId
    } catch (error) {
      console.log("startConversation error:", error.response?.data || error)
      return false
    }
  }

  const ensureConversationForDraft = async (recipientIds = selectedUserIds) => {
    if (!recipientIds.length) return null

    const conversationId = await startConversation(recipientIds)
    return conversationId || null
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

  const handleDeleteConversation = async (conversationId) => {
    if (!conversationId) return

    try {
      await axios.delete(route("messenger.destroy", conversationId))

      messagesByConversationRef.current.delete(Number(conversationId))
      setConversations((prev) => prev.filter((c) => Number(c.id) !== Number(conversationId)))

      if (Number(activeId) === Number(conversationId)) {
        setActiveId(null)
        setMessages([])
        setHasMore(true)
        setBody("")
        setReplyTo(null)
        setTypingUser(null)
        setIsCreatingConversation(false)
        setSelectedUserIds([])
      }
    } catch (error) {
      console.log("messenger.destroy error:", error.response?.data || error)
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

      setConversations((prev) =>
        prev.map((conversation) => {
          if (Number(conversation.id) !== Number(conversationId)) return conversation

          return {
            ...conversation,
            type: "group",
            title: res.data?.title || nextTitle,
            name: res.data?.name || res.data?.title || nextTitle,
          }
        })
      )

      void fetchConversations({ silent: true })
      emitConversationSync(conversationId)
    } catch (error) {
      console.log("messenger.update-title error:", error.response?.data || error)
    }
  }

  const updateConversationMembers = async (conversationId, action, userIds = []) => {
    if (!conversationId || !action) return false

    try {
      const res = await axios.post(route("messenger.members", conversationId), {
        action,
        user_ids: userIds.map((id) => Number(id)),
      })

      if (res.data) {
        setConversations((prev) => applyConversationMembershipUpdate(prev, res.data, me?.id).conversations)
        void fetchConversations({ silent: true })
        emitConversationSync(conversationId)
      }

      return res.data || true
    } catch (error) {
      console.log("messenger.members error:", error.response?.data || error)
      return false
    }
  }

  const handleAddConversationMembers = async (conversationId, userIds = []) => {
    return updateConversationMembers(conversationId, "add", userIds)
  }

  const handleRemoveConversationMember = async (conversationId, userId) => {
    return updateConversationMembers(conversationId, "remove", [userId])
  }

  const handleLeaveConversationGroup = async (conversationId) => {
    return updateConversationMembers(conversationId, "leave")
  }

  const handlePreviewConversation = (conversationId, options = {}) => {
    setActiveId(conversationId)
    setIsCreatingConversation(Boolean(options?.draft) || !conversationId)
    if (!conversationId) {
      setMessages([])
      setHasMore(true)
      setConversationReadReceiptsById({})
    }
    setBody("")
    setReplyTo(null)
    setTypingUser(null)
    if (!options?.preserveSelection) {
      setSelectedUserIds([])
    }
  }

  const resolveDirectConversationId = (userId) => {
    const match = safeConversations.find((c) => {
      if (c?.type !== "direct") return false
      return Number(c.other_user_id) === Number(userId)
    })

    return match?.id ?? null
  }

  const resolveConversationIdForRecipientIds = (recipientIds = []) => {
    const normalizedRecipientIds = [...new Set(recipientIds.map((id) => Number(id)).filter(Boolean))]
    if (!normalizedRecipientIds.length) return null

    if (normalizedRecipientIds.length === 1) {
      return resolveDirectConversationId(normalizedRecipientIds[0])
    }

    const selectedSet = new Set(normalizedRecipientIds)

    const matchesParticipants = (conversation = {}) => {
      const participantIds = Array.isArray(conversation?.participants)
        ? conversation.participants
            .map((participant) => Number(participant?.id))
            .filter((id) => Number.isFinite(id) && id > 0)
        : []

      const candidateSets = [
        participantIds,
        me?.id ? participantIds.filter((id) => Number(id) !== Number(me.id)) : participantIds,
      ]

      return candidateSets.some((candidate) => {
        if (candidate.length !== selectedSet.size) return false
        return candidate.every((id) => selectedSet.has(Number(id)))
      })
    }

    const match = safeConversations.find((conversation) => {
      if (conversation?.type !== "group") return false
      return matchesParticipants(conversation)
    })

    return match?.id ?? null
  }

  useEffect(() => {
    if (!selectedUserIds.length) return

    const matchedConversationId = resolveConversationIdForRecipientIds(selectedUserIds)

    if (matchedConversationId) {
      if (Number(activeId) !== Number(matchedConversationId)) {
        setActiveId(matchedConversationId)
      }
      return
    }

    if (activeId !== null) {
      setActiveId(null)
      setMessages([])
      setHasMore(true)
      setConversationReadReceiptsById({})
      setBody("")
      setReplyTo(null)
      setTypingUser(null)
    }
  }, [activeId, resolveConversationIdForRecipientIds, selectedUserIds])

  useEffect(() => {
    fetchConversations()
  }, [])

  useEffect(() => {
    if (!initialConversationId) return

    const found = safeConversations.find((conversation) => Number(conversation.id) === Number(initialConversationId))
    if (found) {
      setActiveId((current) => {
        if (Number(current) === Number(found.id)) return current
        return found.id
      })
    }
  }, [initialConversationId, safeConversations])

  useEffect(() => {
    if (typeof window === "undefined") return undefined

    const syncFromHash = () => {
      const conversationToken = readConversationTokenFromLocation()
      if (conversationToken) {
        const found = findConversationByToken(conversationToken)
        if (found) {
          setActiveId((current) => {
            if (Number(current) === Number(found.id)) return current
            return found.id
          })
        }
        return
      }

      const rootPath = new URL(route("messenger.index"), window.location.origin).pathname.replace(/\/+$/, "")
      if (window.location.pathname.replace(/\/+$/, "") === rootPath) {
        setActiveId((current) => {
          if (current != null) return current
          if (isCreatingConversation || selectedUserIds.length > 0) return null
          return safeConversations[0]?.id ?? null
        })
      }
    }

    syncFromHash()
    window.addEventListener("popstate", syncFromHash)

    return () => {
      window.removeEventListener("popstate", syncFromHash)
    }
  }, [safeConversations, isCreatingConversation, selectedUserIds.length])

  useEffect(() => {
    if (typeof window === "undefined") return

    if (!activeId) {
      const nextUrl = new URL(route("messenger.index"), window.location.origin)
      if (window.location.pathname !== nextUrl.pathname) {
        window.history.replaceState(null, "", nextUrl.toString())
      }
      return
    }

    const activeConversation = safeConversations.find((conversation) => Number(conversation.id) === Number(activeId)) || null
    const conversationToken = activeConversation?.conversation_token
    if (!conversationToken) return

    const nextUrl = new URL(route("messenger.conversation", conversationToken), window.location.origin)
    if (`${window.location.pathname}${window.location.search}` === `${nextUrl.pathname}${nextUrl.search}`) {
      return
    }

    window.history.replaceState(null, "", nextUrl.toString())
  }, [activeId, safeConversations])

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

      updateConversationPreview(e.conversation_id ?? activeId, e)
      setTypingUser(null)

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }

      requestAnimationFrame(() => {
        if (!listRef.current) return
        listRef.current.scrollTop = listRef.current.scrollHeight
      })
    })

    channel.listen(".conversation.read", (e) => {
      const conversationId = Number(e.conversation_id ?? activeId)
      if (!conversationId) return

      setConversationReadReceiptsById((prev) => {
        const current = Array.isArray(prev[conversationId]) ? prev[conversationId] : []
        const next = current.filter((receipt) => Number(receipt?.user_id) !== Number(e.user_id))
        next.push({
          user_id: Number(e.user_id),
          last_read_message_id: e.last_read_message_id != null ? Number(e.last_read_message_id) : null,
          last_read_at: e.last_read_at ?? null,
          reader_name: e.reader_name ?? null,
          reader_ipms_id: e.reader_ipms_id ?? null,
        })

        return {
          ...prev,
          [conversationId]: next,
        }
      })

      setConversations((prev) =>
        prev.map((conversation) =>
          Number(conversation.id) === Number(conversationId)
            ? { ...conversation, unread_count: 0 }
            : conversation
        )
      )

      markConversationRead(conversationId)
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
        const senderSnapshot = buildRecentSenderSnapshot({
          id: e.sender_id,
          ipms_id: e.sender_ipms_id,
          name: e.sender_name,
          avatar: e.sender_avatar,
        })

        if (idx >= 0) {
          const updated = {
            ...prev[idx],
            last_message: e.last_message,
            last_message_at: e.last_message_at,
            last_message_sender_name: e.sender_name ?? prev[idx].last_message_sender_name ?? null,
            last_message_attachment_path: e.last_message_attachment_path ?? null,
            last_message_attachment_url: e.last_message_attachment_url ?? null,
            last_message_attachment_name: e.last_message_attachment_name ?? null,
            last_message_attachment_type: e.last_message_attachment_type ?? null,
            type: e.conversation_type || prev[idx].type,
            title: e.conversation_title ?? prev[idx].title ?? null,
            conversation_token: e.conversation_token ?? prev[idx].conversation_token ?? null,
            name: e.conversation_type === "group"
              ? (e.conversation_title || prev[idx].name || "Conversation")
              : (prev[idx].name || e.sender_name || "Conversation"),
            participants: e.participants ?? prev[idx].participants ?? [],
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
            participants: e.participants ?? [],
            last_message: e.last_message,
            last_message_sender_name: e.sender_name ?? null,
            last_message_attachment_path: e.last_message_attachment_path ?? null,
            last_message_attachment_url: e.last_message_attachment_url ?? null,
            last_message_attachment_name: e.last_message_attachment_name ?? null,
            last_message_attachment_type: e.last_message_attachment_type ?? null,
            last_message_at: e.last_message_at,
          },
          ...prev,
        ]
        return pushConversationRecentSender(sortConversationsByRecent(next), e.conversation_id, senderSnapshot)
      })
    })

    window.Echo.private(`user.${me.id}`).listen(".messenger.conversation.renamed", (e) => {
      if (!e?.conversation_id) return

      setConversations((prev) =>
        prev.map((conversation) => {
          if (Number(conversation.id) !== Number(e.conversation_id)) return conversation

          return {
            ...conversation,
            type: "group",
            title: e.title ?? conversation.title ?? null,
            name: e.name ?? e.title ?? conversation.name ?? "Conversation",
          }
        })
      )
    })

    window.Echo.private(`user.${me.id}`).listen(".messenger.conversation.members-updated", (e) => {
      if (!e?.conversation_id) return

      const removedUserIds = Array.isArray(e.removed_user_ids) ? e.removed_user_ids.map((id) => Number(id)) : []
      const removedForMe = Number(me?.id) > 0 && removedUserIds.includes(Number(me?.id))
      const deleted = Boolean(e.deleted)

      setConversations((prev) => applyConversationMembershipUpdate(prev, e, me?.id).conversations)

      if (removedForMe || deleted) {
        setActiveId((current) => {
          if (Number(current) === Number(e.conversation_id)) {
            setMessages([])
            setHasMore(true)
            setBody("")
            setReplyTo(null)
            setTypingUser(null)
            setIsCreatingConversation(false)
            setSelectedUserIds([])
            return null
          }

          return current
        })
      }
    })

    return () => {
      window.Echo.leave(`private-user.${me.id}`)
    }
  }, [me?.id])

  const handleConversationScroll = () => {
    const el = convoListRef.current
    if (!el || conversationsLoading || loadingMoreConversations || !convoHasMore) return

    if (!isConversationListNearBottom(el)) return

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

  const sendMessage = async (payload = {}) => {
    const draft = typeof payload === "string"
      ? payload
      : String(payload?.body ?? "").trim()
    const attachment = typeof payload === "object" && payload !== null ? payload.attachment ?? null : null
    const replyTarget = typeof payload === "object" && payload !== null ? payload.replyTo ?? replyTo : replyTo

    if (!draft && !attachment) return false

    const targetConversationId = await ensureConversationForDraft()
    if (!targetConversationId) return false

    handleSelectConversation(targetConversationId)

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
      reply_to: replyTarget
        ? {
            id: replyTarget.id,
            sender_id: replyTarget.sender_id,
            sender_name: replyTarget.sender_name,
            sender_gender: replyTarget.sender_gender ?? null,
            body: replyTarget.body,
            attachment_path: replyTarget.attachment_path ?? null,
            attachment_url: replyTarget.attachment_url ?? null,
            attachment_name: replyTarget.attachment_name ?? null,
            attachment_type: replyTarget.attachment_type ?? null,
            attachment_size: replyTarget.attachment_size ?? null,
          }
        : null,
    }

    setBody("")
    setReplyTo(null)

    setMessages((prev) => {
      const next = [...prev, optimisticMessage]
      cacheConversationMessages(targetConversationId, next, hasMore)
      return next
    })

    updateConversationPreview(targetConversationId, optimisticMessage)
    emitConversationSync(targetConversationId)

    try {
      const formData = new FormData()
      formData.append("body", draft)
      if (attachment) {
        formData.append("attachment", attachment)
      }
      if (replyTarget?.id) {
        formData.append("reply_to_id", replyTarget.id)
      }

      const res = await axios.post(route("messenger.send", targetConversationId), formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      const msg = res.data?.data

        if (msg) {
          setMessages((prev) => {
            const replaced = prev.map((m) => (m.id === tempId ? msg : m))
            const uniq = new Map()
            for (const m of replaced) uniq.set(m.id, m)
            const next = [...uniq.values()].sort((a, b) => Number(a?.id || 0) - Number(b?.id || 0))
            cacheConversationMessages(targetConversationId, next, hasMore)
            return next
          })

          updateConversationPreview(targetConversationId, msg)
          void fetchConversations({ silent: true })
          emitConversationSync(targetConversationId)
          setTypingUser(null)

        requestAnimationFrame(() => {
          if (!listRef.current) return
          listRef.current.scrollTop = listRef.current.scrollHeight
        })
      }
      return true
    } catch (error) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId))
      setBody(draft)
      setReplyTo(replyTarget)
      console.log("messenger.send error:", error.response?.data || error)
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
      if (msg) {
        updateConversationPreview(targetConversationId, msg)
      }

      void fetchConversations({ silent: true })
      emitConversationSync(targetConversationId)

      return true
    } catch (error) {
      console.log("messenger.forward error:", error.response?.data || error)
      return false
    }
  }

  return (
    <>
      <Head title="Messenger" />

      <div className="h-[calc(100vh-140px)] min-h-0 grid grid-cols-[clamp(240px,28vw,340px)_minmax(0,1fr)] gap-4">
        <Conversations
          me={me}
          meId={me?.id}
          onlineUserIds={onlineUserIds}
          safeUsers={safeUsers}
          safeConversations={safeConversations}
          activeId={activeId}
          onNewMessage={handleNewMessage}
          onSelectConversation={handleSelectConversation}
          onDeleteConversation={handleDeleteConversation}
          onRenameConversation={handleRenameConversation}
          onLeaveConversationGroup={handleLeaveConversationGroup}
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
            conversationReadReceipts={activeConversationReadReceipts}
            selectedUserIds={selectedUserIds}
            setSelectedUserIds={setSelectedUserIds}
            isComposing={isCreatingConversation || selectedUserIds.length > 0}
            onlineUserIds={onlineUserIds}
            avatarUrl={avatarUrl}
            typingUser={typingUser}
            startConversation={startConversation}
            onPreviewConversation={handlePreviewConversation}
            resolveDirectConversationId={resolveDirectConversationId}
            resolveConversationIdForRecipientIds={resolveConversationIdForRecipientIds}
            onDeleteConversation={handleDeleteConversation}
            onRenameConversation={handleRenameConversation}
            onAddConversationMembers={handleAddConversationMembers}
            onRemoveConversationMember={handleRemoveConversationMember}
            onLeaveConversationGroup={handleLeaveConversationGroup}
          />

          <Messages
            me={me}
            orderedMessages={orderedMessages}
            activeConversationId={activeId}
            conversations={safeConversations}
            safeUsers={safeUsers}
            conversationReadReceipts={activeConversationReadReceipts}
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
            sendQuickLike={sendQuickLike}
            sendSticker={sendSticker}
            onForwardMessage={forwardMessage}
            onOpenConversation={handleSelectConversation}
          />
        </div>
      </div>
    </>
  )
}
