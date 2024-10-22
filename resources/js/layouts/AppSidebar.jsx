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
    ChevronDown,
    ChevronRight
  } from "lucide-react"

  import { Link, usePage } from '@inertiajs/react'

  import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
  } from "@/components/ui/collapsible"

const AppSidebar = () => {

  const { url } = usePage()

const items = [
    {
      title: "Dashboard",
      url: "/",
      icon: BarChart,
    },
    {
      title: "NPIS",
      url: "#",
      icon: Notebook,
      submenu: [
        { title: 'My PDS', url: '/my-pds' },
        { title: 'Staff PDS', url: '/staff-pds' },
        { title: 'Staff 201', url: '/staff-201' },
      ],
    },
    {
      title: "DTR",
      url: "#",
      icon: Clock,
      submenu: [
        { title: 'FWA', url: '/fwa' },
      ],
    },
    {
      title: "Competencies",
      url: "#",
      icon: Lightbulb,
      submenu: [
        { title: 'My CGA', url: '/my-cga' },
        { title: 'Staff CGA', url: '/staff-cga' },
        { title: 'Review CGA', url: '/review-cga' },
        { title: 'Competencies', url: '/competencies' },
        { title: 'Indicators', url: '/indicators' },
        { title: 'LSPs', url: '/lsps' },
        { title: 'Trainings', url: '/trainings' },
      ],
    },
    {
      title: "Administrator",
      url: "#",
      icon: Cog,
    },
    
  ]

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarHeader className="font-bold">HRIS</SidebarHeader>
        <SidebarGroup>
          <SidebarGroupLabel>Main Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
            {items.map((item) => {
              const isActive = item.submenu?.some(subitem => url === subitem.url);
              return (
                <Collapsible key={item.title}  className="group/collapsible" defaultOpen={isActive}>
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton asChild>
                        <div>
                          <item.icon />
                          <span>{item.title}</span>
                          {item.submenu && (
                            <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                          )}
                        </div>
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    {item.submenu && (
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.submenu.map((subitem) => (
                            <SidebarMenuButton key={subitem.title} className={url === subitem.url ? 'bg-muted font-semibold' : ''}>
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