import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import RecipientComposer from "./RecipientComposer"

export default function SelectedConversation({
  me,
  safeUsers = [],
  activeConversation,
  selectedUserIds = [],
  setSelectedUserIds,
  isComposing = false,
  onlineUserIds,
  avatarUrl,
  typingUser,
  startConversation,
  onPreviewConversation,
  resolveDirectConversationId,
}) {
  return (
    <div className="shrink-0 border-b pb-2 mb-2">
      {isComposing ? (
        <RecipientComposer
          me={me}
          safeUsers={safeUsers}
          selectedUserIds={selectedUserIds}
          setSelectedUserIds={setSelectedUserIds}
          startConversation={startConversation}
          onPreviewConversation={onPreviewConversation}
          resolveDirectConversationId={resolveDirectConversationId}
          onlineUserIds={onlineUserIds}
          avatarUrl={avatarUrl}
          autoOpen={isComposing}
        />
      ) : activeConversation ? (
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            {activeConversation.type === "group" && Array.isArray(activeConversation.participants) && activeConversation.participants.length ? (
              <div className="relative h-10 w-10 shrink-0">
                {activeConversation.participants.slice(0, 2).map((participant, index) => (
                  <Avatar
                    key={participant.id ?? index}
                    className={`absolute h-6 w-6 border-2 border-white ${index === 0 ? "left-0 top-0" : "bottom-0 right-0"}`}
                  >
                    <AvatarImage
                      src={participant.avatar || avatarUrl(participant.ipms_id)}
                      alt={participant.name}
                      loading="lazy"
                    />
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

                {activeConversation.participants.length > 2 && (
                  <div className="absolute -right-1 -bottom-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-slate-200 px-1 text-[9px] font-semibold text-slate-700">
                    +{activeConversation.participants.length - 2}
                  </div>
                )}
              </div>
            ) : (
              <div className="relative shrink-0">
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={avatarUrl(activeConversation.other_user_ipms_id)}
                    alt={activeConversation.name}
                    loading="lazy"
                  />
                  <AvatarFallback>
                    {(activeConversation.name || "U")
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                {activeConversation.type === "direct" && (
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${
                      onlineUserIds.has(Number(activeConversation.other_user_id))
                        ? "bg-green-500"
                        : "bg-red-500"
                    }`}
                  />
                )}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="font-semibold text-sm truncate">{activeConversation.name}</div>
              <div className="text-xs text-slate-500">
                {typingUser
                  ? `${typingUser.name} is typing...`
                  : activeConversation.type === "direct"
                  ? onlineUserIds.has(Number(activeConversation.other_user_id))
                    ? "Online"
                    : "Offline"
                  : "Conversation"}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-sm text-slate-500">Select a conversation</div>
      )}
    </div>
  )
}
