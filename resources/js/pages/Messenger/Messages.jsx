import axios from "axios"
import { FileText, Loader2, MoreVertical, Paperclip, Reply, SendHorizontal, Smile, ThumbsUp, X, Forward } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import AttachmentPreviewDialog from "@/components/AttachmentPreviewDialog"
import { useToast } from "@/hooks/use-toast"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"

const CLUSTER_SECONDS = 90
const STICKERS = [
  { key: "heart", label: "Heart", emoji: "💖" },
  { key: "like", label: "Like", emoji: "👍" },
  { key: "laugh", label: "Laugh", emoji: "😂" },
  { key: "celebrate", label: "Celebrate", emoji: "🎉" },
  { key: "hug", label: "Hug", emoji: "🤗" },
  { key: "cool", label: "Cool", emoji: "😎" },
]

const stickerToken = (key) => `__sticker__:${key}`
const stickerKeyFromBody = (value) =>
  typeof value === "string" && value.startsWith("__sticker__:") ? value.split(":")[1] || "" : ""
const stickerEmojiByKey = (key) => STICKERS.find((sticker) => sticker.key === key)?.emoji || "✨"
const isStickerBody = (value) => Boolean(stickerKeyFromBody(value))
const isImageAttachmentType = (value) => String(value || "").toLowerCase().startsWith("image/")
const isPdfAttachmentType = (value) => String(value || "").toLowerCase() === "application/pdf"
const isPreviewableAttachmentType = (value) => isImageAttachmentType(value) || isPdfAttachmentType(value)
const ACCEPTED_ATTACHMENT_TYPES = ".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024
const urlPattern = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi
const getAttachmentUrl = (message = {}) => {
  const filePath = message?.attachment_url || message?.attachment_path || ""

  if (!filePath) return ""
  if (/^(https?:|blob:|data:)/i.test(filePath)) return filePath
  if (filePath.startsWith("/storage/")) return filePath

  return `/storage/${filePath.replace(/^\/+/, "")}`
}
const formatBytes = (size) => {
  const bytes = Number(size || 0)
  if (!bytes) return ""
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const normalizeUrl = (value) => {
  if (!value) return ""
  return /^https?:\/\//i.test(value) ? value : `https://${value}`
}

const renderLinkifiedText = (text) => {
  if (typeof text !== "string" || !text.trim()) return text

  const parts = []
  let lastIndex = 0
  let match

  urlPattern.lastIndex = 0
  while ((match = urlPattern.exec(text)) !== null) {
    const [url] = match
    const start = match.index

    if (start > lastIndex) {
      parts.push(text.slice(lastIndex, start))
    }

    parts.push(
      <a
        key={`${start}-${url}`}
        href={normalizeUrl(url)}
        target="_blank"
        rel="noreferrer"
        className="break-words underline underline-offset-2 hover:opacity-90"
      >
        {url}
      </a>
    )

    lastIndex = start + url.length
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  return parts.length ? parts : text
}

const MessageThreadSkeleton = () => (
  <div className="space-y-3 px-2 py-2">
    {Array.from({ length: 7 }).map((_, index) => {
      const mine = index % 2 === 1

      return (
        <div key={`message-skeleton-${index}`} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
          <div className={`flex items-end gap-2 ${mine ? "flex-row-reverse" : ""}`}>
            {!mine && <Skeleton className="h-7 w-7 shrink-0 rounded-full" />}
            <div className={`space-y-1 ${mine ? "items-end" : "items-start"} flex flex-col`}>
              <Skeleton className={`h-3 w-16 ${mine ? "ml-auto" : ""}`} />
              <Skeleton className={`h-10 rounded-xl ${mine ? "ml-auto w-[220px]" : "w-[280px]"}`} />
            </div>
          </div>
        </div>
      )
    })}
  </div>
)

const ForwardConversationAvatar = ({ conversation, avatarUrl, meId = null, safeUsers = [] }) => {
  const participants = conversation?.participants || []
  const recentSenders = Array.isArray(conversation?.recent_senders) ? conversation.recent_senders : []
  const selfUser = meId != null
    ? safeUsers.find((user) => Number(user?.id) === Number(meId)) || null
    : null
  const smallGroupAvatars = participants.length === 1 && selfUser
    ? [{
        id: Number(selfUser.id),
        ipms_id: selfUser.ipms_id ?? null,
        name: selfUser.name || "You",
        avatar: selfUser.avatar || (selfUser.ipms_id ? avatarUrl(selfUser.ipms_id) : null),
      }, ...participants]
    : participants
  const groupAvatars = participants.length <= 2
    ? smallGroupAvatars
    : (recentSenders.length ? recentSenders : participants)

  if (conversation?.type === "group" && groupAvatars.length) {
    const preview = groupAvatars.slice(0, 2)

    return (
      <div className="relative h-8 w-8 shrink-0">
        {preview.map((participant, index) => (
          <Avatar
            key={participant.id ?? index}
            className={`absolute h-5 w-5 border border-background ${index === 0 ? "left-0 top-0" : "bottom-0 right-0"}`}
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

      </div>
    )
  }

  return (
    <Avatar className="h-8 w-8 shrink-0">
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
  )
}

export default function Messages({
  me,
  orderedMessages,
  activeConversationId,
  activeConversation,
  conversations = [],
  safeUsers = [],
  conversationReadReceipts = [],
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
  setReplyTo,
  sendQuickLike,
  sendSticker,
  onForwardMessage,
  onOpenConversation,
}) {
  const { toast } = useToast()
  const lastAutoScrollRef = useRef(null)
  const inputRef = useRef(null)
  const fileInputRef = useRef(null)
  const [stickerOpen, setStickerOpen] = useState(false)
  const [attachmentFile, setAttachmentFile] = useState(null)
  const [attachmentPreviewUrl, setAttachmentPreviewUrl] = useState("")
  const [imagePreview, setImagePreview] = useState(null)
  const [forwardOpen, setForwardOpen] = useState(false)
  const [forwardMessage, setForwardMessage] = useState(null)
  const [forwardQuery, setForwardQuery] = useState("")
  const [forwardTargetId, setForwardTargetId] = useState(null)
  const [forwardTargetUserId, setForwardTargetUserId] = useState(null)
  const [forwardSubmitting, setForwardSubmitting] = useState(false)
  const showThreadSkeleton = messagesLoading && orderedMessages.length === 0

  const participantNameById = useMemo(() => {
    const map = new Map()

    for (const user of safeUsers || []) {
      if (user?.id == null) continue
      map.set(Number(user.id), user.name || `User ${user.id}`)
    }

    for (const participant of activeConversation?.participants || []) {
      if (participant?.id == null) continue
      map.set(Number(participant.id), participant.name || `User ${participant.id}`)
    }

    return map
  }, [activeConversation?.participants, safeUsers])

  const getSeenRecipientsForMessage = (message) => {
    if (!activeConversation || !message || Number(message?.sender_id) !== Number(me?.id)) return []

    const embeddedRecipients = Array.isArray(message?.seen_by) ? message.seen_by : []
    if (embeddedRecipients.length) {
      return embeddedRecipients
        .map((recipient) => ({
          user_id: Number(recipient?.user_id ?? recipient?.id ?? 0),
          name: recipient?.reader_name || recipient?.name || "Someone",
          ipms_id: recipient?.reader_ipms_id || recipient?.ipms_id || null,
          last_read_at: recipient?.last_read_at ?? null,
        }))
        .filter((recipient) => Number.isFinite(recipient.user_id) && recipient.user_id > 0)
    }

    const messageId = Number(message?.id || 0)
    if (!messageId) return []

    return (conversationReadReceipts || [])
      .filter((receipt) => Number(receipt?.user_id) !== Number(me?.id))
      .filter((receipt) => Number(receipt?.last_read_message_id || 0) >= messageId)
      .map((receipt) => {
        const participant = (activeConversation?.participants || []).find(
          (user) => Number(user?.id) === Number(receipt?.user_id)
        )

        return {
          user_id: Number(receipt?.user_id),
          name: receipt?.reader_name || participant?.name || participantNameById.get(Number(receipt?.user_id)) || "Someone",
          ipms_id: receipt?.reader_ipms_id || participant?.ipms_id || null,
        }
      })
      .filter((receipt, index, arr) =>
        index === arr.findIndex((x) => Number(x.user_id) === Number(receipt.user_id))
      )
  }

  const latestSeenOutgoingMessageId = (() => {
    const seenMessage = [...orderedMessages]
      .reverse()
      .find((message) =>
        Number(message?.sender_id) === Number(me?.id) &&
        getSeenRecipientsForMessage(message).length > 0 &&
        !String(message?.id || "").startsWith("temp-")
      ) || null

    return seenMessage?.id ?? null
  })()

  const formatSeenTime = (value) => {
    if (!value) return ""

    try {
      return new Intl.DateTimeFormat(undefined, {
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date(value))
    } catch {
      return ""
    }
  }

  const focusComposer = () => {
    requestAnimationFrame(() => {
      inputRef.current?.focus()
    })
  }

  useEffect(() => {
    if (!attachmentFile) {
      setAttachmentPreviewUrl("")
      return
    }

    const previewUrl = URL.createObjectURL(attachmentFile)
    setAttachmentPreviewUrl(previewUrl)

    return () => {
      URL.revokeObjectURL(previewUrl)
    }
  }, [attachmentFile])

  useLayoutEffect(() => {
    if (!activeConversationId || messagesLoading || loadingOlder) return

    const key = `${activeConversationId}:${orderedMessages.length}`
    if (lastAutoScrollRef.current === key) return

    const el = listRef.current
    if (el) {
      el.scrollTop = el.scrollHeight
    }

    lastAutoScrollRef.current = key
  }, [activeConversationId, orderedMessages.length, messagesLoading, loadingOlder, listRef])

  useEffect(() => {
    if (!activeConversationId) return
    focusComposer()
  }, [activeConversationId])

  useEffect(() => {
    if (!replyTo) return
    focusComposer()
  }, [replyTo])

  useEffect(() => {
    clearAttachment()
  }, [activeConversationId])

  const clearAttachment = () => {
    setAttachmentFile(null)
  }

  const openImagePreview = (message) => {
    if (!message || !isImageAttachmentType(message.attachment_type)) return

    setImagePreview({
      path: getAttachmentUrl(message),
      type: message.attachment_type,
      filename: message.attachment_name || "Attachment",
      name: message.attachment_name || "Attachment",
    })
  }

  const openAttachmentLink = (message) => {
    const url = getAttachmentUrl(message)
    if (!url) return

    window.open(url, "_blank", "noopener,noreferrer")
  }

  const openForwardDialog = (message) => {
    if (!message?.id || String(message.id).startsWith("temp-")) return

    setForwardMessage(message)
    setForwardQuery("")
    setForwardTargetId(null)
    setForwardTargetUserId(null)
    setForwardOpen(true)
  }

  const closeForwardDialog = () => {
    if (forwardSubmitting) return

    setForwardOpen(false)
    setForwardMessage(null)
    setForwardQuery("")
    setForwardTargetId(null)
    setForwardTargetUserId(null)
  }

  const availableForwardConversations = useMemo(() => {
    return (conversations || [])
      .filter((conversation) => Number(conversation?.id) !== Number(activeConversationId))
      .filter(Boolean)
  }, [activeConversationId, conversations])

  const filteredForwardConversations = useMemo(() => {
    const query = forwardQuery.trim().toLowerCase()
    if (!query) return availableForwardConversations

    return availableForwardConversations.filter((conversation) => {
      const haystack = [
        conversation?.name,
        conversation?.title,
        conversation?.last_message,
        conversation?.last_message_sender_name,
        ...(conversation?.participants || []).flatMap((participant) => [
          participant?.name,
          participant?.ipms_id,
        ]),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()

      return haystack.includes(query)
    })
  }, [availableForwardConversations, forwardQuery])

  const filteredForwardUsers = useMemo(() => {
    const query = forwardQuery.trim().toLowerCase()
    const people = (safeUsers || [])
      .filter((user) => Number(user?.id) !== Number(me?.id))
      .map((user) => ({
        ...user,
        _conversationId: conversations.find((conversation) =>
          conversation?.type === "direct" && Number(conversation?.other_user_id) === Number(user.id)
        )?.id ?? null,
      }))

    if (!query) return people

    return people.filter((user) => {
      const haystack = [
        user?.name,
        user?.email,
        user?.ipms_id,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()

      return haystack.includes(query)
    })
  }, [conversations, me?.id, safeUsers, forwardQuery])

  const handleForwardSubmit = async () => {
    if (!forwardMessage || (!forwardTargetId && !forwardTargetUserId)) return

    setForwardSubmitting(true)
    try {
      let targetConversationId = forwardTargetId

      if (!targetConversationId && forwardTargetUserId) {
        const existing = (safeUsers || []).find((user) => Number(user.id) === Number(forwardTargetUserId))

        if (existing?._conversationId) {
          targetConversationId = existing._conversationId
        } else {
          const res = await axios.post(route("messenger.start-direct"), {
            user_id: forwardTargetUserId,
          })

          targetConversationId = res.data?.id ?? null
        }
      }

      if (!targetConversationId) {
        toast({
          title: "Unable to forward message",
          description: "Please choose a valid recipient.",
          variant: "destructive",
        })
        return
      }

      const ok = await onForwardMessage?.(forwardMessage, targetConversationId)

      if (!ok) {
        toast({
          title: "Unable to forward message",
          description: "Please try again in a moment.",
          variant: "destructive",
        })
        return
      }

      closeForwardDialog()
      onOpenConversation?.(targetConversationId)
    } finally {
      setForwardSubmitting(false)
    }
  }

  const openAttachmentPicker = () => {
    setStickerOpen(false)
    fileInputRef.current?.click()
  }

  const handleAttachmentChange = (event) => {
    const file = event.target.files?.[0] || null
    event.target.value = ""

    if (!file) return

    if (file.size > MAX_ATTACHMENT_BYTES) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 5 MB.",
        variant: "destructive",
      })
      return
    }

    setStickerOpen(false)
    setAttachmentFile(file)
  }

  const handleComposerPaste = (event) => {
    const items = Array.from(event.clipboardData?.items || [])
    const imageItem = items.find((item) => item.kind === "file" && isImageAttachmentType(item.type))

    if (!imageItem) return

      const file = imageItem.getAsFile()
      if (!file) return

      if (file.size > MAX_ATTACHMENT_BYTES) {
        toast({
          title: "File too large",
          description: "Please upload a file smaller than 5 MB.",
          variant: "destructive",
        })
        return
      }

      event.preventDefault()
      setStickerOpen(false)
      setAttachmentFile(file)
  }

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
    const repliedBody = m.reply_to?.body || repliedMsg?.body || ""
    const repliedIsSticker = isStickerBody(repliedBody)
    const repliedAttachmentType = m.reply_to?.attachment_type || repliedMsg?.attachment_type || ""
    const repliedIsImage = isImageAttachmentType(repliedAttachmentType)
    const repliedIsFile = Boolean(m.reply_to?.attachment_path || repliedMsg?.attachment_path) && !repliedIsImage && !isPdfAttachmentType(repliedAttachmentType)
    const repliedIsPdf = isPdfAttachmentType(repliedAttachmentType)

    const senderName = m.sender_name || "Someone"
    const senderGender = String(m.sender_gender || "").toLowerCase()

    const isMine = senderId === meId
    const repliedToSelf = repliedSenderId === senderId
    const repliedToMe = repliedSenderId === meId

    if (repliedIsImage) {
        if (isMine) return "You replied to a photo"
        if (repliedToMe) return `${senderName} replied to your photo`
        if (repliedToSelf) return `${senderName} replied to their photo`
        return `${senderName} replied to a photo`
    }

    if (repliedIsPdf || repliedIsFile) {
        if (isMine) return "You replied to an attachment"
        if (repliedToMe) return `${senderName} replied to your attachment`
        if (repliedToSelf) return `${senderName} replied to their attachment`
        return `${senderName} replied to an attachment`
    }

    if (repliedIsSticker) {
        if (isMine) return "You replied to a sticker"
        if (repliedToMe) return `${senderName} replied to your sticker`
        if (repliedToSelf) return `${senderName} replied to their sticker`
        return `${senderName} replied to a sticker`
    }

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
          className="h-full overflow-y-auto overflow-x-hidden px-2 transition"
        >
          <div className="min-h-full flex flex-col justify-end">
            {showThreadSkeleton ? (
              <MessageThreadSkeleton />
            ) : (
              <TooltipProvider delayDuration={200}>
                {loadingOlder && (
                  <div className="sticky top-2 z-10 flex justify-center mb-2">
                    <div className="rounded-md bg-background/90 px-3 py-2 text-xs flex items-center gap-2 shadow-sm">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Loading more...</span>
                    </div>
                  </div>
                )}

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
                const stickerKey = stickerKeyFromBody(m.body)
                const hasSticker = Boolean(stickerKey)
                const replyStickerKey = stickerKeyFromBody(m.reply_to?.body)
                const replyHasSticker = Boolean(replyStickerKey)
                const messageAttachmentUrl = getAttachmentUrl(m)
                const messageHasImage = isImageAttachmentType(m.attachment_type) && Boolean(messageAttachmentUrl)
                const messageHasPdf = isPdfAttachmentType(m.attachment_type) && Boolean(messageAttachmentUrl)
                const messageHasFile = Boolean(m.attachment_path) && !messageHasImage && !messageHasPdf
                const replyAttachmentUrl = getAttachmentUrl(m.reply_to)
                const replyHasImage = isImageAttachmentType(m.reply_to?.attachment_type) && Boolean(replyAttachmentUrl)
                const replyHasPdf = isPdfAttachmentType(m.reply_to?.attachment_type) && Boolean(replyAttachmentUrl)
                const replyHasFile = Boolean(m.reply_to?.attachment_path) && !replyHasImage && !replyHasPdf

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
                                            {replyHasSticker ? (
                                              <div className="flex items-center justify-start">
                                                <span className="text-2xl leading-none">
                                                  {stickerEmojiByKey(replyStickerKey)}
                                                </span>
                                              </div>
                                            ) : replyHasImage ? (
                                              <img
                                                src={replyAttachmentUrl}
                                                alt={m.reply_to?.attachment_name || "Reply attachment"}
                                                className="h-12 w-12 rounded-md object-cover"
                                                loading="lazy"
                                              />
                                              ) : replyHasPdf ? (
                                                <a
                                                  href={replyAttachmentUrl}
                                                  target="_blank"
                                                  rel="noreferrer"
                                                  className="inline-flex max-w-full items-center gap-2 rounded-xl border border-slate-200 bg-slate-100 px-2 py-1.5 text-left text-slate-600 transition hover:bg-slate-200 focus:outline-none focus-visible:ring-0"
                                                >
                                                  <FileText className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                                                  <div className="min-w-0">
                                                    <div className="truncate text-[10px] font-medium leading-tight text-slate-700">
                                                      {m.reply_to?.attachment_name || "PDF"}
                                                    </div>
                                                    {m.reply_to?.attachment_size ? (
                                                      <div className="text-[9px] leading-tight text-slate-500">
                                                        {formatBytes(m.reply_to.attachment_size)}
                                                      </div>
                                                    ) : null}
                                                  </div>
                                                </a>
                                              ) : replyHasFile ? (
                                                <a
                                                  href={replyAttachmentUrl}
                                                  target="_blank"
                                                  rel="noreferrer"
                                                  className="inline-flex max-w-full items-center gap-2 rounded-xl border border-slate-200 bg-slate-100 px-2 py-1.5 text-left text-slate-600 transition hover:bg-slate-200 focus:outline-none focus-visible:ring-0"
                                                >
                                                  <FileText className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                                                  <div className="min-w-0">
                                                    <div className="truncate text-[10px] font-medium leading-tight text-slate-700">
                                                      {m.reply_to?.attachment_name || "Attachment"}
                                                    </div>
                                                    {m.reply_to?.attachment_size ? (
                                                      <div className="text-[9px] leading-tight text-slate-500">
                                                        {formatBytes(m.reply_to.attachment_size)}
                                                      </div>
                                                    ) : null}
                                                  </div>
                                                </a>
                                            ) : (
                                              <div className="truncate">{renderLinkifiedText(m.reply_to.body)}</div>
                                            )}
                                        </div>
                                        </>
                                    )}

                                    <div className={`group/main relative ${m.reply_to ? (mine ? "-mt-2.5" : "-mt-2.5 ml-2") : ""}`}>
                                      <TooltipTrigger asChild>
                                          <div
                                            className={`relative w-fit max-w-[500px] rounded-xl p-2 text-sm whitespace-pre-wrap break-words ${
                                              hasSticker
                                                ? "bg-transparent p-0"
                                              : messageHasImage || messageHasPdf || messageHasFile
                                                ? "bg-transparent p-0"
                                                : mine
                                                ? "bg-blue-600 text-white"
                                                : "bg-slate-200 text-slate-900"
                                            }`}
                                        >
                                          {hasSticker ? (
                                            <div className="rounded-2xl bg-transparent px-1 py-1 shadow-none ring-0">
                                              <div className="flex items-center justify-center">
                                                <span className="text-5xl leading-none">
                                                  {stickerEmojiByKey(stickerKey)}
                                                </span>
                                              </div>
                                            </div>
                                          ) : messageHasImage ? (
                                            <button
                                              type="button"
                                              className="overflow-hidden rounded-2xl border-0 bg-transparent p-0 text-left"
                                              onClick={() => openImagePreview(m)}
                                            >
                                              <img
                                                src={messageAttachmentUrl}
                                                alt={m.attachment_name || "Attachment"}
                                                className="max-h-[140px] max-w-[140px] cursor-zoom-in object-cover"
                                                loading="lazy"
                                              />
                                              {m.body ? (
                                                <div className={`max-w-[140px] px-3 py-2 text-sm ${
                                                  mine ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-900"
                                                }`}>
                                                  {renderLinkifiedText(m.body)}
                                                </div>
                                              ) : null}
                                            </button>
                                            ) : messageHasPdf ? (
                                              <button
                                                type="button"
                                                className="inline-flex max-w-full items-center gap-2 rounded-xl border border-slate-200 bg-slate-100 px-2 py-1.5 text-left text-slate-600 transition hover:bg-slate-200 focus:outline-none focus-visible:ring-0"
                                                onClick={() => openAttachmentLink(m)}
                                              >
                                                <FileText className="h-4 w-4 shrink-0 text-slate-500" />
                                                <div className="min-w-0">
                                                  <div className="truncate text-[10px] font-medium leading-tight text-slate-700">
                                                    {m.attachment_name || "PDF document"}
                                                  </div>
                                                  {m.attachment_size ? (
                                                    <div className="text-[9px] leading-tight text-slate-500">
                                                      {formatBytes(m.attachment_size)}
                                                    </div>
                                                  ) : null}
                                                </div>
                                              </button>
                                            ) : messageHasFile ? (
                                              <button
                                                type="button"
                                                className="inline-flex max-w-full items-center gap-2 rounded-xl border border-slate-200 bg-slate-100 px-2 py-1.5 text-left text-slate-600 transition hover:bg-slate-200 focus:outline-none focus-visible:ring-0"
                                                onClick={() => openAttachmentLink(m)}
                                              >
                                                <FileText className="h-4 w-4 shrink-0 text-slate-500" />
                                                <div className="min-w-0">
                                                  <div className="truncate text-[10px] font-medium leading-tight text-slate-700">
                                                    {m.attachment_name || "Attachment"}
                                                  </div>
                                                  {m.attachment_size ? (
                                                    <div className="text-[9px] leading-tight text-slate-500">
                                                      {formatBytes(m.attachment_size)}
                                                    </div>
                                                  ) : null}
                                                </div>
                                              </button>
                                          ) : (
                                            renderLinkifiedText(m.body)
                                          )}
                                        </div>
                                      </TooltipTrigger>

                                      <button
                                        type="button"
                                        onClick={() => setReplyTo(m)}
                                        className={`absolute top-1/2 -translate-y-1/2 z-20 opacity-0 group-hover/main:opacity-100 transition-opacity rounded p-1 ${
                                          mine ? "-left-8" : "-right-8"
                                        }`}
                                        title="Reply"
                                        aria-label="Reply"
                                      >
                                        <Reply className="h-4 w-4 text-slate-500" strokeWidth={3} absoluteStrokeWidth />
                                      </button>

                                      <Popover>
                                        <PopoverTrigger asChild>
                                          <button
                                            type="button"
                                            className={`absolute top-1/2 -translate-y-1/2 z-20 opacity-0 group-hover/main:opacity-100 transition-opacity rounded p-1 ${
                                              mine ? "-left-16" : "-right-16"
                                            }`}
                                            title="More actions"
                                            aria-label="More actions"
                                          >
                                            <MoreVertical className="h-4 w-4 text-slate-500" />
                                          </button>
                                        </PopoverTrigger>
                                        <PopoverContent
                                          align={mine ? "start" : "end"}
                                          sideOffset={8}
                                          className="w-36 p-1"
                                        >
                                          <button
                                            type="button"
                                            className="flex w-full items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
                                            onClick={() => openForwardDialog(m)}
                                          >
                                            <Forward className="mr-2 h-4 w-4" />
                                            Forward
                                          </button>
                                        </PopoverContent>
                                      </Popover>
                                      </div>
                                      {mine && latestSeenOutgoingMessageId && Number(latestSeenOutgoingMessageId) === Number(m.id) && getSeenRecipientsForMessage(m).length ? (
                                        <div className="mt-1.5 flex w-full justify-end pr-1">
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <div className="flex items-center gap-1.5 rounded-full bg-white/70 px-1.5 py-0.5 shadow-sm backdrop-blur">
                                                <div className="flex items-center">
                                                  {getSeenRecipientsForMessage(m).slice(0, 4).map((recipient, index) => (
                                                    <Avatar
                                                      key={`${recipient.user_id}-${index}`}
                                                      className={`h-5 w-5 border border-background ${index > 0 ? "-ml-1" : ""}`}
                                                      title={recipient.name}
                                                    >
                                                      <AvatarImage
                                                        src={
                                                          recipient.ipms_id
                                                            ? `/employees/image/${recipient.ipms_id}`
                                                            : "https://www.gravatar.com/avatar/?d=mp&s=200"
                                                        }
                                                        alt={recipient.name}
                                                        loading="lazy"
                                                      />
                                                      <AvatarFallback className="text-[7px]">
                                                        {(recipient.name || "U")
                                                          .split(" ")
                                                          .map((n) => n[0])
                                                          .join("")
                                                          .slice(0, 2)
                                                          .toUpperCase()}
                                                      </AvatarFallback>
                                                    </Avatar>
                                                ))}
                                                  {getSeenRecipientsForMessage(m).length > 4 ? (
                                                    <div className="-ml-1 flex h-5 min-w-5 items-center justify-center rounded-full border border-background bg-slate-200 px-1 text-[8px] font-semibold text-slate-600">
                                                      +{getSeenRecipientsForMessage(m).length - 4}
                                                    </div>
                                                  ) : null}
                                                </div>
                                                <span className="text-[10px] font-medium text-slate-600">Seen</span>
                                              </div>
                                            </TooltipTrigger>
                                            <TooltipContent side={mine ? "left" : "right"} className="text-xs">
                                              {(() => {
                                                const recipients = getSeenRecipientsForMessage(m)
                                                const first = recipients[0]
                                                const time = formatSeenTime(
                                                  conversationReadReceipts.find((receipt) => Number(receipt?.user_id) === Number(first?.user_id))?.last_read_at
                                                )

                                                if (!first) return "Seen"
                                                if (recipients.length === 1) {
                                                  return time ? `Seen by ${first.name} at ${time}` : `Seen by ${first.name}`
                                                }

                                                if (time) {
                                                  return `Seen by ${first.name} and ${recipients.length - 1} others at ${time}`
                                                }

                                                return `Seen by ${first.name} and ${recipients.length - 1} others`
                                              })()}
                                            </TooltipContent>
                                          </Tooltip>
                                        </div>
                                      ) : null}
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
            )}
          </div>
        </div>

        {messagesLoading && !showThreadSkeleton && (
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
            {isStickerBody(replyTo.body) ? (
              <div className="flex items-center text-slate-500">
                <span className="text-2xl leading-none">{stickerEmojiByKey(stickerKeyFromBody(replyTo.body))}</span>
              </div>
            ) : isImageAttachmentType(replyTo.attachment_type) ? (
              <div className="mt-1 flex items-center gap-2 text-slate-500">
                <img
                  src={getAttachmentUrl(replyTo)}
                  alt={replyTo.attachment_name || "Reply attachment"}
                  className="h-10 w-10 rounded-md object-cover"
                  loading="lazy"
                />
                <span className="truncate">{replyTo.body || "Photo"}</span>
              </div>
            ) : (
              <div className="truncate text-slate-500">{replyTo.body}</div>
            )}
        </div>
        )}

      {attachmentFile && (
        <div className="mb-2 flex items-center justify-between gap-3 rounded-2xl border bg-muted/30 px-3 py-2">
          <div className="flex min-w-0 items-center gap-3">
            {isImageAttachmentType(attachmentFile.type) ? (
              <img
                src={attachmentPreviewUrl}
                alt={attachmentFile.name}
                className="h-12 w-12 shrink-0 rounded-xl object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-background text-slate-500">
                <FileText className="h-6 w-6" />
              </div>
            )}
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">{attachmentFile.name}</div>
              <div className="text-[11px] text-muted-foreground">{formatBytes(attachmentFile.size)}</div>
            </div>
          </div>
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={clearAttachment}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <form
        onSubmit={async (event) => {
          event.preventDefault()
          const ok = await send({
            body,
            attachment: attachmentFile,
            replyTo,
          })

          if (ok) {
            clearAttachment()
          }
        }}
        className="pt-2 flex gap-2 shrink-0"
      >
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_ATTACHMENT_TYPES}
            className="hidden"
            onChange={handleAttachmentChange}
          />

        <div className="relative flex-1 min-w-0">
          <input
            ref={inputRef}
            className="h-10 w-full rounded-2xl border px-3 py-2 pr-24 text-sm"
            value={body}
            onChange={(e) => {
              setBody(e.target.value)
              onBodyChange?.(e.target.value)
            }}
            onPaste={handleComposerPaste}
            placeholder="Type a message..."
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-8 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full shrink-0"
            aria-label="Attach image"
            title="Attach image"
            onClick={openAttachmentPicker}
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <Popover open={stickerOpen} onOpenChange={setStickerOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full shrink-0"
                aria-label="Open stickers"
                title="Open stickers"
              >
                <Smile className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" sideOffset={8} className="w-64 p-3">
              <div className="mb-2 text-sm font-semibold">Stickers</div>
              <div className="grid grid-cols-3 gap-2">
                {STICKERS.map((sticker) => (
                  <button
                    key={sticker.key}
                    type="button"
                    className="flex flex-col items-center justify-center rounded-xl border bg-background p-3 text-center transition hover:bg-muted"
                    onClick={() => {
                      setStickerOpen(false)
                      sendSticker?.(stickerToken(sticker.key))
                    }}
                  >
                    <span className="text-3xl leading-none">{sticker.emoji}</span>
                    <span className="mt-1 text-[11px] text-muted-foreground">{sticker.label}</span>
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      {body.trim() || attachmentFile ? (
          <Button type="submit" className="shrink-0 px-4 py-2 gap-2">
            <SendHorizontal className="h-4 w-4" />
            Send
          </Button>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={sendQuickLike}
            aria-label="Send like"
            title="Send like"
          >
          <ThumbsUp className="h-8 w-8" />
          </Button>
        )}
      </form>

      <Dialog open={forwardOpen} onOpenChange={(open) => (open ? setForwardOpen(true) : closeForwardDialog())}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Forward message</DialogTitle>
            <DialogDescription>Choose a conversation to send this message to.</DialogDescription>
          </DialogHeader>

          {forwardMessage ? (
            <div className="rounded-2xl border bg-slate-50 p-3">
              <div className="mb-2 text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Message preview
              </div>
              {isStickerBody(forwardMessage.body) ? (
                <div className="text-3xl leading-none">{stickerEmojiByKey(stickerKeyFromBody(forwardMessage.body))}</div>
              ) : forwardMessage.attachment_path ? (
                <div className="space-y-2">
                  {isImageAttachmentType(forwardMessage.attachment_type) ? (
                    <img
                      src={getAttachmentUrl(forwardMessage)}
                      alt={forwardMessage.attachment_name || "Attachment"}
                      className="max-h-28 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="flex items-center gap-2 rounded-xl bg-slate-100 px-2 py-1.5">
                      <FileText className="h-4 w-4 shrink-0 text-slate-500" />
                      <div className="min-w-0">
                        <div className="truncate text-[10px] font-medium leading-tight text-slate-700">
                          {forwardMessage.attachment_name || "Attachment"}
                        </div>
                        {forwardMessage.attachment_size ? (
                          <div className="text-[9px] leading-tight text-slate-500">
                            {formatBytes(forwardMessage.attachment_size)}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  )}
                  {forwardMessage.body ? (
                    <div className="text-sm text-slate-700">{renderLinkifiedText(forwardMessage.body)}</div>
                  ) : null}
                </div>
              ) : (
                <div className="text-sm text-slate-700">{renderLinkifiedText(forwardMessage.body || "")}</div>
              )}
            </div>
          ) : null}

            <div className="space-y-2">
              <Input
                value={forwardQuery}
                onChange={(e) => setForwardQuery(e.target.value)}
                placeholder="Search people or chats"
              />

              <ScrollArea className="max-h-72 pr-2">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="px-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      Conversations
                    </div>
                    {filteredForwardConversations.length ? (
                      filteredForwardConversations.map((conversation) => {
                        const selected = Number(forwardTargetId) === Number(conversation.id)

                        return (
                          <button
                            key={`forward-target-${conversation.id}`}
                            type="button"
                            className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left transition ${
                              selected ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:bg-slate-50"
                            }`}
                            onClick={() => {
                              setForwardTargetId(conversation.id)
                              setForwardTargetUserId(null)
                            }}
                          >
                            <ForwardConversationAvatar
                              conversation={conversation}
                              avatarUrl={avatarUrl}
                              meId={me?.id}
                              safeUsers={safeUsers}
                            />
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-sm font-medium text-slate-900">{conversation.name}</div>
                              <div className="truncate text-xs text-slate-500">
                                {conversation.type === "group" ? "Group conversation" : "Direct message"}
                              </div>
                            </div>
                            {selected ? <div className="h-2.5 w-2.5 rounded-full bg-blue-500" /> : null}
                          </button>
                        )
                      })
                    ) : (
                      <div className="rounded-xl border border-dashed px-3 py-4 text-center text-sm text-slate-500">
                        No conversations found.
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="px-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      People
                    </div>
                    {filteredForwardUsers.length ? (
                      filteredForwardUsers.map((user) => {
                        const selected = Number(forwardTargetUserId) === Number(user.id)

                        return (
                          <button
                            key={`forward-user-${user.id}`}
                            type="button"
                            className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left transition ${
                              selected ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:bg-slate-50"
                            }`}
                            onClick={() => {
                              setForwardTargetUserId(user.id)
                              setForwardTargetId(null)
                            }}
                          >
                            <Avatar className="h-8 w-8 shrink-0">
                              <AvatarImage
                                src={user.avatar || (user.ipms_id ? `/employees/image/${user.ipms_id}` : "https://www.gravatar.com/avatar/?d=mp&s=200")}
                                alt={user.name}
                                loading="lazy"
                              />
                              <AvatarFallback>
                                {(user.name || "U")
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .slice(0, 2)
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-sm font-medium text-slate-900">{user.name}</div>
                              <div className="truncate text-xs text-slate-500">
                                {user._conversationId ? "Direct message" : "New recipient"}
                              </div>
                            </div>
                            {selected ? <div className="h-2.5 w-2.5 rounded-full bg-blue-500" /> : null}
                          </button>
                        )
                      })
                    ) : (
                      <div className="rounded-xl border border-dashed px-3 py-4 text-center text-sm text-slate-500">
                        No people found.
                      </div>
                    )}
                  </div>
                </div>
              </ScrollArea>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeForwardDialog} disabled={forwardSubmitting}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleForwardSubmit}
                disabled={(!forwardTargetId && !forwardTargetUserId) || forwardSubmitting}
              >
                {forwardSubmitting ? "Forwarding..." : "Forward"}
              </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      <AttachmentPreviewDialog
        open={Boolean(imagePreview)}
        onOpenChange={(open) => {
          if (!open) setImagePreview(null)
        }}
        file={imagePreview}
        title={imagePreview?.name || "Attachment Preview"}
      />
    </>
  )
}
