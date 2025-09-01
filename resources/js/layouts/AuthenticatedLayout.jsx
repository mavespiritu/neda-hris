import Header from './Header'
import { Toaster } from "@/components/ui/toaster"
import { SidebarProvider , SidebarTrigger } from "@/components/ui/sidebar"
import AppSidebar from "@/layouts/AppSidebar"
import { useState, useEffect } from 'react'

const AuthenticatedLayout = ({ children }) => {

  const [open, setOpen] = useState(() => {
    const savedState = localStorage.getItem('HRIS_sidebarOpen')
    return savedState ? JSON.parse(savedState) : true
  })

  useEffect(() => {
    localStorage.setItem('HRIS_sidebarOpen', JSON.stringify(open))
  }, [open])

  return (
    <SidebarProvider open={open} onOpenChange={setOpen} style={{
      "--sidebar-width": "15rem",
      "--sidebar-width-mobile": "15rem",
    }}>
      <AppSidebar />
      <main className="w-full flex flex-col min-h-full">
        <Header />
        <div className="flex flex-1 flex-col pt-4 px-8 pb-8">
          {children}
        </div>
      </main>
      <Toaster />
    </SidebarProvider>
  )
}

export default AuthenticatedLayout
