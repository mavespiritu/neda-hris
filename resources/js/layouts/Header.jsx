import {
    CircleUser,
    Package2,
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

    const {
      first_name,
      last_name,
      email,
      ipms_id
    } = usePage().props.auth.user

    return (
      <header className="flex gap-10 lg:gap-20 justify-between">
        <SidebarTrigger />
        <div className="flex flex-end items-center gap-2">
          <div className="flex flex-col">
            <span className="text-sm font-semibold">{first_name} {last_name}</span>
            <span className="text-xs text-muted-foreground">{email}</span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="rounded-full flex items-center gap-2">
                <Avatar>
                    <AvatarImage src={`/employees/image/${ipms_id}`} loading="lazy" />
                    <AvatarFallback>{`first_name last_name`}</AvatarFallback>
                </Avatar>
                <span className="sr-only">Toggle user menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuItem>Support</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
    )
  }
  
  export default Header