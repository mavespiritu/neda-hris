import PageTitle from "@/components/PageTitle"
import { useEffect, useState } from "react"
import { Head } from "@inertiajs/react"
import { useHasRole } from "@/hooks/useAuth"
import { useLocalStorage } from "@/hooks/useLocalStorage"
import Programs from "./Programs"
import MFOs from "./MFOs"
import PPAs from "./PPAs"
import SuccessIndicators from "./SuccessIndicators"

const breadcrumbItems = [
  { label: "Home", href: "/" },
  { label: "Performance" },
  { label: "Libraries", href: route("performance.libraries") },
]

const menuItems = ["Programs", "MFOs", "Success Indicators", "PAPs / Activities"]

export default function Libraries() {
  const canViewPage = useHasRole(["HRIS_HR", "HRIS_Administrator"])
  const [currentTab, setCurrentTab] = useLocalStorage("HRIS_Performance_Libraries_tab", "Programs")
  const [isOpen, setIsOpen] = useState(false)
  const activeTab = currentTab === "PPAs" ? "PAPs / Activities" : currentTab

  useEffect(() => {
    if (currentTab === "PPAs") {
      setCurrentTab("PAPs / Activities")
    }
  }, [currentTab, setCurrentTab])

  if (!canViewPage) {
    return (
      <p className="flex h-full items-center justify-center font-semibold">
        You do not have permission to view this page.
      </p>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <Head title="Libraries" />

      <PageTitle
        pageTitle="Libraries"
        description="Manage the reference tables for performance management here."
        breadcrumbItems={breadcrumbItems}
      />

      <div className="flex flex-col gap-8 md:flex-row">
        <div className="w-full py-4 md:w-[20%]">
          <div className="space-y-2 text-sm font-medium">
            <div className="mb-4 md:hidden">
              <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full rounded-md border bg-white px-4 py-2 text-left shadow-sm"
              >
                {activeTab || "Select Menu"}
              </button>
              {isOpen && (
                <div className="mt-2 rounded-md border bg-white shadow-sm">
                  {menuItems.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => {
                        setCurrentTab(item)
                        setIsOpen(false)
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-muted"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <nav className="hidden flex-col gap-2 md:flex">
              {menuItems.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setCurrentTab(item)}
                  className={`rounded-md px-4 py-2 text-left transition ${
                    activeTab === item ? "bg-muted font-semibold" : "hover:bg-muted"
                  }`}
                >
                  {item}
                </button>
              ))}
            </nav>
          </div>
        </div>

        <div className="flex-1 pb-6">
          {activeTab === "Programs" && <Programs />}
          {activeTab === "MFOs" && <MFOs />}
          {activeTab === "Success Indicators" && <SuccessIndicators />}
          {activeTab === "PAPs / Activities" && <PPAs />}
        </div>
      </div>
    </div>
  )
}


