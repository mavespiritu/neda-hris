import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from "react"
import { useMessengerPresence } from "@/providers/MessengerPresenceProvider"

const MessengerSharedContext = createContext({
  onlineUserIds: new Set(),
  isUserOnline: () => false,
  markConversationRead: () => {},
})

const SYNC_CHANNEL_NAME = "messenger-sync"
const SYNC_STORAGE_KEY = "messenger-sync-event"

export const MessengerSharedProvider = ({ children }) => {
  const onlineUserIds = useMessengerPresence()
  const channelRef = useRef(null)

  const isUserOnline = useCallback(
    (userId) => onlineUserIds.has(Number(userId)),
    [onlineUserIds]
  )

  useEffect(() => {
    if (typeof window === "undefined") return undefined

    let active = true

    const emitLocalRead = (conversationId) => {
      const id = Number(conversationId || 0)
      if (!id) return

      window.dispatchEvent(
        new CustomEvent("messenger:conversation-read", {
          detail: { conversationId: id },
        })
      )
    }

    const handleSyncMessage = (payload = {}) => {
      if (!active) return

      if (payload?.type === "conversation-read") {
        emitLocalRead(payload.conversationId)
      }
    }

    let channel = null
    if ("BroadcastChannel" in window) {
      channel = new BroadcastChannel(SYNC_CHANNEL_NAME)
      channel.onmessage = (event) => handleSyncMessage(event?.data || {})
      channelRef.current = channel
    }

    const handleStorageSync = (event) => {
      if (event.key !== SYNC_STORAGE_KEY || !event.newValue) return

      try {
        const payload = JSON.parse(event.newValue)
        handleSyncMessage(payload)
      } catch {
        // Ignore malformed sync payloads.
      }
    }

    window.addEventListener("storage", handleStorageSync)

    return () => {
      active = false
      window.removeEventListener("storage", handleStorageSync)

      if (channel) {
        channel.close()
      }

      channelRef.current = null
    }
  }, [])

  const markConversationRead = useCallback((conversationId) => {
    const id = Number(conversationId || 0)
    if (!id || typeof window === "undefined") return

    const payload = {
      type: "conversation-read",
      conversationId: id,
      timestamp: Date.now(),
    }

    window.dispatchEvent(
      new CustomEvent("messenger:conversation-read", {
        detail: { conversationId: id },
      })
    )

    const channel = channelRef.current
    if (channel) {
      channel.postMessage(payload)
      return
    }

    try {
      window.localStorage.setItem(SYNC_STORAGE_KEY, JSON.stringify(payload))
      window.localStorage.removeItem(SYNC_STORAGE_KEY)
    } catch {
      // Ignore storage write failures.
    }
  }, [])

  const value = useMemo(
    () => ({
      onlineUserIds,
      isUserOnline,
      markConversationRead,
    }),
    [onlineUserIds, isUserOnline, markConversationRead]
  )

  return (
    <MessengerSharedContext.Provider value={value}>
      {children}
    </MessengerSharedContext.Provider>
  )
}

export const useMessengerShared = () => useContext(MessengerSharedContext)

export const useConversationReadSync = (setConversations) => {
  const { markConversationRead } = useMessengerShared()

  useEffect(() => {
    if (!setConversations) return undefined

    const handleConversationRead = (event) => {
      const conversationId = Number(event?.detail?.conversationId || 0)
      if (!conversationId) return

      setConversations((prev) =>
        prev.map((conversation) =>
          Number(conversation.id) === Number(conversationId)
            ? { ...conversation, unread_count: 0 }
            : conversation
        )
      )
    }

    window.addEventListener("messenger:conversation-read", handleConversationRead)
    return () => window.removeEventListener("messenger:conversation-read", handleConversationRead)
  }, [setConversations])

  return { markConversationRead }
}
