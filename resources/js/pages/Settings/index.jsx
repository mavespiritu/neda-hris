import PageTitle from "@/components/PageTitle"
import { useState, useEffect, useMemo } from "react"
import { useHasRole } from "@/hooks/useAuth"
import Account from "./Account"
import Organization from "./Organization"
import Recruitment from "./Recruitment"
import Competencies from "./Competencies"
import TravelOrders from "./TravelOrders"
import Groups from "./Groups"
import { useLocalStorage } from "@/hooks/useLocalStorage"
import { cn } from "@/lib/utils.jsx"

const Settings = () => {
  /* -------------------- ROLE CHECKS (TOP LEVEL ONLY) -------------------- */
  const canViewPage = useHasRole(["HRIS_Staff"])

  const canAccount = useHasRole(["HRIS_Staff"])
  const canOrganization = useHasRole(["HRIS_HR", "HRIS_Administrator"])
  const canRecruitment = useHasRole(["HRIS_HR", "HRIS_Administrator"])
  const canCompetencies = useHasRole(["HRIS_HR", "HRIS_Administrator"])
  const canGroups = useHasRole(["HRIS_HR", "HRIS_Administrator"])
  const canTravelOrders = useHasRole(["HRIS_PRU", "HRIS_Administrator"])
  const canNotifications = useHasRole(["HRIS_HR", "HRIS_Administrator"])
  const canSignatories = useHasRole(["HRIS_Administrator"])

  /* -------------------- STATE -------------------- */
  const [currentTab, setCurrentTab] = useLocalStorage("HRIS_Settings_tab", "Account")
  const [isOpen, setIsOpen] = useState(false)

  /* -------------------- MENU CONFIG -------------------- */
  const menuItems = useMemo(
    () => [
      { key: "Account", label: "Account", allowed: canAccount },
      { key: "Organization", label: "Organization", allowed: canOrganization },
      { key: "Recruitment", label: "Recruitment", allowed: canRecruitment },
      { key: "Competencies", label: "Competencies", allowed: canCompetencies },
      { key: "Groups", label: "Groups", allowed: canGroups },
      { key: "TravelOrders", label: "Travels", allowed: canTravelOrders },
      { key: "Notifications", label: "Notifications", allowed: canNotifications },
      { key: "Signatories", label: "Signatories", allowed: canSignatories },
    ],
    [
      canAccount,
      canOrganization,
      canRecruitment,
      canCompetencies,
      canGroups,
      canTravelOrders,
      canNotifications,
      canSignatories,
    ]
  )

  /* -------------------- FILTER ACCESSIBLE TABS -------------------- */
  const accessibleMenuItems = useMemo(
    () => menuItems.filter((item) => item.allowed),
    [menuItems]
  )

  /* -------------------- ENSURE VALID CURRENT TAB -------------------- */
  useEffect(() => {
    const allowedKeys = accessibleMenuItems.map((i) => i.key)
    if (!allowedKeys.includes(currentTab)) {
      setCurrentTab(allowedKeys[0] || null)
    }
  }, [accessibleMenuItems, currentTab, setCurrentTab])

  /* -------------------- PAGE GUARD -------------------- */
  if (!canViewPage || accessibleMenuItems.length === 0) {
    return (
      <p className="font-semibold flex justify-center items-center h-full">
        You do not have permission to view this page.
      </p>
    )
  }

  /* -------------------- UI -------------------- */
  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Settings", href: "/settings" },
  ]

  const tabComponents = {
    Account: <Account />,
    Organization: <Organization />,
    Recruitment: <Recruitment />,
    Competencies: <Competencies />,
    Groups: <Groups />,
    TravelOrders: <TravelOrders />,
    Notifications: <div className="p-4 border rounded">Notifications settings go here.</div>,
    Signatories: <div className="p-4 border rounded">Signatories settings go here.</div>,
  }

  const currentTabLabel =
    accessibleMenuItems.find((i) => i.key === currentTab)?.label || "Select Menu"

  return (
    <div className="min-h-screen flex flex-col gap-4">
      <PageTitle
        pageTitle="Settings"
        description="Manage your account settings and preferences"
        breadcrumbItems={breadcrumbItems}
      />

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <div className="w-full md:w-[20%] py-4">
          <div className="space-y-2 text-sm font-medium">
            {/* Mobile Dropdown */}
            <div className="md:hidden mb-4">
              <button
                onClick={() => setIsOpen((v) => !v)}
                className="w-full px-4 py-2 border rounded-md text-left bg-white shadow-sm"
              >
                {currentTabLabel}
              </button>

              {isOpen && (
                <div className="mt-2 border rounded-md bg-white shadow-sm">
                  {accessibleMenuItems.map((item) => (
                    <button
                      key={item.key}
                      onClick={() => {
                        setCurrentTab(item.key)
                        setIsOpen(false)
                      }}
                      className={cn(
                        "w-full text-left px-4 py-2 hover:bg-gray-100",
                        currentTab === item.key && "bg-muted font-semibold"
                      )}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex flex-col gap-2">
              {accessibleMenuItems.map((item) => (
                <button
                  key={item.key}
                  onClick={() => setCurrentTab(item.key)}
                  className={cn(
                    "text-left px-4 py-2 rounded-md transition",
                    currentTab === item.key ? "bg-muted font-semibold" : "hover:bg-muted"
                  )}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          {tabComponents[currentTab] || (
            <p className="p-4 font-semibold text-center">
              You do not have permission to view this section.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default Settings
