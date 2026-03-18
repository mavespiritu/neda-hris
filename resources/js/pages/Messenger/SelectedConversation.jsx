import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function SelectedConversation({
  activeConversation,
  onlineUserIds,
  avatarUrl,
  typingUser,
}) {
  return (
    <div className="shrink-0 border-b pb-2 mb-2">
      {activeConversation ? (
        <div className="flex items-center gap-3">
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

          <div className="min-w-0">
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
      ) : (
        <div className="text-sm text-slate-500">Select a conversation</div>
      )}
    </div>
  )
}
