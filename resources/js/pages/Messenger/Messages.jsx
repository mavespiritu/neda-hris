import { Loader2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Reply } from "lucide-react"
import { useState } from "react"

const CLUSTER_SECONDS = 90

export default function Messages({
  me,
  orderedMessages,
  listRef,
  handleMessageScroll,
  messagesLoading,
  loadingOlder,
  avatarUrl,
  formatSentAt,
  body,
  setBody,
  send,
  onBodyChange,
  typingUser,
  replyTo,
  setReplyTo
}) {

    const getReplyLabel = (m) => {
    if (!m.reply_to) return ""

    const meId = Number(me?.id)
    const senderId = Number(m.sender_id)

    const repliedMsg = orderedMessages.find(
        (x) => Number(x.id) === Number(m.reply_to?.id)
    )

    const repliedSenderId = Number(
        m.reply_to?.sender_id ?? repliedMsg?.sender_id ?? 0
    )

    const repliedSenderName =
        m.reply_to?.sender_name || repliedMsg?.sender_name || "Someone"

    const senderName = m.sender_name || "Someone"
    const senderGender = String(m.sender_gender || "").toLowerCase()

    const isMine = senderId === meId
    const repliedToSelf = repliedSenderId === senderId
    const repliedToMe = repliedSenderId === meId

    if (isMine && repliedToSelf) return "You replied to yourself"

    if (!isMine && repliedToSelf) {
        if (senderGender === "male") return `${senderName} replied to himself`
        if (senderGender === "female") return `${senderName} replied to herself`
        return `${senderName} replied to themselves`
    }

    if (isMine) return `You replied to ${repliedSenderName}`
    if (repliedToMe) return `${senderName} replied to you`

    return `${senderName} replied to ${repliedSenderName}`
    }

  return (
    <>
      <div className="relative flex-1 min-h-0">
        <div
          ref={listRef}
          onScroll={handleMessageScroll}
          className={`h-full overflow-y-auto overflow-x-hidden px-2 transition ${
            messagesLoading ? "blur-[1px] opacity-70 pointer-events-none" : ""
          }`}
        >
          <div className="min-h-full flex flex-col justify-end">
            {loadingOlder && (
              <div className="sticky top-2 z-10 flex justify-center mb-2">
                <div className="rounded-md bg-background/90 px-3 py-2 text-xs flex items-center gap-2 shadow-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Loading more...</span>
                </div>
              </div>
            )}

            <TooltipProvider delayDuration={200}>
              {orderedMessages.map((m, idx) => {
                const mine = Number(m.sender_id) === Number(me?.id)
                const prev = orderedMessages[idx - 1]
                const next = orderedMessages[idx + 1]

                const currentTs = m?.created_at ? new Date(m.created_at).getTime() : null
                const prevTs = prev?.created_at ? new Date(prev.created_at).getTime() : null
                const nextTs = next?.created_at ? new Date(next.created_at).getTime() : null

                const sameAsPrev = !!prev && Number(prev.sender_id) === Number(m.sender_id)
                const sameAsNext = !!next && Number(next.sender_id) === Number(m.sender_id)

                const closeToPrev =
                  currentTs != null && prevTs != null
                    ? (currentTs - prevTs) / 1000 <= CLUSTER_SECONDS
                    : false
                const closeToNext =
                  currentTs != null && nextTs != null
                    ? (nextTs - currentTs) / 1000 <= CLUSTER_SECONDS
                    : false

                const groupedWithPrev = sameAsPrev && closeToPrev
                const groupedWithNext = sameAsNext && closeToNext
                const showAvatar = !mine && !groupedWithNext

                return (
                  <div
                    key={`msg-${m.id}-${m.created_at ?? ""}`}
                    className={`w-full flex ${mine ? "justify-end" : "justify-start"} ${
                    groupedWithPrev ? "mt-0.5" : "mt-2"
                    } overflow-visible`}
                    >
                    <div className={`flex items-center gap-1 min-w-0 max-w-full ${mine ? "flex-row-reverse" : ""}`}>
                        {!mine &&
                        (showAvatar ? (
                            <Avatar className="h-7 w-7 shrink-0">
                            <AvatarImage src={avatarUrl(m.sender_ipms_id)} alt={m.sender_name} loading="lazy" />
                            <AvatarFallback>
                                {(m.sender_name || "U")
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .slice(0, 2)
                                .toUpperCase()}
                            </AvatarFallback>
                            </Avatar>
                        ) : (
                            <div className="h-7 w-7 shrink-0" />
                        ))}

                        <div className="relative group/msg">
                            <Tooltip>
                                <div className={`relative inline-flex flex-col max-w-[500px] min-w-0 ${mine ? "items-end" : "items-start"}`}>
                                    {m.reply_to && (
                                        <>
                                        <div className="mb-1 flex items-center gap-1 text-xs text-slate-500">
                                            <span>
                                            {getReplyLabel(m)}
                                            </span>
                                        </div>

                                        <div
                                            className={`relative z-0 rounded-md px-2 pt-1 pb-4 text-xs ${
                                            mine
                                                ? "bg-slate-300/70 text-slate-700 self-end text-right"
                                                : "bg-slate-100 text-slate-600 self-start text-left"
                                            } w-fit max-w-full`}
                                        >
                                            <div className="truncate">{m.reply_to.body}</div>
                                        </div>
                                        </>
                                    )}

                                    <div className={`group/main relative ${m.reply_to ? (mine ? "-mt-2.5" : "-mt-2.5 ml-2") : ""}`}
                                    >
                                    <TooltipTrigger asChild>
                                    <div
                                        className={`relative w-fit max-w-[500px] rounded-xl p-2 text-sm whitespace-pre-wrap break-words ${
                                        mine ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-900"
                                        }`}
                                    >
                                        {m.body}
                                    </div>
                                    </TooltipTrigger>

                                    <button
                                        type="button"
                                        onClick={() => setReplyTo(m)}
                                        className={`absolute top-1/2 -translate-y-1/2 z-20 opacity-0 group-hover/main:opacity-100 transition-opacity p-1 rounded ${
                                        mine ? "-left-7" : "-right-7"
                                        }`}
                                        title="Reply"
                                    >
                                        <Reply className="h-4 w-4 text-slate-500" strokeWidth={3} absoluteStrokeWidth />
                                    </button>
                                    </div>
                                </div>

                                <TooltipContent side={mine ? "left" : "right"} className="text-xs">
                                {formatSentAt(m.created_at)}
                                </TooltipContent>
                            </Tooltip>
                        </div>
                    </div>
                </div>

                )
              })}
            </TooltipProvider>
          </div>
        </div>

        {messagesLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center">
            <div className="rounded-md bg-background/90 px-4 py-3 text-xs flex items-center gap-2 shadow-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading messages...</span>
            </div>
          </div>
        )}
      </div>

      <div className="min-h-6 px-1 pt-1">
        {typingUser ? (
            <div className="flex items-center gap-2 text-xs text-slate-500">
            <Avatar className="h-7 w-7 shrink-0">
                <AvatarImage
                src={
                    typingUser.ipms_id
                    ? `/employees/image/${typingUser.ipms_id}`
                    : "https://www.gravatar.com/avatar/?d=mp&s=200"
                }
                alt={typingUser.name}
                loading="lazy"
                />
                <AvatarFallback>
                {(typingUser.name || "U")
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </AvatarFallback>
            </Avatar>

            <div className="flex items-center gap-1 rounded-full bg-slate-200 px-2 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-500 animate-bounce [animation-delay:-0.3s]" />
                <span className="h-1.5 w-1.5 rounded-full bg-slate-500 animate-bounce [animation-delay:-0.2s]" />
                <span className="h-1.5 w-1.5 rounded-full bg-slate-500 animate-bounce" />
            </div>
            </div>
        ) : null}
      </div>

      {replyTo && (
        <div className="mb-2 rounded border-l-4 border-blue-500 bg-slate-50 px-3 py-2 text-xs">
            <div className="flex items-center justify-between gap-2">
            <span className="font-medium text-slate-700">Replying to {replyTo.sender_name}</span>
            <button type="button" onClick={() => setReplyTo(null)} className="text-slate-500 hover:text-slate-700">
                Cancel
            </button>
            </div>
            <div className="truncate text-slate-500">{replyTo.body}</div>
        </div>
        )}

      <form onSubmit={send} className="pt-2 flex gap-2 shrink-0">
        <input
          className="flex-1 border rounded px-3 py-2 text-sm"
          value={body}
          onChange={(e) => {
            setBody(e.target.value)
            onBodyChange?.(e.target.value)
          }}
          placeholder="Type a message..."
        />
        <button className="px-4 py-2 rounded bg-blue-600 text-white text-sm shrink-0">Send</button>
      </form>
    </>
  )
}
