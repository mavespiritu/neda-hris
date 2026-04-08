import { Head, router } from "@inertiajs/react"
import { useEffect, useMemo, useState } from "react"
import { CalendarRange, PanelRightOpen } from "lucide-react"
import PageTitle from "@/components/PageTitle"
import { YearPicker } from "@/components/YearPicker"
import { formatDate } from "@/lib/utils.jsx"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import Pnc from "./Pnc"
import Mnc from "./Mnc"
import Rne from "./Rne"
import useOpcrLookups from "./hooks/useOpcrLookups"

const currentYear = new Date().getFullYear()

const formatFrequency = (value) => (value === "semestral" ? "Semestral" : "Yearly")
const formatSemester = (semester) => (Number(semester) === 2 ? "2nd Semester" : "1st Semester")

export default function Index({
  records = [],
  selectedRecord = null,
  selectedYear: selectedYearFromServer = null,
  selectedSemester: selectedSemesterFromServer = null,
  frequency = "yearly",
  libraryOptions = {},
  categories = [],
  canManage = false,
}) {
  const isSemestral = frequency === "semestral"
  const [selectedYear, setSelectedYear] = useState(Number(selectedYearFromServer || currentYear))
  const [selectedSemester, setSelectedSemester] = useState(Number(selectedSemesterFromServer || 1))
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("pnc")
  const { employeeMap } = useOpcrLookups()

  useEffect(() => {
    if (selectedYearFromServer) {
      setSelectedYear(Number(selectedYearFromServer))
    }
  }, [selectedYearFromServer])

  useEffect(() => {
    if (selectedSemesterFromServer) {
      setSelectedSemester(Number(selectedSemesterFromServer))
    } else if (!isSemestral) {
      setSelectedSemester(1)
    }
  }, [isSemestral, selectedSemesterFromServer])

  const periodLabel = useMemo(() => {
    return isSemestral ? `${formatSemester(selectedSemester)} ${selectedYear}` : `${selectedYear}`
  }, [isSemestral, selectedSemester, selectedYear])

  const visitPeriod = (year, semester = selectedSemester) => {
    const params = { year: String(year) }

    if (isSemestral) {
      params.semester = String(semester)
    }

    router.get(route("opcrs.index", params), {}, {
      preserveScroll: true,
      preserveState: true,
      replace: true,
    })
  }

  const handleYearChange = (year) => {
    const nextYear = Number.isFinite(Number(year)) ? Number(year) : currentYear
    setSelectedYear(nextYear)
    visitPeriod(nextYear, selectedSemester)
  }

  const handleSemesterChange = (semester) => {
    const nextSemester = Number.isFinite(Number(semester)) ? Number(semester) : 1
    setSelectedSemester(nextSemester)
    visitPeriod(selectedYear, nextSemester)
  }

  const activeRecord = selectedRecord || records.find((record) => record.year === selectedYear)
  const recordState = activeRecord?.state || "Draft"
  const createdByLabel = activeRecord?.created_by ? employeeMap[String(activeRecord.created_by)] || activeRecord.created_by : "-"
  const updatedByLabel = activeRecord?.updated_by ? employeeMap[String(activeRecord.updated_by)] || activeRecord.updated_by : "-"
  const createdAtLabel = activeRecord?.created_at ? formatDate(activeRecord.created_at) : "-"
  const updatedAtLabel = activeRecord?.updated_at ? formatDate(activeRecord.updated_at) : "-"

  return (
    <>
      <Head title="OPCR" />
      <PageTitle
          pageTitle="OPCR"
          description="Office Performance Commitment and Review records aligned to the SPMS cycle."
          breadcrumbItems={[
            { label: "Home", href: "/" },
            { label: "Performance" },
            { label: "OPCR" },
          ]}
        />
      <div className="flex h-full flex-col gap-4">
        <div className="flex flex-col gap-8 md:flex-row">
          <div className="flex-1 pb-6">
            <div className="space-y-2">
              <div className="space-y-3 rounded-lg border border-slate-200 bg-white px-3 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-start gap-4">
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-slate-900">Year</div>
                    <YearPicker
                      value={selectedYear}
                      onChange={handleYearChange}
                      startYear={currentYear - 10}
                      endYear={currentYear + 1}
                      placeholder="Select OPCR year"
                    />
                  </div>

                  {isSemestral && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-slate-900">Semester</div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant={selectedSemester === 1 ? "default" : "outline"}
                          onClick={() => handleSemesterChange(1)}
                          className="min-w-[140px]"
                        >
                          1st Semester
                        </Button>
                        <Button
                          type="button"
                          variant={selectedSemester === 2 ? "default" : "outline"}
                          onClick={() => handleSemesterChange(2)}
                          className="min-w-[140px]"
                        >
                          2nd Semester
                        </Button>
                      </div>
                    </div>
                  )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button type="button" size="sm" variant="outline" className="gap-2" onClick={() => setDetailsOpen(true)}>
                      <PanelRightOpen className="h-4 w-4" />
                      View Period Details
                    </Button>
                  </div>
                </div>

                
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="flex h-auto w-full justify-start gap-6 rounded-lg border border-slate-200 bg-white p-1">
                <TabsTrigger value="pnc" className="rounded-md py-2">
                    Planning and Commitment
                  </TabsTrigger>
                  <TabsTrigger value="mnc" className="rounded-md py-2">
                    Monitoring and Coaching
                  </TabsTrigger>
                  <TabsTrigger value="rne" className="rounded-md py-2">
                    Review and Evaluation
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="pnc">
                  <Pnc
                    record={activeRecord}
                    libraryOptions={libraryOptions}
                    categories={categories}
                    canManage={canManage}
                    periodLabel={periodLabel}
                  />
                </TabsContent>

                <TabsContent value="mnc">
                  <Mnc
                    record={activeRecord}
                    canManage={canManage}
                    periodLabel={periodLabel}
                  />
                </TabsContent>

                <TabsContent value="rne">
                  <Rne
                    record={activeRecord}
                    libraryOptions={libraryOptions}
                    categories={categories}
                    canManage={canManage}
                    periodLabel={periodLabel}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>

      <Sheet open={detailsOpen} onOpenChange={setDetailsOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg">
          <SheetHeader className="text-left">
            <SheetTitle className="text-base">OPCR Period Details</SheetTitle>
            <SheetDescription>
              The OPCR is the office-level commitment document. Its rows should come from the MFO/PAP and Success Indicator libraries, then later receive accomplishment and rating updates during review.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            <div className="rounded-lg border bg-white p-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Selected Record</div>
              <div className="mt-1 text-sm font-medium text-slate-900">{activeRecord?.title || `OPCR ${periodLabel}`}</div>
              <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-[11px] uppercase tracking-wide text-slate-500">Status</dt>
                  <dd className="mt-0.5 font-medium text-slate-900">{recordState}</dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-wide text-slate-500">Created By</dt>
                  <dd className="mt-0.5 font-medium text-slate-900">{createdByLabel}</dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-wide text-slate-500">Updated By</dt>
                  <dd className="mt-0.5 font-medium text-slate-900">{updatedByLabel}</dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-wide text-slate-500">Created At</dt>
                  <dd className="mt-0.5 font-medium text-slate-900">{createdAtLabel}</dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-wide text-slate-500">Updated At</dt>
                  <dd className="mt-0.5 font-medium text-slate-900">{updatedAtLabel}</dd>
                </div>
              </div>
              <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3">
                <div className="text-[11px] uppercase tracking-wide text-slate-500">Remarks</div>
                <div className="mt-1 text-sm leading-6 text-slate-700">
                  {activeRecord?.state_remarks ? activeRecord.state_remarks : "No remarks yet."}
                </div>
              </div>
            </div>

            <div className="rounded-lg border bg-slate-50 p-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <CalendarRange className="h-4 w-4" />
                Period Info
              </div>
              <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-[11px] uppercase tracking-wide text-slate-500">Year</dt>
                  <dd className="mt-0.5 font-medium text-slate-900">{selectedYear}</dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-wide text-slate-500">Frequency</dt>
                  <dd className="mt-0.5 font-medium text-slate-900">{formatFrequency(frequency)}</dd>
                </div>
                {isSemestral && (
                  <div>
                    <dt className="text-[11px] uppercase tracking-wide text-slate-500">Semester</dt>
                    <dd className="mt-0.5 font-medium text-slate-900">{formatSemester(selectedSemester)}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
