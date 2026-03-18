import { Loader2 } from "lucide-react"
import SingleComboBox from "@/components/SingleComboBox"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function Conversations({
  me,
  safeUsers,
  receiverId,
  setReceiverId,
  startDirect,
  onlineUserIds,
  safeConversations,
  activeId,
  setActiveId,
  conversationsLoading,
  loadingMoreConversations,
  convoListRef,
  handleConversationScroll,
  avatarUrl,
}) {
  return (
    <div className="border rounded p-2 min-h-0 flex flex-col overflow-hidden">
      <div className="mb-2 flex items-start gap-2 shrink-0">
        <div className="flex-1 min-w-0">
          <SingleComboBox
            items={safeUsers
              .filter((u) => u.id !== me?.id)
              .map((u) => ({
                value: u.id,
                label: u.name,
                ipms_id: u.ipms_id,
                isOnline: onlineUserIds.has(Number(u.id)),
              }))}
            value={receiverId ? Number(receiverId) : null}
            onChange={(v) => setReceiverId(v ? String(v) : "")}
            placeholder="Select receiver"
            renderLabel={(item) =>
              item ? (
                <div className="flex items-center gap-2">
                  <div className="relative shrink-0">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={avatarUrl(item.ipms_id)} alt={item.label} loading="lazy" />
                      <AvatarFallback>
                        {(item.label || "U")
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-white ${
                        item.isOnline ? "bg-green-500" : "bg-red-500"
                      }`}
                    />
                  </div>
                  <span>{item.label}</span>
                </div>
              ) : (
                "Select receiver"
              )
            }
          />
        </div>

        <button
          type="button"
          onClick={startDirect}
          disabled={!receiverId}
          className={`h-10 px-3 rounded text-sm text-white shrink-0 ${
            receiverId ? "bg-slate-800 hover:bg-slate-700" : "bg-slate-400 cursor-not-allowed"
          }`}
        >
          Start Chat
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
              className={`w-full text-left p-2 rounded overflow-hidden ${
                    activeId === c.id ? "bg-slate-200" : "hover:bg-slate-100"
                }`}
              onClick={() => setActiveId(c.id)}
            >
              <div className="flex items-center gap-2">
                <div className="relative shrink-0">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={avatarUrl(c.other_user_ipms_id)} alt={c.name} loading="lazy" />
                    <AvatarFallback>
                      {(c.name || "U")
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {c.type === "direct" && (
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${
                        onlineUserIds.has(Number(c.other_user_id)) ? "bg-green-500" : "bg-red-500"
                      }`}
                    />
                  )}
                </div>

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
