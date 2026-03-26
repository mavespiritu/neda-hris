import { useEffect, useMemo, useRef, useState } from "react"
import axios from "axios"
import { Head } from "@inertiajs/react"
import PageTitle from "@/components/PageTitle"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Inbox, Loader2, RefreshCcw, Search } from "lucide-react"
import SelectedEmail from "./SelectedEmail"
import RouteFormDialog from "./RouteFormDialog"

const formatDateTime = (value) => {
  if (!value) return "-"
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value))
  } catch {
    return value
  }
}

const formatInboxDate = (value) => {
  if (!value) return "-"

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  const today = new Date()
  const isSameDay =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()

  if (isSameDay) {
    try {
      return new Intl.DateTimeFormat(undefined, {
        timeStyle: "short",
      }).format(date)
    } catch {
      return date.toLocaleTimeString()
    }
  }

  return formatDateTime(value)
}

export default function Emails({
  messages: initialMessages = [],
  nextLink: initialNextLink = null,
  needsMicrosoftConnect = false,
  connectUrl,
  error = null,
  search: initialSearch = "",
  filter: initialFilter = "all",
  initialSelectedMessageId = null,
}) {
  const { toast } = useToast()
  const loadMoreRef = useRef(null)
  const inboxScrollRef = useRef(null)

  const [search, setSearch] = useState(initialSearch)
  const [filter, setFilter] = useState(initialFilter || "all")
  const [messages, setMessages] = useState(initialMessages)
  const [nextLink, setNextLink] = useState(initialNextLink)
  const [selectedMessageId, setSelectedMessageId] = useState(initialSelectedMessageId || initialMessages[0]?.id || null)
  const [selectedMessage, setSelectedMessage] = useState(null)
  const [isLoadingList, setIsLoadingList] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)
  const [routeDialogOpen, setRouteDialogOpen] = useState(false)
  const [routeForm, setRouteForm] = useState({
    route_to: "For action",
    note: "",
  })

  const hasMore = Boolean(nextLink)

  const selectedMessageSummary = useMemo(
    () => messages.find((message) => message.id === selectedMessageId) || null,
    [messages, selectedMessageId]
  )

  const loadInbox = async ({ cursor = null, reset = false, searchOverride = search, filterOverride = filter } = {}) => {
    if (reset) {
      setIsLoadingList(true)
    } else {
      setIsLoadingMore(true)
    }

    try {
      const { data } = await axios.get(route("emails.index"), {
        params: {
          json: 1,
          search: searchOverride,
          filter: filterOverride,
          cursor,
        },
      })

      if (data?.error) {
        toast({
          title: "Inbox error",
          description: data.error,
          variant: "destructive",
        })
        return
      }

      setMessages((prev) => (reset ? data.messages || [] : [...prev, ...(data.messages || [])]))
      setNextLink(data.nextLink || null)

      if (reset) {
        setSelectedMessageId(data.messages?.[0]?.id || null)
        setSelectedMessage(null)
      }
    } catch (error) {
      toast({
        title: "Inbox error",
        description: error.response?.data?.error || "Unable to fetch Outlook mail right now.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingList(false)
      setIsLoadingMore(false)
    }
  }

  const loadMessage = async (messageId) => {
    if (!messageId) return

    setIsLoadingDetail(true)
    setSelectedMessage(null)

    try {
      const { data } = await axios.get(route("emails.index"), {
        params: {
          json: 1,
          message_id: messageId,
        },
      })

      if (data?.message) {
        setSelectedMessage(data.message)
        setMessages((prev) =>
          prev.map((message) =>
            message.id === messageId ? { ...message, isRead: true } : message
          )
        )
      }
    } catch (error) {
      toast({
        title: "Email open error",
        description: error.response?.data?.error || "Unable to open the selected email right now.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingDetail(false)
    }
  }

  useEffect(() => {
    if (!selectedMessageId) return
    loadMessage(selectedMessageId)
  }, [selectedMessageId])

  const handleInboxScroll = (event) => {
    const target = event.currentTarget

    if (!target || !hasMore || isLoadingMore || isLoadingList) {
      return
    }

    const remaining = target.scrollHeight - target.scrollTop - target.clientHeight

    if (remaining < 120) {
      loadInbox({ cursor: nextLink, reset: false, searchOverride: search, filterOverride: filter })
    }
  }

  useEffect(() => {
    const root = inboxScrollRef.current
    const target = loadMoreRef.current

    if (!root || !target || !hasMore || isLoadingMore || isLoadingList) {
      return undefined
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting || !hasMore || isLoadingMore || isLoadingList) {
          return
        }

        loadInbox({
          cursor: nextLink,
          reset: false,
          searchOverride: search,
          filterOverride: filter,
        })
      },
      {
        root,
        rootMargin: "120px",
        threshold: 0,
      }
    )

    observer.observe(target)

    return () => observer.disconnect()
  }, [hasMore, isLoadingList, isLoadingMore, nextLink, search, filter, messages.length])

  const handleSearch = () => {
    setFilter("all")
    loadInbox({ reset: true, searchOverride: search, filterOverride: "all" })
  }

  const handleRouteCopy = async () => {
    const routingMemo = [
      `Subject: ${selectedMessage?.subject || selectedMessageSummary?.subject || "-"}`,
      `From: ${selectedMessage?.senderName || selectedMessage?.from || "-"}`,
      `Received: ${formatDateTime(selectedMessage?.receivedAt || selectedMessageSummary?.receivedAt)}`,
      `Route: ${routeForm.route_to}`,
      `Note: ${routeForm.note || "-"}`,
      selectedMessage?.webLink ? `Outlook Link: ${selectedMessage.webLink}` : null,
    ]
      .filter(Boolean)
      .join("\n")

    try {
      await navigator.clipboard.writeText(routingMemo)
      toast({
        title: "Routing note copied",
        description: "Paste it into your delegate/route workflow or forwarding message.",
      })
      setRouteDialogOpen(false)
    } catch {
      toast({
        title: "Unable to copy",
        description: "Please copy the routing note manually.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="h-full flex flex-col gap-4">
      <Head title="Emails" />

      <div className="flex h-full flex-col gap-4">
        <PageTitle
          pageTitle="Emails"
          description="Search, preview, and route delegated tasks from your Microsoft inbox."
          breadcrumbItems={[
            { label: "Home", href: "/" },
            { label: "Performance" },
            { label: "Emails" },
          ]}
        />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-slate-600">
            {needsMicrosoftConnect
              ? "Connect your Microsoft account to load Outlook messages."
              : "Your inbox is connected and ready for task routing."}
          </div>

          <Button
            type="button"
            className="bg-blue-700 px-4 text-white hover:bg-blue-600"
            onClick={() => {
              window.location.href = connectUrl
            }}
          >
            {needsMicrosoftConnect ? "Connect Microsoft Account" : "Reconnect Microsoft"}
          </Button>
        </div>

        <div className="grid gap-4 lg:grid-cols-[30%_70%]">
          <Card className="min-h-[72vh] overflow-hidden border-slate-200 bg-white/90 shadow-sm">
            <CardHeader className="space-y-3 border-b bg-slate-50/80">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-lg">Inbox</CardTitle>
                  <CardDescription>Search, filter, and scroll to load more messages.</CardDescription>
                </div>
                <Badge variant="secondary" className="gap-1">
                  <Inbox className="h-3.5 w-3.5" />
                  {messages.length}
                </Badge>
              </div>

              <div className="space-y-3">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                      placeholder="Search mail"
                      className="pl-9"
                    />
                  </div>
                  <Button variant="outline" size="icon" onClick={handleSearch} disabled={isLoadingList}>
                    {isLoadingList ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant={filter === "all" ? "default" : "outline"}
                    size="sm"
                    className="h-7 rounded-full px-3 text-xs"
                    onClick={() => {
                      setSearch("")
                      setFilter("all")
                      loadInbox({ reset: true, searchOverride: "", filterOverride: "all" })
                    }}
                  >
                    All
                  </Button>
                  <Button
                    type="button"
                    variant={filter === "unread" ? "default" : "outline"}
                    size="sm"
                    className="h-7 rounded-full px-3 text-xs"
                    onClick={() => {
                      setSearch("")
                      setFilter("unread")
                      loadInbox({ reset: true, searchOverride: "", filterOverride: "unread" })
                    }}
                  >
                    Unread
                  </Button>
                  <Button
                    type="button"
                    variant={filter === "attachments" ? "default" : "outline"}
                    size="sm"
                    className="h-7 rounded-full px-3 text-xs"
                    onClick={() => {
                      setSearch("")
                      setFilter("attachments")
                      loadInbox({ reset: true, searchOverride: "", filterOverride: "attachments" })
                    }}
                  >
                    Attachments
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 rounded-full px-3 text-xs gap-1.5"
                    onClick={() => loadInbox({ reset: true })}
                    disabled={isLoadingList}
                  >
                    <RefreshCcw className="h-3.5 w-3.5" />
                    Refresh
                  </Button>
                </div>
              </div>
            </CardHeader>

            <div
              ref={inboxScrollRef}
              onScroll={handleInboxScroll}
              className="h-[calc(72vh-220px)] overflow-y-auto"
            >
              <div className="divide-y divide-slate-100">
                {needsMicrosoftConnect ? (
                  <div className="p-4 text-sm text-slate-600">
                    Connect your Microsoft account to load Outlook messages.
                  </div>
                ) : error ? (
                  <div className="p-4 text-sm text-red-700">{error}</div>
                ) : messages.length === 0 ? (
                  <div className="p-6 text-sm text-slate-500">No messages found.</div>
                ) : (
                  messages.map((message) => (
                    <button
                      key={message.id}
                      type="button"
                      onClick={() => setSelectedMessageId(message.id)}
                      className={`w-full border-l-4 px-4 py-4 text-left transition hover:bg-slate-50 ${
                        selectedMessageId === message.id
                          ? "border-l-blue-600 bg-blue-50/50"
                          : message.isRead
                            ? "border-l-transparent"
                            : "border-l-sky-400 bg-sky-50/40"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-semibold text-slate-900">
                              {message.subject || "(No subject)"}
                            </p>
                            {!message.isRead && (
                              <span className="h-2.5 w-2.5 rounded-full bg-sky-500" />
                            )}
                          </div>
                          <p className="truncate text-xs text-slate-500">
                            {message.senderName || message.from || "-"}
                          </p>
                          <p className="mt-1 line-clamp-2 text-xs text-slate-600">
                            {message.preview || "-"}
                          </p>
                        </div>
                        <div className="shrink-0 text-right text-[11px] text-slate-500">
                          {formatInboxDate(message.receivedAt)}
                        </div>
                      </div>
                    </button>
                  ))
                )}
                <div ref={loadMoreRef} className="p-4 text-center text-xs text-slate-500">
                  {isLoadingMore ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading more messages...
                    </span>
                  ) : hasMore ? (
                    "Scroll to load more"
                  ) : (
                    "End of inbox"
                  )}
                </div>
              </div>
            </div>
          </Card>

          <SelectedEmail
            selectedMessage={selectedMessage}
            selectedMessageSummary={selectedMessageSummary}
            selectedMessageId={selectedMessageId}
            isLoadingDetail={isLoadingDetail}
            formatDateTime={formatDateTime}
            onOpenRoute={() => setRouteDialogOpen(true)}
            onOpenOutlook={
              selectedMessage?.webLink || selectedMessageSummary?.webLink
                ? () => {
                    window.open(
                      selectedMessage?.webLink || selectedMessageSummary?.webLink,
                      "_blank",
                      "noreferrer"
                    )
                  }
                : null
            }
          />
        </div>
      </div>

      <RouteFormDialog
        open={routeDialogOpen}
        onOpenChange={setRouteDialogOpen}
        routeForm={routeForm}
        setRouteForm={setRouteForm}
        onCopy={handleRouteCopy}
      />

      {!needsMicrosoftConnect && !error && messages.length === 0 && !isLoadingList ? (
        <div className="fixed bottom-6 right-6 hidden rounded-full bg-slate-950 px-4 py-2 text-xs font-medium text-white shadow-lg lg:block">
          Tip: scroll the inbox to load the next batch of emails.
        </div>
      ) : null}
    </div>
  )
}
