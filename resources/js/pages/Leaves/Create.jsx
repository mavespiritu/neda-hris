import PageTitle from "@/components/PageTitle"
import { useState } from "react"
import { Head } from "@inertiajs/react"
import { useLocalStorage } from "@/hooks/useLocalStorage"

const breadcrumbItems = [
  { label: "Home", href: "/" },
  { label: "Leaves" },
  { label: "New Filing", href: route("leaves.create") },
]

const Create = () => {
  const [currentTab, setCurrentTab] = useLocalStorage("VL/SL")
  const [isOpen, setIsOpen] = useState(false)

  const menuItems = ["VL/SL", "SPL"]

  return (
    <div className="h-full flex flex-col">
      <Head title="Leaves" />
      <PageTitle
        pageTitle="New Leave Application"
        description="File your leave application here."
        breadcrumbItems={breadcrumbItems}
      />

      {/* Mobile Dropdown (kept) */}
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

      {/* Horizontal Tabs (desktop + works on larger screens) */}
      <div className="hidden md:block border-b mb-6">
        <nav className="flex gap-2 overflow-x-auto">
          {menuItems.map((item) => (
            <button
              key={item}
              onClick={() => setCurrentTab(item)}
              className={`px-4 py-2 text-sm whitespace-nowrap border-b-2 transition ${
                currentTab === item
                  ? "border-primary text-primary font-semibold"
                  : "border-transparent text-muted-foreground hover:text-primary hover:border-muted"
              }`}
            >
              {item}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="flex-1">
        {/* Example placeholders */}
        {currentTab === "VL/SL" && (
          <div className="rounded-lg border p-4">
            <div className="font-medium mb-2">VL/SL Form</div>
            <div className="text-sm text-muted-foreground">
              Put your Vacation Leave / Sick Leave filing form here.
            </div>
          </div>
        )}

        {currentTab === "SPL" && (
          <div className="rounded-lg border p-4">
            <div className="font-medium mb-2">SPL Form</div>
            <div className="text-sm text-muted-foreground">
              Put your Special Privilege Leave filing form here.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Create
