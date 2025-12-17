import Header from './Header'
import SubHeader from './SubHeader'
import { Toaster } from "@/components/ui/toaster"
import { SidebarProvider } from "@/components/ui/sidebar"
import AppSidebar from "@/layouts/AppSidebar"
import { useState, useEffect } from 'react'
import { usePage } from '@inertiajs/react'

const AuthenticatedLayout = ({ children }) => {
  const { auth } = usePage().props
  const user = auth?.user
  
  const [open, setOpen] = useState(() => {
    const savedState = localStorage.getItem('HRIS_sidebarOpen')
    return savedState ? JSON.parse(savedState) : true
  })

  useEffect(() => {
    localStorage.setItem('HRIS_sidebarOpen', JSON.stringify(open))
  }, [open])

  return (
    <SidebarProvider
      open={open}
      onOpenChange={setOpen}
      style={{
        "--sidebar-width": "15rem",
        "--sidebar-width-mobile": "15rem",
      }}
    >
      {/* ✅ only render sidebar if ipms_id exists */}
      {user?.ipms_id && <AppSidebar />}

      <main className="w-full flex flex-col min-h-screen">
        <Header />
        {!user?.ipms_id && user?.email_verified_at && <SubHeader />}
        <div
          className={`flex flex-1 flex-col pt-4 pb-8 ${
            user?.ipms_id
              ? "px-4 sm:px-6 md:px-8"  
              : "px-4 sm:px-8 md:px-16 lg:px-32"
          }`}
        >
          {children}
        </div>
      </main>

      <Toaster />
    </SidebarProvider>
  )
}

export default AuthenticatedLayout
