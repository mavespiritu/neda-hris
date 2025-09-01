import PageTitle from "@/components/PageTitle"
import { useState } from 'react'
import { useHasRole } from '@/hooks/useAuth'
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Link } from '@inertiajs/react'
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
  } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { 
  House, 
  UserPen, 
  Folder, 
  ChevronDown,
  AlertCircleIcon 
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Home from "./Home"
import MyProfile from "./MyProfile"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"

const Dashboard = () => {

  /* const canViewPage = useHasRole(['HRIS_HR', 'HRIS_Administrator'])

  if (!canViewPage) {
    return <p className="font-semibold flex justify-center items-center h-full">You do not have permission to view this page.</p>
  } */

  const breadcrumbItems = [
    { label: 'Dashboard', href: '/' },
  ]

  const tabs = [
    { value: "home", label: "My Applications", icon: House },
    { value: "profile", label: "My Profile", icon: UserPen },
    { value: "requirements", label: "Requirements", icon: Folder },
  ]

  const [activeTab, setActiveTab] = useState("home")

  return (
    <div className="flex flex-col gap-4">
      <PageTitle pageTitle="Home" description="Welcome to the DEPDev RO1 Human Resource Information System (HRIS)" />
      <Alert className="hidden lg:block">
        <AlertCircleIcon className="h-4 w-4" />
        <AlertTitle>Important Notes!</AlertTitle>
        <AlertDescription>
          Before submitting an application, make sure your <span className="font-medium">Personal Data Sheet</span> is updated. Click <span className="text-blue-500 font-semibold"><Link href="/my-profile">here</Link></span> to update.
        </AlertDescription>
      </Alert>
      <div className="md:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-full flex justify-between items-center">
            {(() => {
              const tabValue = tabs.find(tab => tab.value === activeTab)
              return (
                <div className="flex items-center">
                  {tabValue?.icon && <span className="mr-2"><tabValue.icon className="h-4 w-4" /></span>}
                  <span>{tabValue?.label}</span>
                </div>
              )
            })()}
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-full">
            {tabs.map((tab) => (
              <DropdownMenuItem key={tab.value} onSelect={() => setActiveTab(tab.value)} >
                <tab.icon className="mr-2 h-4 w-4" />
                {tab.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <Home />
    </div>
  )
}

export default Dashboard