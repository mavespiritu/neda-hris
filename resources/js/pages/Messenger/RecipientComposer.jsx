import { useEffect, useMemo, useRef, useState } from "react"
import { Check, Search, X } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useMessengerShared } from "@/providers/MessengerSharedProvider"

export default function RecipientComposer({
  me,
  safeUsers,
  selectedUserIds,
  setSelectedUserIds,
  onPreviewConversation,
  resolveDirectConversationId,
  resolveConversationIdForRecipientIds,
  onlineUserIds,
  avatarUrl,
  excludeUserIds = [],
  autoOpen = false,
  keepOpenOnSelect = false,
  draftOnMissingConversation = false,
  compact = false,
  floatingDropdown = false,
}) {
  const { onlineUserIds: sharedOnlineUserIds } = useMessengerShared()
  const resolvedOnlineUserIds = onlineUserIds ?? sharedOnlineUserIds
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)

  const recipientMap = useMemo(() => {
    const map = new Map()
    const excluded = new Set([Number(me?.id), ...excludeUserIds.map((id) => Number(id))].filter((id) => Number.isFinite(id) && id > 0))
    for (const user of safeUsers || []) {
      if (user?.id == null || excluded.has(Number(user.id))) continue
      map.set(Number(user.id), user)
    }
    return map
  }, [safeUsers, me?.id, excludeUserIds])

  const selectedUsers = useMemo(
    () => selectedUserIds.map((id) => recipientMap.get(Number(id))).filter(Boolean),
    [selectedUserIds, recipientMap]
  )

  const isUserOnline = (userId) => resolvedOnlineUserIds?.has(Number(userId))

  const finalizeSelection = async () => {
    setQuery("")
    setOpen(false)
  }

  useEffect(() => {
      const handlePointerDown = (event) => {
        if (!containerRef.current?.contains(event.target)) {
          if (selectedUsers.length) {
            void finalizeSelection()
          } else {
            setOpen(false)
          }
        }
      }

    document.addEventListener("mousedown", handlePointerDown)
    return () => document.removeEventListener("mousedown", handlePointerDown)
  }, [selectedUsers.length])

  useEffect(() => {
    if (autoOpen) {
      setOpen(true)
    }
  }, [autoOpen])

  const filteredUsers = useMemo(() => {
    const term = query.trim().toLowerCase()
    const selectedSet = new Set(selectedUserIds.map(Number))

    return [...recipientMap.values()]
      .filter((user) => {
        if (!term) return true

        const haystack = [
          user.name,
          user.email,
          user.ipms_id,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()

        return haystack.includes(term)
      })
      .sort((a, b) => {
        const aSelected = selectedSet.has(Number(a.id))
        const bSelected = selectedSet.has(Number(b.id))
        if (aSelected !== bSelected) return aSelected ? 1 : -1
        return String(a.name || "").localeCompare(String(b.name || ""))
      })
      .slice(0, 8)
  }, [query, recipientMap, selectedUserIds])

  const addRecipient = (userId) => {
    const id = Number(userId)
    if (!id) return

    const alreadySelected = selectedUserIds.map(Number).includes(id)
    const nextSelectedIds = alreadySelected ? selectedUserIds : [...selectedUserIds, id]

    setSelectedUserIds((prev) => {
      if (prev.map(Number).includes(id)) {
        return prev
      }

      return [...prev, id]
    })

    setQuery("")
    const candidateConversationId =
      resolveConversationIdForRecipientIds?.(nextSelectedIds)
      ?? (selectedUserIds.length === 0 ? resolveDirectConversationId?.(id) : null)

    if (candidateConversationId) {
      onPreviewConversation?.(candidateConversationId, { preserveSelection: true })
    } else if (draftOnMissingConversation) {
      onPreviewConversation?.(null, { preserveSelection: true, draft: true })
    }

    if (!keepOpenOnSelect) {
      setOpen(false)
    }
  }

  const removeRecipient = (userId) => {
    const id = Number(userId)
    setSelectedUserIds((prev) => prev.filter((v) => Number(v) !== id))
  }

  const onKeyDown = (e) => {
    if (e.key === "Backspace" && !query && selectedUserIds.length) {
      removeRecipient(selectedUserIds[selectedUserIds.length - 1])
    }

    if (e.key === "Enter") {
      e.preventDefault()
      const first = filteredUsers[0]
      if (first) {
        addRecipient(first.id)
      } else if (selectedUserIds.length) {
        void finalizeSelection()
      }
    }
  }

  return (
    <div ref={containerRef} className="rounded-lg bg-background">
      <div className={`px-3 py-1.5 ${compact ? "pb-0" : ""}`}>
        <div className="flex items-center gap-2">
          <div className="text-xs font-medium leading-none text-muted-foreground">To:</div>

          <div className="relative min-w-0 flex-1">
            <div
              className="rounded-md border border-transparent bg-background px-2 py-1.5 transition focus-within:border-transparent focus-within:ring-0"
              onClick={() => setOpen(true)}
            >
              <div
                className={`flex flex-wrap items-start gap-1.5 ${
                  compact ? "max-h-28 overflow-y-auto pr-1" : ""
                }`}
              >
                {selectedUsers.map((user) => (
                  <span
                    key={user.id}
                    className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700"
                  >
                    <span className="relative shrink-0">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={avatarUrl(user.ipms_id)} alt={user.name} loading="lazy" />
                        <AvatarFallback>
                          {(user.name || "U")
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-white ${
                          isUserOnline(user.id) ? "bg-green-500" : "bg-red-500"
                        }`}
                      />
                    </span>
                    <span className="max-w-[140px] truncate">{user.name}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeRecipient(user.id)
                      }}
                      className="rounded-full p-0.5 text-slate-500 hover:bg-slate-200 hover:text-slate-700"
                      aria-label={`Remove ${user.name}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ))}

                <div className="flex min-w-[160px] flex-1 items-center gap-2">
                  <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <input
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value)
                      setOpen(true)
                    }}
                    onFocus={() => setOpen(true)}
                    onKeyDown={onKeyDown}
                    placeholder={selectedUsers.length ? "Add more people..." : "Type a name or email"}
                    className="h-8 min-w-[90px] flex-1 border-0 bg-transparent p-0 text-sm outline-none placeholder:text-muted-foreground focus:border-transparent focus:ring-0"
                  />
                </div>
              </div>
            </div>

            {open && (
              <div className={compact ? "relative" : "relative"}>
                <div
                  className={`z-50 overflow-hidden rounded-md border bg-background shadow-2xl ${
                    floatingDropdown || compact
                      ? "absolute left-0 right-0 top-full mt-2"
                      : "absolute left-0 right-0 top-2"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 px-3 py-2">
                    <div className="text-xs font-medium text-muted-foreground">Your contacts</div>
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
                      aria-label="Close recipient list"
                      title="Close"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="max-h-64 overflow-y-auto">
                    {filteredUsers.length ? (
                      filteredUsers.map((user) => {
                        const selected = selectedUserIds.includes(user.id)

                        return (
                          <button
                            key={user.id}
                            type="button"
                            onClick={() => addRecipient(user.id)}
                            className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition ${
                              selected ? "bg-slate-100" : "hover:bg-slate-50"
                            }`}
                          >
                            <div className="relative shrink-0">
                              <Avatar className="h-9 w-9">
                                <AvatarImage src={avatarUrl(user.ipms_id)} alt={user.name} loading="lazy" />
                                <AvatarFallback>
                                  {(user.name || "U")
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .slice(0, 2)
                                    .toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span
                                className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-white ${
                                  resolvedOnlineUserIds?.has(Number(user.id)) ? "bg-green-500" : "bg-red-500"
                                }`}
                              />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <div className="truncate font-medium">{user.name}</div>
                                {selected && <Check className="h-4 w-4 text-green-600" />}
                              </div>
                              <div className="truncate text-xs text-muted-foreground">{user.email}</div>
                            </div>
                          </button>
                        )
                      })
                    ) : (
                      <div className="px-3 py-4 text-sm text-muted-foreground">
                        No recipients found.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
