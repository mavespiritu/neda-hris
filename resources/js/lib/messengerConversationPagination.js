export const sortConversationsByRecent = (items = []) => {
  return [...items].sort((a, b) => {
    const aTime = a?.last_message_at
      ? new Date(a.last_message_at).getTime()
      : (a?.updated_at ? new Date(a.updated_at).getTime() : 0)
    const bTime = b?.last_message_at
      ? new Date(b.last_message_at).getTime()
      : (b?.updated_at ? new Date(b.updated_at).getTime() : 0)

    if (bTime !== aTime) return bTime - aTime

    return Number(b?.id || 0) - Number(a?.id || 0)
  })
}

export const mergeConversationPages = (existing = [], incoming = []) => {
  const merged = [...existing, ...incoming]
  const uniq = new Map()

  for (const conversation of merged) {
    if (conversation?.id == null) continue
    uniq.set(conversation.id, conversation)
  }

  return sortConversationsByRecent([...uniq.values()])
}

export const resolveConversationHasMore = (hasMoreFromApi, chunkLength, limit) => {
  return typeof hasMoreFromApi === "boolean"
    ? hasMoreFromApi
    : chunkLength === limit
}

export const isConversationListNearBottom = (element, threshold = 20) => {
  if (!element) return false

  return element.scrollTop + element.clientHeight >= element.scrollHeight - threshold
}
