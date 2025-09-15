import { useState, useEffect, useMemo } from 'react'
import PageTitle from "@/components/PageTitle"
import CurrentDesignation from "./CurrentDesignation"
import CurrentPosition from "./CurrentPosition"
import Designations from "./Designations"
import CareerPath from "./CareerPath"
import AllCompetencies from "./AllCompetencies"
import ProposedTrainings from "./ProposedTrainings"
import Submissions from "./Submissions"
import GapAnalysis from "./GapAnalysis"
import { store } from './store'
import SingleComboBox from "@/components/SingleComboBox"
import { usePage } from '@inertiajs/react'
import InputLabel from "@/components/InputLabel"
import { Button } from "@/components/ui/button"
import { Loader2, Send, AlertCircleIcon } from "lucide-react"
import { useLocalStorage } from "@/hooks/useLocalStorage"
import { useHasRole, useHasPermission } from "@/hooks/useAuth"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import { parse, format, isValid } from 'date-fns'

const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Competencies' },
    { label: 'My CGA', href: '/cga' },
]

const formatDate = (date) => date ? format(new Date(date), 'MMMM d, yyyy') : ''

const MyCga = () => {
    const {
      employee = {},
      auth: {
        user: {
          division
        } = {},
      } = {},
  } = usePage().props

  const [currentTab, setCurrentTab] = useLocalStorage('HRIS_CGA_tab', 'Current Position')
  const [isOpen, setIsOpen] = useState(false)

  const {
      employees,
      fetchEmployees,
      setSelectedStaff,
      selectedStaff,
      resetCompetencies,
      setSelectedDesignation,
      setSelectedCareerPath,
      setSelectedCompetency,
      setSelectedIndicator,
      setSelectedCompetencyData,
      setSelectedIndicatorData,
      setProposedTrainings,
      setSelectedSubmission,
      fetchSubmissionWindow,
      submissionWindow
  } = store()

  const menuItems = useMemo(() => {
    return [
      ...(selectedStaff?.designation ? ["Current Designation"] : []),
      "Current Position",
      "Designations",
      "Career Path",
      "All Competencies",
      "Trainings",
      "Submissions",
    ]
  }, [selectedStaff])

  const { is_allowed: isSubmissionWindowOpen, start_date, end_date } = submissionWindow || {}
  const canSubmit = useHasPermission('HRIS_cga.submit')
  const canViewOtherCga = useHasPermission('HRIS_cga.view-others')
  const isDivisionLevel = useHasRole(['HRIS_DC', 'HRIS_ADC'])

  useEffect(() => {
    fetchEmployees({
      filters: { 
        work_status: 'active',
        emp_type_id: 'Permanent', 
        ...(isDivisionLevel && { division_id: division })
      }
    })

    fetchSubmissionWindow()

    if (employee) {
      setSelectedStaff(employee)
    }
  }, [])

  useEffect(() => {
    setSelectedDesignation(null)
    setSelectedCareerPath(null)
    setSelectedCompetency({})
    setSelectedIndicator({})
    setSelectedCompetencyData({})
    setSelectedIndicatorData({})
    setProposedTrainings(null)
    setSelectedSubmission(null)

  }, [currentTab, selectedStaff])

  useEffect(() => {
    if (selectedStaff.designation) {
        setCurrentTab("Current Designation")
      } else {
        setCurrentTab("Current Position")
      }
  }, [selectedStaff])

  return (
    <div className="min-h-screen flex flex-col gap-4">
      <PageTitle 
        pageTitle="Competency Gap Analysis (CGA)" 
        description="Manage your competencies and CGA submissions" 
        breadcrumbItems={breadcrumbItems} 
      />

      <div className="flex flex-col gap-2">
        <div className="flex flex-col md:flex-row gap-4 min-h-screen">
          
          {/* Sidebar */}
          <div className="w-full md:w-[20%] flex flex-col gap-4">
            <div className="flex flex-col">
              {canViewOtherCga && (
                <div>
                  <InputLabel>Select staff:</InputLabel>
                  <SingleComboBox 
                    items={employees?.data ?? []}
                    onChange={(value) => {
                      const found = employees?.data?.find(emp => emp.value === value)
                      setSelectedStaff(found ?? null)
                    }}
                    value={selectedStaff?.value ?? ''}
                    placeholder="Choose staff"
                    name="staff"
                    id="staff"
                    className="w-full mb-4"
                  />
                </div>
              )}
              <h4 className="text-sm font-bold">Main Menu</h4>
              <div className="space-y-2 text-sm font-medium">
                {/* Mobile Dropdown */}
                <div className="md:hidden">
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
                <nav className="hidden md:flex flex-col gap-2 border rounded-lg p-2">
                  {menuItems.map((item) => (
                    <button
                      key={item}
                      onClick={() => setCurrentTab(item)}
                      className={`text-left px-4 py-2 rounded-md transition ${
                        currentTab === item
                          ? "bg-muted font-semibold"
                          : "hover:bg-gray-100"
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* <Alert className={`hidden lg:block ${isSubmissionWindowOpen ? 'border-green-500' : 'border-red-500'}`}>
              <AlertCircleIcon className="h-4 w-4" />
              
              <div className="flex flex-col gap-1">
                <AlertTitle className="text-sm">
                  {isSubmissionWindowOpen ? "Submission is still open!" : "Submission is now closed!"}
                </AlertTitle>

                <AlertDescription className="text-xs">
                  {isSubmissionWindowOpen
                    ? `You can still submit your competency gap analysis from ${formatDate(start_date)} to ${formatDate(end_date)}`
                    : `The submission window was open from ${formatDate(start_date)} to ${formatDate(end_date)}`}
                </AlertDescription>

              </div>

              {canSubmit && isSubmissionWindowOpen && (
                  <Button 
                    className="mt-2 w-full flex items-center gap-2"
                    onClick={() => setCurrentTab('Review')}
                  >
                    <Send className="size-4" />
                    <span>Review Submission</span>
                  </Button>
                )}
            </Alert> */}

            <Button 
              className="mt-2 w-full flex items-center gap-2"
              onClick={() => setCurrentTab('Review')}
            >
              <Send className="size-4" />
              <span>Review Submission</span>
            </Button>
          </div>

          {/* Main Content */}
          <div className="w-full md:w-[80%] p-4 border rounded-lg">
            {currentTab === 'Current Designation' && selectedStaff ? (
              <CurrentDesignation />
            ) : currentTab === 'Current Position' && selectedStaff ? (
              <CurrentPosition />
            ) : currentTab === 'Designations' && selectedStaff ? (
              <Designations />
            ) : currentTab === 'Career Path' && selectedStaff ? (
              <CareerPath />
            ) : currentTab === 'All Competencies' && selectedStaff ? (
              <AllCompetencies />
            ) : currentTab === 'Trainings' && selectedStaff ? (
              <ProposedTrainings />
            ) : currentTab === 'Submissions' && selectedStaff ? (
              <Submissions />
            ) : currentTab === 'Review' && selectedStaff ? (
              <GapAnalysis setCurrentTab={setCurrentTab} />
            ) : (
              <div className="text-sm text-muted-foreground">
                Please select a staff to view details.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default MyCga
