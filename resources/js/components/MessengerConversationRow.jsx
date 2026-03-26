import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Link } from "@inertiajs/react"
import { resolveConversationAvatar } from "@/lib/messengerConversationAvatar"

const defaultAvatarUrl = (ipmsId) =>
  ipmsId ? `/employees/image/${ipmsId}` : "https://www.gravatar.com/avatar/?d=mp&s=200"

export const MessengerConversationAvatar = ({
  conversation,
  safeUsers = [],
  meId = null,
  avatarUrl = defaultAvatarUrl,
  onlineUserIds = new Set(),
  directStatusSize = "h-3 w-3",
}) => {
  const participants = conversation?.participants || []
  const directOtherUserId = Number(conversation?.other_user_id ?? 0)
  const canShowDirectStatus = Number.isFinite(directOtherUserId) && directOtherUserId > 0
  const directAvatar = resolveConversationAvatar(conversation, safeUsers, meId, avatarUrl)

  if (conversation?.type === "group" && participants.length) {
    const preview = participants.slice(0, 2)

    return (
      <div className="relative h-9 w-9 shrink-0">
        {preview.map((participant, index) => (
          <Avatar
            key={participant.id ?? index}
            className={`absolute h-6 w-6 border-2 border-background ${index === 0 ? "left-0 top-0" : "bottom-0 right-0"}`}
          >
            <AvatarImage
              src={participant.avatar || avatarUrl(participant.ipms_id)}
              alt={participant.name}
              loading="lazy"
            />
            <AvatarFallback className="text-[10px]">
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
        <AvatarImage src={directAvatar} alt={conversation?.name} loading="lazy" />
        <AvatarFallback className="text-[10px]">
          {(conversation?.name || "U")
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)
            .toUpperCase()}
        </AvatarFallback>
      </Avatar>

      {conversation?.type === "direct" && canShowDirectStatus && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 ${directStatusSize} rounded-full border-2 border-white ${
            onlineUserIds.has(directOtherUserId) ? "bg-green-500" : "bg-red-500"
          }`}
        />
      )}
    </div>
  )
}

export const MessengerConversationRow = ({
  conversation,
  safeUsers = [],
  meId = null,
  avatarUrl = defaultAvatarUrl,
  onlineUserIds = new Set(),
  previewText = "No message yet",
  timeLabel = "",
  unreadCount = 0,
  active = false,
  onClick,
  href = null,
  trailing,
  className = "",
  bodyClassName = "",
  showUnreadBadge = false,
}) => {
  const interactiveClassName = `flex min-w-0 flex-1 items-center gap-2 text-left ${bodyClassName}`

  const content = (
    <>
      <MessengerConversationAvatar
        conversation={conversation}
        safeUsers={safeUsers}
        meId={meId}
        avatarUrl={avatarUrl}
        onlineUserIds={onlineUserIds}
      />

      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{conversation?.name}</div>
        <div className="flex items-center gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-2 text-xs text-slate-500">
            <span className="min-w-0 flex-1 truncate">{previewText}</span>
          </div>
          <div className="shrink-0 text-[11px] text-slate-400">{timeLabel}</div>
        </div>
      </div>

      {showUnreadBadge && Number(unreadCount || 0) > 0 ? (
        <Badge variant="secondary" className="h-5 min-w-5 justify-center rounded-full px-1 text-[10px]">
          {unreadCount > 9 ? "9+" : unreadCount}
        </Badge>
      ) : null}
    </>
  )

  const interactiveProps = {
    className: interactiveClassName,
    onClick,
  }

  return (
    <div
      className={`group relative flex items-center rounded p-2 ${active ? "bg-slate-200" : "hover:bg-slate-100"} ${className}`}
    >
      {href ? (
        <Link href={href} {...interactiveProps}>
          {content}
        </Link>
      ) : (
        <button type="button" className={interactiveClassName} onClick={onClick}>
          {content}
        </button>
      )}

      {trailing ? <div className="shrink-0">{trailing}</div> : null}
    </div>
  )
}
