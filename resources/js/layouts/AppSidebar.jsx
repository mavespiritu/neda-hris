import React from "react"
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
  useSidebar
} from "@/components/ui/sidebar"

import {
  BarChart,
  Notebook,
  Clock,
  Lightbulb,
  Cog,
  UserRoundCog,
  ChevronDown,
  ChevronRight,
  Folder,
  UserRound,
  UsersRound,
  Home,
  ClipboardList,
  BriefcaseBusiness,
  Search,
  ChartNoAxesCombined,
  Settings2,
  History,
  Building,
  Pin,
  Handshake,
  FolderArchive,
  IdCard,
  Brain,
  Send,
  GitCompare,
  CalendarCheck,
  Target,
  Trophy,
  Files,
  ClipboardPenLine,
  NotebookPen,
  Users
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
  const { open } = useSidebar()

  const items = [
    {
      title: "Home",
      url: "/dashboard",
      icon: Home,
    },
    {
      title: "My Profile",
      url: "/profile",
      icon: UserRound,
    },
    {
      title: "My Applications",
      url: "/my-applications",
      icon: ClipboardPenLine,
    },
    {
      title: "Careers",
      url: "/jobs",
      icon: NotebookPen,
    },
    /* {
      title: "Search Jobs",
      url: "/jobs",
      icon: Search,
    }, */
    {
      title: "Recruitment",
      url: "#",
      icon: BriefcaseBusiness,
      roles: ['HRIS_HR', 'HRIS_DC', 'HRIS_ADC'],
      submenu: [
        { title: 'Applicants', url: '/applicants', roles: ['HRIS_HR', 'HRIS_DC'], icon: Users },
        { title: 'Vacancies', url: '/vacancies', roles: ['HRIS_HR', 'HRIS_DC'], icon: ClipboardList },
        { title: 'Publications', url: '/publications', icon: Folder, roles: ['HRIS_HR'], icon: Pin },
        /* { title: 'Positions', url: '/vacancies', roles: ['HRIS_HR'], icon: IdCard },
        { title: 'Onboarding', url: '/publications', icon: Folder, roles: ['HRIS_HR'], icon: Handshake },
        { title: 'Offboarding', url: '/publications', icon: Folder, roles: ['HRIS_HR'], icon: FolderArchive }, */
      ],
    },
    /* {
      title: "Selection",
      url: "#",
      icon: BriefcaseBusiness,
      roles: ['HRIS_HR'],
      submenu: [
        { title: 'Positions', url: '/vacancies', roles: ['HRIS_HR'], icon: IdCard },
        { title: 'Vacancies', url: '/vacancies', roles: ['HRIS_HR'], icon: ClipboardList },
        { title: 'Publications', url: '/publications', icon: Folder, roles: ['HRIS_HR'], icon: Pin },
        { title: 'Onboarding', url: '/publications', icon: Folder, roles: ['HRIS_HR'], icon: Handshake },
        { title: 'Offboarding', url: '/publications', icon: Folder, roles: ['HRIS_HR'], icon: FolderArchive },
      ],
    },
    {
      title: "Placement",
      url: "#",
      icon: BriefcaseBusiness,
      roles: ['HRIS_HR'],
      submenu: [
        { title: 'Onboarding', url: '/publications', icon: Folder, roles: ['HRIS_HR'], icon: Handshake },
      ],
    },
    {
      title: "Personal Data Sheet",
      url: "#",
      icon: Notebook,
      roles: ['HRIS_Staff'],
      submenu: [
        { title: 'My PDS', url: '/my-pds', roles: ['HRIS_Staff'] },
        { title: 'Staff PDS', url: '/staff-pds', roles: ['HRIS_HR'] },
        { title: 'Staff 201', url: '/staff-201', roles: ['HRIS_HR'] },
      ],
    }, */
    {
      title: "Flexiplace",
      url: "#",
      icon: History,
      roles: ['HRIS_Staff'],
      submenu: [
        { title: 'Schedule', url: '/fwa/schedule', roles: ['HRIS_Staff'], icon: CalendarCheck },
        { title: 'RTO', url: '/rto', roles: ['HRIS_Staff'], icon: Target },
        { title: 'DTR', url: '/fwa', roles: ['HRIS_Staff'], icon: History },
        { title: 'RAA', url: '/raa', roles: ['HRIS_Staff'], icon: Trophy },
        { title: 'Reports', url: '/fwa/reports', roles: ['HRIS_HR'], icon: Files },
      ],
    },
    {
      title: "Competencies",
      url: "#",
      icon: Lightbulb,
      roles: ['HRIS_Staff'],
      submenu: [
        { title: 'Gap Analysis', url: '/cga', roles: ['HRIS_Staff'], icon: Brain },
        { title: 'Submissions', url: '/cga/review', roles: ['HRIS_HR', 'HRIS_DC'], icon: Send },
        /* { title: 'Comparisons', url: '/compare-cga', roles: ['HRIS_HR', 'HRIS_DC'], icon: GitCompare }, */
        { title: 'Libraries', url: '/cga/libraries', roles: ['HRIS_HR'], icon: Settings2 },
      ],
    },
    /* {
      title: "Performance",
      url: "#",
      icon: ChartNoAxesCombined,
      roles: ['HRIS_Staff'],
      submenu: [
        { title: 'OPCR', url: '/my-cga', roles: ['HRIS_Staff'], icon: Building },
        { title: 'DPCR', url: '/staff-cga', roles: ['HRIS_HR', 'HRIS_DC'], icon: UsersRound },
        { title: 'IPCR', url: '/review-cga', roles: ['HRIS_HR', 'HRIS_DC'], icon: UserRound },
        { title: 'Libraries', url: '/competencies', roles: ['HRIS_HR'], icon: Settings2 },
      ],
    }, */
    {
      title: "Settings",
      url: '/settings',
      icon: Cog,
      roles: ['HRIS_Staff']
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
      <SidebarContent className="bg-white">
        {open && <SidebarHeader className="font-bold pt-4 pl-2 text-lg text-center">DRO1 HRIS</SidebarHeader>}
        <SidebarGroup>
          <SidebarGroupLabel>Main Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items
                .filter(isVisible)
                .map((item) => {
                  const isActive = item.submenu?.some(subitem => url === subitem.url);
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
                          // 🔥 FIX: Make entire row clickable
                          <SidebarMenuButton asChild title={!open ? item.title : undefined}>
                            <Link
                              href={item.url}
                              className={`flex items-center gap-2 w-full rounded-md px-2 py-1.5 transition-colors
                              ${url === item.url 
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
                                .filter(isVisible)
                                .map((subitem) => (
                                  // 🔥 FIX: Make submenu row clickable
                                  <SidebarMenuButton
                                    key={subitem.title}
                                    asChild
                                    title={!open ? subitem.title : undefined}
                                    className={`font-medium ${url === subitem.url ? 'bg-muted' : ''}`}
                                  >
                                    <Link 
                                      href={subitem.url}
                                      className={`flex items-center gap-2 w-full rounded-md px-2 py-1.5 transition-colors
                                        ${url === subitem.url 
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
