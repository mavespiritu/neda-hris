import React from 'react'
import Header from './Header'
import { Toaster } from "@/Components/ui/toaster"
import { SidebarProvider , SidebarTrigger } from "@/Components/ui/sidebar"
import AppSidebar from "@/Layouts/AppSidebar"

const AuthenticatedLayout = ({ children }) => {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="px-4 py-2 w-full flex flex-col gap-4">
        <Header />
        {children}
      </main>
      <Toaster />
    </SidebarProvider>
  )
}

export default AuthenticatedLayout