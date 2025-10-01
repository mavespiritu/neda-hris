import PageTitle from "@/components/PageTitle"
import Pds from "./Pds"
import { useState } from 'react'
import { useHasRole } from '@/hooks/useAuth'
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Link, usePage } from '@inertiajs/react'
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
    BriefcaseBusiness
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const MyProfile = () => {

  /* const canViewPage = useHasRole(['HRIS_HR', 'HRIS_Administrator'])

  if (!canViewPage) {
    return <p className="font-semibold flex justify-center items-center h-full">You do not have permission to view this page.</p>
  } */

  const breadcrumbItems = [
    { label: 'My Profile', href: '/' },
  ]

  const tabs = [
    { value: "pds", label: "Personal Data Sheet", icon: UserPen },
    { value: "requirements", label: "Requirements", icon: BriefcaseBusiness },
  ]

  const [activeTab, setActiveTab] = useState("pds")

  const { url } = usePage()
  const params = new URLSearchParams(url.split("?")[1])
  const redirect = params.get("redirect")

  return (
    <div className="flex flex-col gap-4">
      <PageTitle pageTitle="My Profile" description="Make sure your personal data sheet is updated before submitting an application." />
      <Pds redirect={redirect}/>
    </div>
  )
}

export default MyProfile