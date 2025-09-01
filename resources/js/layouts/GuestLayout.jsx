import GuestHeader from './GuestHeader'
import { Toaster } from "@/components/ui/toaster"

const GuestLayout = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <GuestHeader />
      <main className="flex flex-1 flex-col px-4 md:px-8 lg:px-16 xl:px-32 py-8">
        {children}
      </main>
      <Toaster />
    </div>
  )
}

export default GuestLayout
