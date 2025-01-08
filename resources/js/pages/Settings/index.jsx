import PageTitle from "@/components/PageTitle"
import { useState } from 'react'
import { useHasRole } from '@/hooks/useAuth'
import { useToast } from "@/hooks/use-toast"
import Competencies from './Competencies'


const Settings = () => {

  const canViewPage = useHasRole(['HRIS_HR', 'HRIS_Administrator'])

  if (!canViewPage) {
    return <p className="font-semibold flex justify-center items-center h-full">You do not have permission to view this page.</p>
  }

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Settings', href: '/settings' },
  ]

  const [activeTab, setActiveTab] = useState('')

  return (
    <div className="min-h-screen flex flex-col gap-4">
      <PageTitle pageTitle="Settings" description="Manage your account settings and preferences" breadcrumbItems={breadcrumbItems} />
      <div className="flex gap-8">
        <div className="w-1/4">
          <div className="text-sm font-semibold flex flex-col">
            <span onClick={() => setActiveTab('Account')} className={`cursor-pointer p-2 ${
                activeTab === 'Account' ? 'border-l-4 font-bold bg-muted rounded' : ''
              }`}>Account Settings</span>
            <span onClick={() => setActiveTab('Competencies')} className={`cursor-pointer p-2 ${
                activeTab === 'Competencies' ? 'border-l-4 font-bold bg-muted rounded' : ''
              }`}>Competencies</span>
            <span onClick={() => setActiveTab('Notification')} className={`cursor-pointer p-2 ${
                activeTab === 'Notification' ? 'border-l-4 font-bold bg-muted rounded' : ''
              }`}>Notifications</span>
            <span onClick={() => setActiveTab('Signatories')} className={`cursor-pointer p-2 ${
                activeTab === 'Signatories' ? 'border-l-4 font-bold bg-muted rounded' : ''
              }`}>Signatories</span>
          </div>
        </div>
        <div className="flex-1">
          {activeTab === 'Competencies' && <Competencies />}
        </div>
      </div>
    </div>
  )
}

export default Settings