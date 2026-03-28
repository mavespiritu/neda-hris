import { sortConversationsByRecent } from "@/lib/messengerConversationPagination"

const normalizeIds = (values = []) =>
  values
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value) && value > 0)

const normalizeSenderSnapshot = (sender = {}) => {
  if (sender?.id == null) return null

  return {
    id: Number(sender.id),
    ipms_id: sender?.ipms_id ?? null,
    name: String(sender?.name || "Member").trim() || "Member",
    avatar: sender?.avatar || (sender?.ipms_id ? `/employees/image/${sender.ipms_id}` : null),
  }
}

const buildDisplayName = (conversation = {}, participants = []) => {
  if (conversation?.type !== "group") {
    return conversation?.name || conversation?.title || "Conversation"
  }

  if (conversation?.title) {
    return conversation.title
  }

  const names = participants
    .map((participant) => String(participant?.name || "").trim())
    .filter(Boolean)

  if (!names.length) return "Group Chat"
  if (names.length <= 3) return names.join(", ")
  return `${names.slice(0, 2).join(", ")} + ${names.length - 2} others`
}

export const applyConversationMembershipUpdate = (conversations = [], payload = {}, meId = null) => {
  const conversationId = Number(payload?.conversation_id || 0)
  if (!conversationId) {
    return { conversations, removed: false }
  }

  const removedUserIds = new Set(normalizeIds(payload?.removed_user_ids || []))
  const deleted = Boolean(payload?.deleted)
  const removedForMe = Boolean(Number(meId) && removedUserIds.has(Number(meId)))
  const shouldRemove = deleted || removedForMe

  const nextParticipants = Array.isArray(payload?.participants) ? payload.participants : []
  const conversationToken = payload?.conversation_token ?? null
  const conversationType = payload?.conversation_type || "group"
  const conversationTitle = payload?.conversation_title ?? null

  const updatedConversation = (conversation = null) => {
    const base = conversation || {}
    const type = conversationType || base.type || "group"

    return {
      ...base,
      id: conversationId,
      type,
      conversation_token: conversationToken ?? base.conversation_token ?? null,
      title: conversationTitle ?? base.title ?? null,
      updated_at: payload?.conversation_updated_at ?? base.updated_at ?? null,
      name: type === "group"
        ? (conversationTitle || buildDisplayName(base, nextParticipants))
        : (base.name || conversationTitle || "Conversation"),
      participants: nextParticipants.length ? nextParticipants : (base.participants || []),
    }
  }

  const idx = conversations.findIndex((conversation) => Number(conversation?.id) === conversationId)

  if (shouldRemove) {
    const filtered = conversations.filter((conversation) => Number(conversation?.id) !== conversationId)
    return {
      conversations: sortConversationsByRecent(filtered),
      removed: true,
    }
  }

  if (idx >= 0) {
    const next = [...conversations]
    next[idx] = updatedConversation(next[idx])
    return {
      conversations: sortConversationsByRecent(next),
      removed: false,
    }
  }

  const created = updatedConversation({
    id: conversationId,
    type: conversationType,
    title: conversationTitle ?? null,
    updated_at: payload?.conversation_updated_at ?? null,
    conversation_token: conversationToken ?? null,
    last_message: null,
    last_message_at: null,
    unread_count: 0,
  })

  return {
    conversations: sortConversationsByRecent([created, ...conversations]),
    removed: false,
  }
}

export const pushConversationRecentSender = (conversations = [], conversationId, sender = null) => {
  const senderSnapshot = normalizeSenderSnapshot(sender)
  if (!senderSnapshot || !conversationId) {
    return conversations
  }

  const idx = conversations.findIndex((conversation) => Number(conversation?.id) === Number(conversationId))
  if (idx === -1) {
    return conversations
  }

  const current = conversations[idx]
  const existing = Array.isArray(current?.recent_senders) ? current.recent_senders : []
  const nextSenders = [senderSnapshot, ...existing.filter((item) => Number(item?.id) !== senderSnapshot.id)].slice(0, 2)

  const next = [...conversations]
  next[idx] = {
    ...current,
    recent_senders: nextSenders,
  }

  return next
}
