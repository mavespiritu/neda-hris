import PageTitle from "@/components/PageTitle"
import { useState, useEffect } from 'react'
import { useHasRole } from '@/hooks/useAuth'
import Account from './Account'
import Organization from './Organization'
import Recruitment from './Recruitment'
import Competencies from './Competencies'
import { useLocalStorage } from "@/hooks/useLocalStorage"

const Settings = () => {
  // Page-level access (if needed)
  const canViewPage = useHasRole(['HRIS_Staff'])

  // Store current tab in localStorage
  const [currentTab, setCurrentTab] = useLocalStorage('HRIS_Settings_tab', 'Account')
  const [isOpen, setIsOpen] = useState(false) // for mobile dropdown

  // All menu items
  const menuItems = [
    'Account',
    'Organization',
    'Recruitment',
    'Competencies',
    'Notifications',
    'Signatories',
  ]

  // Define per-tab access
  const menuPermissions = {
    Account: ['HRIS_Staff'],
    Organization: ['HRIS_HR', 'HRIS_Administrator'],
    Recruitment: ['HRIS_HR', 'HRIS_Administrator'],
    Competencies: ['HRIS_HR', 'HRIS_Administrator'],
    Notifications: ['HRIS_HR', 'HRIS_Administrator'],
    Signatories: ['HRIS_Administrator'],
  }

  // Filter menu items based on user roles
  const accessibleMenuItems = menuItems.filter(item =>
    useHasRole(menuPermissions[item] || [])
  )

  // If user has no access to current tab, switch to the first accessible one
  useEffect(() => {
    if (!accessibleMenuItems.includes(currentTab)) {
      setCurrentTab(accessibleMenuItems[0] || null)
    }
  }, [accessibleMenuItems, currentTab, setCurrentTab])

  // If user has no access to the page at all
  if (!canViewPage || accessibleMenuItems.length === 0) {
    return (
      <p className="font-semibold flex justify-center items-center h-full">
        You do not have permission to view this page.
      </p>
    )
  }

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Settings', href: '/settings' },
  ]

  // Map tabs to their components
  const tabComponents = {
    Account: <Account />,
    Organization: <Organization />,
    Recruitment: <Recruitment />,
    Competencies: <Competencies />,
    Notifications: (
      <div className="p-4 border rounded">Notifications settings go here.</div>
    ),
    Signatories: (
      <div className="p-4 border rounded">Signatories settings go here.</div>
    ),
  }

  return (
    <div className="min-h-screen flex flex-col gap-4">
      <PageTitle
        pageTitle="Settings"
        description="Manage your account settings and preferences"
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
                  {accessibleMenuItems.map((item) => (
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
              {accessibleMenuItems.map((item) => (
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
