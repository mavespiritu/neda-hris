import { useEffect, useMemo, useState } from "react"
import { usePage } from "@inertiajs/react"
import Header from "./Header"
import SubHeader from "./SubHeader"
import AppSidebar from "@/layouts/AppSidebar"
import MessengerQuickPanel from "@/components/MessengerQuickPanel"
import { SidebarProvider } from "@/components/ui/sidebar"
import { Toaster } from "@/components/ui/toaster"
import { MessengerPresenceProvider } from "@/providers/MessengerPresenceProvider"
import { MessengerSharedProvider } from "@/providers/MessengerSharedProvider"

const AuthenticatedLayoutBody = ({
  children,
  user,
  users,
  messenger_users,
  isMessengerPage,
  open,
  setOpen,
  messengerPanelOpen,
  messengerPanelMode,
  messengerPanelConversation,
  messengerPanelWidth,
  messengerPanelGap,
  handleOpenMessengerConversation,
  handleComposeMessengerConversation,
  handleCloseMessengerPanel,
  handleOpenFullMessenger,
  handleSelectMessengerPageConversation,
}) => {
  return (
    <>
      <SidebarProvider
        open={open}
        onOpenChange={setOpen}
        style={{
          "--sidebar-width": "15rem",
          "--sidebar-width-mobile": "15rem",
        }}
      >
        {user?.ipms_id && <AppSidebar />}

        <main className="w-full flex flex-col min-h-screen">
          <Header
            isMessengerPage={isMessengerPage}
            users={users}
            messengerUsers={messenger_users}
            onOpenMessengerConversation={isMessengerPage ? handleSelectMessengerPageConversation : handleOpenMessengerConversation}
            onComposeMessengerConversation={isMessengerPage ? undefined : handleComposeMessengerConversation}
          />
          {!user?.ipms_id && user?.email_verified_at && <SubHeader />}
          <div
            className={`flex flex-1 flex-col pt-4 pb-8 transition-[padding-right] duration-300 ease-out ${
              user?.ipms_id ? "px-4 sm:px-6 md:px-8" : "px-4 sm:px-8 md:px-16 lg:px-32"
            }`}
            style={{
              paddingRight:
                messengerPanelOpen && !isMessengerPage
                  ? `calc(${messengerPanelWidth} + ${messengerPanelGap})`
                  : undefined,
            }}
          >
            {children}
          </div>
        </main>

        {user?.ipms_id && !isMessengerPage ? (
          <MessengerQuickPanel
            open={messengerPanelOpen}
            mode={messengerPanelMode}
            width={messengerPanelWidth}
            me={user}
            users={[...messenger_users, ...users]}
            conversation={messengerPanelConversation}
            onClose={handleCloseMessengerPanel}
            onOpenFullMessenger={handleOpenFullMessenger}
          />
        ) : null}

        <Toaster />
      </SidebarProvider>
    </>
  )
}

const AuthenticatedLayout = ({ children }) => {
  const page = usePage()
  const { auth, users = [], messenger_users = [] } = page.props
  const user = auth?.user

  const isMessengerPage = useMemo(
    () => String(page.url || (typeof window !== "undefined" ? window.location.pathname : "") || "").startsWith("/messenger"),
    [page.url]
  )

  const [open, setOpen] = useState(() => {
    const savedState = localStorage.getItem("HRIS_sidebarOpen")
    return savedState ? JSON.parse(savedState) : true
  })
  const [messengerPanelOpen, setMessengerPanelOpen] = useState(false)
  const [messengerPanelMode, setMessengerPanelMode] = useState("conversation")
  const [messengerPanelConversation, setMessengerPanelConversation] = useState(null)
  const messengerPanelWidth = "28rem"
  const messengerPanelGap = "2rem"

  useEffect(() => {
    localStorage.setItem("HRIS_sidebarOpen", JSON.stringify(open))
  }, [open])

  useEffect(() => {
    if (isMessengerPage) {
      setMessengerPanelOpen(false)
      setMessengerPanelConversation(null)
    }
  }, [isMessengerPage])

  const handleOpenMessengerConversation = (conversation) => {
    if (isMessengerPage) return

    setMessengerPanelMode("conversation")
    setMessengerPanelConversation(conversation || null)
    setMessengerPanelOpen(Boolean(conversation?.id))
  }

  const handleComposeMessengerConversation = () => {
    if (isMessengerPage) return

    setMessengerPanelMode("compose")
    setMessengerPanelConversation(null)
    setMessengerPanelOpen(true)
  }

  const handleCloseMessengerPanel = () => {
    setMessengerPanelOpen(false)
    setMessengerPanelMode("conversation")
  }

  const handleOpenFullMessenger = () => {
    const targetConversationToken = messengerPanelConversation?.conversation_token
    setMessengerPanelOpen(false)
    setMessengerPanelMode("conversation")
    setMessengerPanelConversation(null)
    window.location.href = targetConversationToken
      ? route("messenger.conversation", targetConversationToken)
      : route("messenger.index")
  }

  const handleSelectMessengerPageConversation = (conversation) => {
    if (!conversation?.id || !isMessengerPage || typeof window === "undefined") return

    const nextUrl = conversation?.conversation_token
      ? new URL(route("messenger.conversation", conversation.conversation_token), window.location.origin)
      : new URL(route("messenger.index"), window.location.origin)

    window.history.replaceState(null, "", nextUrl.toString())
    window.dispatchEvent(new PopStateEvent("popstate"))
  }

  return (
    <MessengerPresenceProvider userId={user?.id}>
      <MessengerSharedProvider>
        <AuthenticatedLayoutBody
          children={children}
          user={user}
          users={users}
          messenger_users={messenger_users}
          isMessengerPage={isMessengerPage}
          open={open}
          setOpen={setOpen}
          messengerPanelOpen={messengerPanelOpen}
          messengerPanelMode={messengerPanelMode}
          messengerPanelConversation={messengerPanelConversation}
          messengerPanelWidth={messengerPanelWidth}
          messengerPanelGap={messengerPanelGap}
          handleOpenMessengerConversation={handleOpenMessengerConversation}
          handleComposeMessengerConversation={handleComposeMessengerConversation}
          handleCloseMessengerPanel={handleCloseMessengerPanel}
          handleOpenFullMessenger={handleOpenFullMessenger}
          handleSelectMessengerPageConversation={handleSelectMessengerPageConversation}
        />
      </MessengerSharedProvider>
    </MessengerPresenceProvider>
  )
}

export default AuthenticatedLayout
