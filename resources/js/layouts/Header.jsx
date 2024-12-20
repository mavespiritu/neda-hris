import {
    CircleUser,
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
  import { Input } from "../components/ui/input"
  import { Sheet, SheetContent, SheetTrigger } from "../components/ui/sheet"
  import { usePage } from '@inertiajs/react'
  import { SidebarTrigger } from "@/components/ui/sidebar"
  import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
  import { useForm, Link } from '@inertiajs/react'
  import { useUser } from "@/providers/UserProvider"

  const Logo = ({ hidden = false }) => {

    return (
      <div
        className={`gap-4 items-center flex-shrink-0 ${
          hidden ? "hidden" : "flex"
        }`}
      >
        <a href="/" className="flex gap-2 items-center text-xl font-bold">
          <Package2 className="h-6 w-6" />
          <span>HRIS</span>
          {/* <img src={logo} className="h-6" /> */}
        </a>
      </div>
    );
  }
  
  const Header = () => {

    const { user } = useUser() 
    const { post } =  useForm()

    const handleLogout = (e) => {
      post(`/logout`)

      return to_route('login')
    }

    return (
      <header className="flex gap-2 justify-between sticky top-0 p-2 items-center h-16 shrink-0 border-b bg-background z-50">
        <SidebarTrigger className="ml-2" />
        <div className="flex flex-end items-center gap-2">
          <div className="flex flex-col">
            <span className="text-sm font-semibold">{user?.first_name} {user?.last_name}</span>
            <span className="text-xs text-muted-foreground">{user?.email}</span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="p-2 flex items-center gap-2">
                <Avatar>
                    <AvatarImage src={user?.ipms_id ? `/employees/image/${user?.ipms_id}` : `https://github.com/shadcn.png`} loading="lazy" />
                    <AvatarFallback>{`first_name last_name`}</AvatarFallback>
                </Avatar>
                <ChevronDown className="size-4"/>
                <span className="sr-only">Toggle user menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuItem>Support</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
    )
  }
  
  export default Header