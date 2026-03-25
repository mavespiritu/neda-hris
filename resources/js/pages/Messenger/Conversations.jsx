import { Loader2, MessageSquarePlus } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const ConversationAvatar = ({ conversation, avatarUrl, onlineUserIds }) => {
  const participants = conversation?.participants || []

  if (conversation?.type === "group" && participants.length) {
    const preview = participants.slice(0, 2)

    return (
      <div className="relative h-9 w-9 shrink-0">
        {preview.map((participant, index) => (
          <Avatar
            key={participant.id ?? index}
            className={`absolute h-6 w-6 border-2 border-background ${index === 0 ? "left-0 top-0" : "bottom-0 right-0"}`}
          >
            <AvatarImage src={participant.avatar || avatarUrl(participant.ipms_id)} alt={participant.name} loading="lazy" />
            <AvatarFallback>
              {(participant.name || "U")
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
        ))}

        {participants.length > 2 && (
          <div className="absolute -right-1 -bottom-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-slate-200 px-1 text-[9px] font-semibold text-slate-700">
            +{participants.length - 2}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="relative shrink-0">
      <Avatar className="h-9 w-9">
        <AvatarImage
          src={conversation?.other_user_avatar || avatarUrl(conversation?.other_user_ipms_id)}
          alt={conversation?.name}
          loading="lazy"
        />
        <AvatarFallback>
          {(conversation?.name || "U")
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)
            .toUpperCase()}
        </AvatarFallback>
      </Avatar>

      {conversation?.type === "direct" && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${
            onlineUserIds.has(Number(conversation.other_user_id)) ? "bg-green-500" : "bg-red-500"
          }`}
        />
      )}
    </div>
  )
}

export default function Conversations({
  onlineUserIds,
  safeConversations,
  activeId,
  onSelectConversation,
  onNewMessage,
  conversationsLoading,
  loadingMoreConversations,
  convoListRef,
  handleConversationScroll,
  avatarUrl,
}) {
  return (
    <div className="border rounded p-2 min-h-0 flex flex-col overflow-hidden">
      <div className="mb-2 flex items-center justify-between gap-2 shrink-0">
        <div>
          <div className="font-semibold tracking-tight text-lg text-black">Conversations</div>
          <div className="text-xs text-muted-foreground">Browse or start a new message</div>
        </div>

        <button
          type="button"
          onClick={onNewMessage}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border bg-background text-muted-foreground transition hover:bg-muted hover:text-foreground"
          aria-label="New message"
          title="New message"
        >
          <MessageSquarePlus className="h-4 w-4" />
        </button>
      </div>

      <div className="relative flex-1 min-h-0">
        <div
          ref={convoListRef}
          onScroll={handleConversationScroll}
          className={`h-full overflow-y-auto space-y-1 pr-1 transition ${
            conversationsLoading ? "blur-[1px] opacity-70 pointer-events-none" : ""
          }`}
        >
          {safeConversations.map((c) => (
            <button
              key={`conversation-${c.id}`}
              className={`w-full overflow-hidden rounded p-2 text-left ${
                activeId === c.id ? "bg-slate-200" : "hover:bg-slate-100"
              }`}
              onClick={() => onSelectConversation?.(c.id)}
            >
              <div className="flex items-center gap-2">
                <ConversationAvatar conversation={c} avatarUrl={avatarUrl} onlineUserIds={onlineUserIds} />

                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm truncate">{c.name}</div>
                  <div className="text-xs text-slate-500 truncate">{c.last_message || "No message yet"}</div>
                </div>
              </div>
            </button>
          ))}

          {!conversationsLoading && safeConversations.length === 0 && (
            <div className="text-xs text-slate-500 text-center py-3">No conversations yet.</div>
          )}
        </div>

        {conversationsLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center">
            <div className="rounded-md bg-background/90 px-4 py-3 text-xs flex items-center gap-2 shadow-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading conversations...</span>
            </div>
          </div>
        )}

        {loadingMoreConversations && !conversationsLoading && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10">
            <div className="rounded-md bg-background/90 px-3 py-2 text-xs flex items-center gap-2 shadow-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading more...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
