import { createContext, useContext, useEffect, useMemo, useState } from "react"

const MessengerPresenceContext = createContext(new Set())

export const MessengerPresenceProvider = ({ userId, children }) => {
  const [onlineUserIds, setOnlineUserIds] = useState(new Set())

  useEffect(() => {
    setOnlineUserIds(new Set())

    if (!userId) {
      return undefined
    }

    let cancelled = false
    let channel = null
    let retryTimer = null

    const attachPresence = () => {
      if (cancelled) return

      if (!window.Echo) {
        retryTimer = window.setTimeout(attachPresence, 250)
        return
      }

      channel = window.Echo.join("messenger.presence")
        .here((presenceUsers) => {
          const next = new Set((presenceUsers || []).map((user) => Number(user.id)))
          next.add(Number(userId))
          setOnlineUserIds(next)
        })
        .joining((user) => {
          setOnlineUserIds((prev) => {
            const next = new Set(prev)
            next.add(Number(user.id))
            next.add(Number(userId))
            return next
          })
        })
        .leaving((user) => {
          setOnlineUserIds((prev) => {
            const next = new Set(prev)
            next.delete(Number(user.id))
            next.add(Number(userId))
            return next
          })
        })
    }

    attachPresence()

    return () => {
      cancelled = true

      if (retryTimer) {
        window.clearTimeout(retryTimer)
      }

      if (channel && window.Echo) {
        window.Echo.leave("messenger.presence")
      }
    }
  }, [userId])

  const value = useMemo(() => onlineUserIds, [onlineUserIds])

  return (
    <MessengerPresenceContext.Provider value={value}>
      {children}
    </MessengerPresenceContext.Provider>
  )
}

export const useMessengerPresence = () => useContext(MessengerPresenceContext)
