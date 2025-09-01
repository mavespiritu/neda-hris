import { Toaster } from "@/components/ui/toaster"
import { useState, useEffect } from 'react'

const LoginLayout = ({ children }) => {

  return (
      <main className="w-full flex flex-col">
        {children}
        <Toaster />
      </main>
      
  )
}

export default LoginLayout