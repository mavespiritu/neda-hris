import PageTitle from "@/components/PageTitle"
import { useState, useEffect } from "react"
import { useHasRole } from "@/hooks/useAuth"
import { Head, usePage, useForm } from "@inertiajs/react"
import { useLocalStorage } from "@/hooks/useLocalStorage"
import TimeRecords from './TimeRecords'

const breadcrumbItems = [
  { label: "Home", href: "/" },
  { label: "Flexiplace" },
  { label: "Reports", href: "/fwa/reports" },
]

const Report = () => {
  const canViewPage = useHasRole(['HRIS_HR', 'HRIS_Administrator'])

  if (!canViewPage) {
    return (
      <p className="font-semibold flex justify-center items-center h-full">
        You do not have permission to view this page.
      </p>
    )
  }

  const [currentTab, setCurrentTab] = useLocalStorage('HRIS_Flexiplace_Reports_tab', 'Time Records')
  const [isOpen, setIsOpen] = useState(false)

  const menuItems = [
    'Time Records',
  ]
  
  return (
    <div className="h-full flex flex-col">
      <Head title="Flexiplace Reports" />
      <PageTitle
        pageTitle="Flexiplace Reports"
        description="Browse reports related to flexiplace arrangement"
        breadcrumbItems={breadcrumbItems}
      />
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-[20%] py-4">
          <div className="space-y-2 text-sm font-medium">
            {/* Mobile Dropdown */}
            <div className="md:hidden mb-4">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-4 py-2 border rounded-md text-left bg-white shadow-sm"
              >
                {currentTab || "Select Menu"}
              </button>
              {isOpen && (
                <div className="mt-2 border rounded-md bg-white shadow-sm">
                  {menuItems.map((item) => (
                    <button
                      key={item}
                      onClick={() => {
                        setCurrentTab(item)
                        setIsOpen(false)
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Desktop Sidebar Nav */}
            <nav className="hidden md:flex flex-col gap-2">
              {menuItems.map((item) => (
                <button
                  key={item}
                  onClick={() => setCurrentTab(item)}
                  className={`text-left px-4 py-2 rounded-md transition ${
                    currentTab === item
                      ? "bg-muted font-semibold"
                      : "hover:bg-muted"
                  }`}
                >
                  {item}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1">
          {currentTab === 'Time Records' && <TimeRecords />}
        </div>
      </div>
    </div>
  )
}

export default Report