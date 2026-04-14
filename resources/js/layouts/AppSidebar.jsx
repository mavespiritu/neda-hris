import React from "react"
import { ChevronRight, Folder } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  useSidebar
} from "@/components/ui/sidebar"

import { Link, usePage } from '@inertiajs/react'

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

import { useAuth } from '@/hooks/useAuth'
import { sidebarItems } from "./sidebarItems"

const AppSidebar = () => {
  const { url } = usePage()
  const { open } = useSidebar()
  const user = useAuth()
  const userRoles = user?.roles ?? []
  const userPermissions = user?.permissions ?? []

  const items = sidebarItems
  const canAccess = (item) => {
    const hasRoles = Array.isArray(item.roles) && item.roles.length > 0
    const hasPermissions = Array.isArray(item.permissions) && item.permissions.length > 0

    const roleMatch = hasRoles
      ? item.roles.some((role) => userRoles.includes(role))
      : false
    const permissionMatch = hasPermissions
      ? item.permissions.some((permission) => userPermissions.includes(permission))
      : false

    if (hasRoles && hasPermissions) {
      return roleMatch || permissionMatch
    }

    if (hasRoles) {
      return roleMatch
    }

    if (hasPermissions) {
      return permissionMatch
    }

    return true
  }

  const visibleItems = items.filter((item) => {
    if (canAccess(item)) {
      return true
    }

    return item.submenu?.some(canAccess) ?? false
  })

  const isActivePath = (currentUrl, targetUrl) => {
    if (!targetUrl) return false
    if (currentUrl === targetUrl) return true
    return currentUrl.startsWith(targetUrl + "/")
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="bg-[#FAFAFA] p-2">
        {open && <SidebarHeader className="font-bold pt-4 pl-2 text-lg text-center">DRO1 HRIS</SidebarHeader>}
        <SidebarGroup>
          <SidebarGroupLabel className="font-semibold">MAIN MENU</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleItems
                .map((item) => {
                  const isActive = item.submenu?.some((subitem) => isActivePath(url, subitem.url))
                  return (
                    <Collapsible key={item.title} className="group/collapsible" defaultOpen={isActive}>
                      <SidebarMenuItem>
                        {item.submenu ? (
                          <CollapsibleTrigger asChild>
                            <SidebarMenuButton asChild title={!open ? item.title : undefined}>
                              <div className="flex items-center gap-2 w-full">
                                <item.icon />
                                {open && <span className="font-medium text-sm">{item.title}</span>}
                                {item.submenu && (
                                  <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                                )}
                              </div>
                            </SidebarMenuButton>
                          </CollapsibleTrigger>
                        ) : (
                          // ?? FIX: Make entire row clickable
                          <SidebarMenuButton asChild title={!open ? item.title : undefined}>
                            <Link
                              href={item.url}
                              className={`flex items-center gap-2 w-full rounded-md px-2 py-1.5 transition-colors
                              ${isActivePath(url, item.url)
                                ? "bg-muted text-foreground font-semibold"
                                : "hover:bg-muted hover:text-foreground"
                              }`}
                            >
                              <item.icon />
                              {open && <span className="font-medium text-sm">{item.title}</span>}
                            </Link>
                          </SidebarMenuButton>
                        )}
                        {item.submenu && (
                          <CollapsibleContent>
                            <SidebarMenuSub>
                              {item.submenu
                                .filter(canAccess)
                                .map((subitem) => (
                                  // ?? FIX: Make submenu row clickable
                                  <SidebarMenuButton
                                    key={subitem.title}
                                    asChild
                                    title={!open ? subitem.title : undefined}
                                    className={`font-medium ${isActivePath(url, subitem.url) ? "bg-muted" : ""}`}
                                  >
                                    <Link 
                                      href={subitem.url}
                                      className={`flex items-center gap-2 w-full rounded-md px-2 py-1.5 transition-colors
                                        ${isActivePath(url, subitem.url)
                                          ? "bg-muted text-foreground font-semibold"
                                          : "hover:bg-muted hover:text-foreground"
                                        }`}
                                      >
                                      {(subitem.icon ?? Folder) && (
                                        <span className="flex items-center gap-2">
                                          {React.createElement(subitem.icon ?? Folder, { className: "size-4" })}
                                          <span>{subitem.title}</span>
                                        </span>
                                      )}
                                    </Link>
                                  </SidebarMenuButton>
                                ))}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        )}
                      </SidebarMenuItem>
                    </Collapsible>
                  )
                })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}

export default AppSidebar



