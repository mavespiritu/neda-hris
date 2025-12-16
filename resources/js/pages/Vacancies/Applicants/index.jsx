import { useEffect, useState } from "react"
import { usePage } from "@inertiajs/react"
import { Loader2, Mail, Phone, Calendar, Search } from "lucide-react"
import PageTitle from "@/components/PageTitle"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { formatDateWithTime, formatFullName } from "@/lib/utils.jsx"
import { store } from "./store"
import { Button } from "@/components/ui/button"
import Profile from "./Profile"
import Documents from "./Documents"
import AssessApplicantForm from "./AssessApplicantForm"

const Applicants = () => {
  const { vacancy } = usePage().props
  const { applicants, fetchApplicants } = store()
  const [search, setSearch] = useState("")
  const [activeApplicantId, setActiveApplicantId] = useState(null)
  const [loadingApplicantId, setLoadingApplicantId] = useState(null)
  const [selectedApplicant, setSelectedApplicant] = useState(null)
  const [isAssessDialogOpen, setIsAssessDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("profile")

  const handleSearch = () => {
    fetchApplicants(vacancy.id, { search })
  }

  useEffect(() => {
    fetchApplicants(vacancy.id)
  }, [])

  const handleAccordionChange = (val) => {
    if (val) {
      const id = parseInt(val.replace("applicant-", ""))
      setActiveApplicantId(id)
      setLoadingApplicantId(id)

      // Automatically clear the loader after a small delay
      setTimeout(() => setLoadingApplicantId(null), 400)
    } else {
      setActiveApplicantId(null)
      setLoadingApplicantId(null)
    }
  }

  return (
    <div className="flex flex-col h-full gap-4">
      <PageTitle
        pageTitle="Applicants"
        description="View applicants' information for this vacancy."
      />

      {/* 🔍 Search Bar */}
      {/* <div className="flex items-center gap-2 w-full max-w-md">
        <Input
          placeholder="Search applicant by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <Button onClick={handleSearch} className="gap-2">
          <Search className="h-4 w-4" /> Search
        </Button>
      </div> */}

      <div className="flex flex-col md:flex-row w-full gap-4 h-full">
        {/* 30% column */}
        <div className="md:w-[30%] w-full">
          {!applicants.data?.data?.length ? (
            <div className="flex items-center justify-center min-h-full text-sm text-gray-500">
              No applicants found.
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">

              {/* Table Header */}
              <div className="grid grid-cols-[1fr_auto] bg-gray-100 px-4 py-2 text-xs font-semibold text-gray-600">
                <span>Name</span>
                <span>Status</span>
              </div>

              {/* Table Rows */}
              <div className="divide-y">
                {applicants.data.data.map((applicant, idx) => (
                  <div
                    key={applicant.id}
                    className={`grid grid-cols-[1fr_auto] px-4 py-3 text-sm cursor-pointer
                      ${selectedApplicant?.id === applicant.id ? "bg-gray-100" : "hover:bg-gray-50"}
                    `}
                    onClick={() => {
                      setSelectedApplicant(applicant)
                      setActiveTab("profile")
                    }}
                  >
                    <span className="truncate font-medium">
                      {idx + 1}. {formatFullName(applicant.name)}
                    </span>

                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      For Assessment
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        {/* 70% column */}
        <div className="md:w-[70%] w-full border rounded-lg p-4">
          {!selectedApplicant ? (
            <div className="flex items-center justify-center h-full text-sm text-gray-500">
              Select an applicant to view details
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="mb-4 space-y-2">
                <h2 className="text-lg font-semibold">
                  {formatFullName(selectedApplicant.name)}
                </h2>

                <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {selectedApplicant.email_address || "No email"}
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {selectedApplicant.mobile_no || "No mobile number"}
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Submitted on {formatDateWithTime(selectedApplicant.date_submitted)}
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="border-b mb-4 flex gap-4">
                <button
                  className={`pb-2 text-sm font-medium border-b-2
                    ${activeTab === "profile"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground"}
                  `}
                  onClick={() => setActiveTab("profile")}
                >
                  Profile
                </button>

                <button
                  className={`pb-2 text-sm font-medium border-b-2
                    ${activeTab === "documents"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground"}
                  `}
                  onClick={() => setActiveTab("documents")}
                >
                  Documents
                </button>
              </div>

              {/* Tab Content */}
              <div className="space-y-8">
                {activeTab === "profile" && (
                  <Profile applicantId={selectedApplicant.id} />
                )}

                {activeTab === "documents" && (
                  <Documents applicantId={selectedApplicant.id} />
                )}
              </div>

              <div className="mt-6">
                <Button
                  onClick={() => setIsAssessDialogOpen(true)}
                >
                  Assess Applicant
                </Button>
              </div>
            </>
          )}
        </div>

      </div>

      {/* <div className="flex flex-1 flex-col min-h-0">
        {applicants.isLoading && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
            <Loader2 className="h-6 w-6 animate-spin text-white" />
          </div>
        )}

        {!applicants.data?.data?.length ? (
          <div className="flex flex-1 items-center justify-center text-gray-500 text-sm min-h-[200px]">
            No applicants found.
          </div>
        ) : (
          <Accordion
            type="single"
            collapsible
            className="w-full space-y-2"
            value={activeApplicantId ? `applicant-${activeApplicantId}` : undefined}
            onValueChange={handleAccordionChange}
          >
            {applicants.data.data.map((applicant, idx) => (
              <AccordionItem
                key={applicant.id}
                value={`applicant-${applicant.id}`}
                className="border rounded-lg"
              >
                <AccordionTrigger className="flex justify-between px-4 py-3 font-semibold text-left">
                  <div>
                    <span className="text-base">
                      {idx + 1}. {formatFullName(applicant.name)}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    For Assessment
                  </div>
                </AccordionTrigger>

                <AccordionContent>
                  <Card className="border-none shadow-none">
                    <CardContent className="p-4 flex flex-col gap-4">
                      {loadingApplicantId === applicant.id ? (
                        <div className="flex justify-center items-center py-2 text-gray-500">
                          <Loader2 className="h-6 w-6 animate-spin" />
                          <span className="ml-2 text-sm">Loading applicant details...</span>
                        </div>
                      ) : (
                        <>
                          <div className="space-y-2 mb-4">
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="h-4 w-4 text-gray-500" />
                              <span>{applicant.email_address || "No email"}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="h-4 w-4 text-gray-500" />
                              <span>{applicant.mobile_no || "No mobile number"}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="h-4 w-4 text-gray-500" />
                              <span>Submitted on {formatDateWithTime(applicant.date_submitted)}</span>
                            </div>
                          </div>

                          <div className="flex flex-col gap-4">
                            <div className="space-y-2">
                              <h2 className="font-semibold text-base">Applicant's Profile</h2>
                              <Profile applicantId={applicant.id} />
                            </div>
                            <div className="space-y-2">
                              <h2 className="font-semibold text-base">Applicant's Documents</h2>
                              <Documents applicantId={applicant.id} />
                            </div>
                          </div>
                          <Button
                            onClick={() => {
                              setSelectedApplicant(applicant)
                              setIsAssessDialogOpen(true)
                            }}
                          >
                            Assess Applicant # {idx + 1}
                          </Button>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div> */}

      <AssessApplicantForm
        open={isAssessDialogOpen}
        onClose={() => setIsAssessDialogOpen(false)}
        applicant={selectedApplicant}
        vacancy={vacancy}
      />
    </div>
  )
}

export default Applicants
