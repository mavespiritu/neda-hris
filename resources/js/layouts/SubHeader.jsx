import React, { useState } from "react"
import { Link, usePage } from "@inertiajs/react"
import { Menu, Home, User, Search, Folder } from "lucide-react"

const SubHeader = () => {
  const [isOpen, setIsOpen] = useState(false)
  const { url } = usePage() // get current path

  const menuItems = [
    { name: "My Applications", href: route("my-applications.index"), icon: Home },
    { name: "My Profile", href: route("applicant.index"), icon: User },
    { name: "Search Jobs", href: route("jobs.index"), icon: Search },
  ]

  const isActive = (href) => {
    const hrefPath = new URL(href, window.location.origin).pathname
    return url.startsWith(hrefPath)
  }

  return (
    <div className="h-12 border-b px-4 sm:px-8 md:px-16 lg:px-32 flex items-center gap-8 
      sticky top-16 z-40 bg-white">
      
      {/* Desktop menu */}
      <div className="hidden md:flex gap-8 h-full">
        {menuItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-2 text-sm font-medium transition h-full px-1
                ${active 
                  ? "text-blue-600 font-semibold border-b-2 border-blue-600" 
                  : "hover:text-blue-600 border-b-2 border-transparent"
                }`}
            >
              <Icon className={`w-4 h-4 ${active ? "text-blue-600" : ""}`} />
              {item.name}
            </Link>
          )
        })}
      </div>

      {/* Mobile menu toggle */}
      <button
        className="md:hidden p-2"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Mobile dropdown */}
      {isOpen && (
        <div className="absolute top-10 left-0 w-full bg-white border-b shadow-md md:hidden z-50">
          <div className="flex flex-col p-4 gap-4">
            {menuItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-2 text-sm font-medium whitespace-nowrap
                    ${active ? "text-blue-600 font-semibold" : "hover:text-blue-600"}`}
                >
                  <Icon className={`w-4 h-4 ${active ? "text-blue-600" : ""}`} />
                  {item.name}
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default SubHeader
