import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubItem,
    SidebarMenuButton,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
  } from "@/components/ui/sidebar"

  import {
    BarChart,
    Notebook,
    Clock,
    Lightbulb,
    Cog,
    UserRoundCog,
    ChevronDown,
    ChevronRight
  } from "lucide-react"

  import { Link, usePage } from '@inertiajs/react'

  import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
  } from "@/components/ui/collapsible"
  import { useHasRole, useHasPermission } from '@/hooks/useAuth'

const AppSidebar = () => {

  const { url } = usePage()

  const items = [
    {
      title: "Dashboard",
      url: "/",
      icon: BarChart,
      permissions: ['HRIS_dashboard.view']
    },
    {
      title: "NPIS",
      url: "#",
      icon: Notebook,
      roles: ['HRIS_Staff'],
      submenu: [
        { title: 'My PDS', url: '/my-pds', roles: ['HRIS_Staff'] },
        { title: 'Staff PDS', url: '/staff-pds', roles: ['HRIS_HR'] },
        { title: 'Staff 201', url: '/staff-201', roles: ['HRIS_HR'] },
      ],
    },
    {
      title: "DTR",
      url: "#",
      icon: Clock,
      roles: ['HRIS_Staff'],
      submenu: [
        { title: 'FWA', url: '/fwa', roles: ['HRIS_Staff'] },
      ],
    },
    {
      title: "Competencies",
      url: "#",
      icon: Lightbulb,
      roles: ['HRIS_Staff'],
      submenu: [
        { title: 'My CGA', url: '/my-cga', roles: ['HRIS_Staff'] },
        { title: 'Staff CGA', url: '/staff-cga', roles: ['HRIS_HR'] },
        { title: 'Review CGA', url: '/review-cga', roles: ['HRIS_HR', 'HRIS_DC'] },
        { title: 'Compare CGA', url: '/compare-cga', roles: ['HRIS_HR', 'HRIS_DC'] },
        { title: 'Competencies', url: '/competencies', roles: ['HRIS_HR'] },
        { title: 'Indicators', url: '/indicators', roles: ['HRIS_HR'] },
        { title: 'LSPs', url: '/lsps', roles: ['HRIS_HR'] },
        { title: 'Trainings', url: '/trainings', roles: ['HRIS_HR'] },
      ],
    },
    {
      title: "Administrator",
      url: "#",
      icon: UserRoundCog,
      roles: ['HRIS_Administrator']
    },
    {
      title: "Settings",
      url: "#",
      icon: Cog,
      roles: ['HRIS_HR', 'HRIS_Administrator']
    },
    
  ]

  const isVisible = (item) => {
    const hasRole = item.roles ? item.roles.some((role) => useHasRole(role)) : true
    const hasPermission = item.permissions
      ? item.permissions.some((permission) => useHasPermission(permission))
      : true
    return hasRole && hasPermission
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarHeader className="font-bold mt-2">HRIS</SidebarHeader>
        <SidebarGroup>
          <SidebarGroupLabel>Main Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
            {items
              .filter(isVisible)
              .map((item) => {
              const isActive = item.submenu?.some(subitem => url === subitem.url)
              return (
                <Collapsible key={item.title} className="group/collapsible" defaultOpen={isActive}>
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton asChild>
                        <div>
                          <item.icon />
                          <span className="font-medium text-sm">{item.title}</span>
                          {item.submenu && (
                            <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                          )}
                        </div>
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    {item.submenu && (
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.submenu
                            .filter(isVisible)
                            .map((subitem) => (
                            <SidebarMenuButton key={subitem.title} className={`font-medium ${url === subitem.url && 'bg-muted'}`}>
                              <Link href={subitem.url}>
                                <span>{subitem.title}</span>
                              </Link>
                            </SidebarMenuButton>
                          ))}
                          <SidebarMenuSubItem />
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