import {
  Package2,
  ChevronDown
} from "lucide-react"
import { Button } from "../components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useForm, router } from '@inertiajs/react'
import { useUser } from "@/providers/UserProvider"
import MessengerMiniInbox from "@/components/MessengerMiniInbox"
import { useMessengerShared } from "@/providers/MessengerSharedProvider"

  const Logo = ({ hidden = false }) => {

    return (
      <div
        className={`gap-4 items-center flex-shrink-0 ${
          hidden ? "hidden" : "flex"
        }`}
      >
        <a href="/" className="flex gap-2 items-center text-xl font-bold">
          <Package2 className="h-6 w-6" />
          <span>DRO1 HRIS</span>
          {/* <img src={logo} className="h-6" /> */}
        </a>
      </div>
    );
  }
  
  const Header = ({
    isMessengerPage,
    users = [],
    messengerUsers = [],
    onOpenMessengerConversation,
    onComposeMessengerConversation,
  }) => {

  const { user, isApplicant } = useUser() 
  console.log(user)
  const { post } =  useForm()
  const { onlineUserIds } = useMessengerShared()

    const handleLogout = (e) => {
      e.preventDefault()
      post(route('logout'), {
        onSuccess: () => router.visit(route('login'))
      })
    }

    const isOnline = user?.id ? onlineUserIds.has(Number(user.id)) : false

    return (
      <header
        className={`flex gap-2 justify-between sticky top-0 items-center h-16 shrink-0 border-b z-50 text-black bg-white ${
          user?.ipms_id
            ? "p-2"
            : "px-4 sm:px-8 md:px-16 lg:px-32"
        }`}
      >
        {user?.ipms_id ?
         <SidebarTrigger className="ml-2" /> : 
        <span className=" font-semibold text-lg">
          DRO1 HRIS
        </span>}
        <div className="flex flex-end items-center gap-2">
          {user?.ipms_id ? (
            <MessengerMiniInbox
              userId={user?.id}
              meId={user?.id}
              me={user}
              users={[...messengerUsers, ...users]}
              onOpenConversation={onOpenMessengerConversation}
              onComposeNewMessage={onComposeMessengerConversation}
              isMessengerPage={isMessengerPage}
            />
          ) : null}
          <div className="flex-col hidden md:flex">
            <span className="text-sm font-semibold">
                {(!isApplicant && `${user?.first_name} ${user?.last_name}`) 
                    || user?.name}
            </span>
            <span className="text-xs text-gray-500">{user?.email}</span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="p-2 flex items-center gap-2">
                <div className="relative">
                  <Avatar>
                    <AvatarImage src={user?.ipms_id ? `/employees/image/${user?.ipms_id}` : `https://www.gravatar.com/avatar/?d=mp&s=200`} loading="lazy" />
                    <AvatarFallback>{`first_name last_name`}</AvatarFallback>
                  </Avatar>
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white shadow-sm ${
                      isOnline ? "bg-emerald-500" : "bg-slate-400"
                    }`}
                    title={isOnline ? "Online" : "Offline"}
                    aria-label={isOnline ? "Online" : "Offline"}
                  />
                </div>
                <ChevronDown className="size-4"/>
                <span className="sr-only">Toggle user menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
    )
  }
  
  export default Header


