import GuestHeader from './GuestHeader'
import { Toaster } from "@/components/ui/toaster"

const GuestLayout = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <GuestHeader />

      {/* Banner Section */}
      {/* <div className="hidden md:flex justify-center items-center gap-4 px-4 md:px-8 lg:px-16 xl:px-32 mt-4 flex-wrap">
        <img
          src="/images/logo.png"
          alt="DEPDev Logo"
          className="w-20 md:w-28 h-auto object-contain"
        />
        <img
          src="/images/bp_logo.png"
          alt="BP Logo"
          className="w-20 md:w-28 h-auto object-contain"
        />
        <img
          src="/images/dro1_banner.png"
          alt="DRO1 Banner"
          className="w-full md:w-2/3 lg:w-1/2 h-auto object-contain rounded-lg shadow-sm"
        />
      </div> */}

      {/* Main Content */}
      <main>
        {children}
      </main>

      {/* Toast notifications */}
      <Toaster />
    </div>
  )
}

export default GuestLayout
