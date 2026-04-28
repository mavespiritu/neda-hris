import { Head, router } from "@inertiajs/react"
import { useEffect, useMemo, useState } from "react"
import axios from "axios"
import { CalendarRange, PanelRightOpen } from "lucide-react"
import PageTitle from "@/components/PageTitle"
import SingleComboBox from "@/components/SingleComboBox"
import { YearPicker } from "@/components/YearPicker"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useHasPermission } from "@/hooks/useAuth"
import { useToast } from "@/hooks/use-toast"
import Mnc from "../Opcr/Mnc"
import Rne from "../Opcr/Rne"
import DpcrPnc from "./Pnc"
import DpcrSuccessIndicatorCreateDialog from "./components/DpcrSuccessIndicatorCreateDialog"
import SpecificActivityCreateDialog from "./components/SpecificActivityCreateDialog"
import useOpcrLookups from "../Opcr/hooks/useOpcrLookups"

const currentYear = new Date().getFullYear()

const formatFrequency = (value) => (value === "semestral" ? "Semestral" : "Yearly")
const formatSemester = (semester) => (Number(semester) === 2 ? "2nd Semester" : "1st Semester")

export default function Index({
  selectedRecord = null,
  selectedYear: selectedYearFromServer = null,
  selectedSemester: selectedSemesterFromServer = null,
  frequency = "yearly",
  libraryOptions = {},
  categories = [],
  sourceRecord = null,
  selectedDivision = null,
  selectedDivisionName = "",
  divisionOptions = [],
  canViewAny = false,
}) {
  const canSelectDivision = useHasPermission("HRIS_performance.dpcr.view.any") || canViewAny
  const { toast } = useToast()
  const isSemestral = frequency === "semestral"
  const [selectedYear, setSelectedYear] = useState(Number(selectedYearFromServer || currentYear))
  const [selectedSemester, setSelectedSemester] = useState(Number(selectedSemesterFromServer || 1))
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("pnc")
  const [specificActivityOpen, setSpecificActivityOpen] = useState(false)
  const [specificActivityParent, setSpecificActivityParent] = useState(null)
  const [specificActivityCreating, setSpecificActivityCreating] = useState(false)
  const [successIndicatorOpen, setSuccessIndicatorOpen] = useState(false)
  const [successIndicatorSourceItem, setSuccessIndicatorSourceItem] = useState(null)
  const [successIndicatorTemplateItem, setSuccessIndicatorTemplateItem] = useState(null)
  const [successIndicatorInitialTitle, setSuccessIndicatorInitialTitle] = useState("")
  const [successIndicatorCreating, setSuccessIndicatorCreating] = useState(false)
  const { ppmpHierarchy, groups, employees, groupMap, employeeMap } = useOpcrLookups()
  const dpcrRatingItems = useMemo(
    () =>
      Array.isArray(libraryOptions?.ratings)
        ? libraryOptions.ratings
            .filter((rating) => String(rating.category ?? "").trim().toUpperCase() === "DPCR")
            .map((rating) => ({
              ...rating,
              value: String(rating.id),
              label: `${rating.name}${rating.category ? ` (${rating.category})` : ""}`,
            }))
        : [],
    [libraryOptions?.ratings]
  )

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

  const visitPeriod = (year, semester = selectedSemester, division = selectedDivision?.value ?? null) => {
    const params = { year: String(year) }

    if (isSemestral) {
      params.semester = String(semester)
    }

    if (canSelectDivision && division) {
      params.division = String(division)
    }

    router.get(route("dpcrs.index", params), {}, {
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

  const handleDivisionChange = (value) => {
    if (!value) return
    visitPeriod(selectedYear, selectedSemester, value)
  }

  const selectedDivisionLabel = selectedDivision?.label || selectedDivisionName || "Division"
  const activeRecord = selectedRecord
  const divisionMap = useMemo(
    () =>
      Object.fromEntries(
        (Array.isArray(divisionOptions) ? divisionOptions : []).map((division) => [
          String(division.value ?? division.label ?? ""),
          String(division.label ?? division.value ?? ""),
        ])
      ),
    [divisionOptions]
  )
  const dpcrSourceItemIds = useMemo(
    () =>
      new Set(
        Array.isArray(selectedRecord?.items)
          ? selectedRecord.items
              .map((item) => String(item.source_opcr_item_id ?? ""))
              .filter(Boolean)
          : []
      ),
    [selectedRecord?.items]
  )
  const controlWidth = "w-[220px]"

  const handleOpenSpecificActivityDialog = (indicator) => {
    if (!indicator) return
    setSpecificActivityParent(indicator)
    setSpecificActivityOpen(true)
  }

  const handleOpenSuccessIndicatorDialog = (sourceItem, templateItem = null, draftTitle = "") => {
    setSuccessIndicatorSourceItem(sourceItem ?? null)
    setSuccessIndicatorTemplateItem(templateItem ?? null)
    setSuccessIndicatorInitialTitle(draftTitle || "")
    setSuccessIndicatorOpen(true)
  }

  const handleCreateSuccessIndicator = async (payload) => {
    if (!selectedRecord?.id) return

    try {
      setSuccessIndicatorCreating(true)
        await axios.post(
          route("dpcrs.success-indicators.store", { recordId: selectedRecord.id }),
          {
            ...payload,
            source_opcr_item_id: successIndicatorSourceItem?.opcr_item_id ?? successIndicatorSourceItem?.id ?? null,
          }
      )

      setSuccessIndicatorOpen(false)
      setSuccessIndicatorSourceItem(null)
      setSuccessIndicatorTemplateItem(null)
      setSuccessIndicatorInitialTitle("")
      router.reload({ preserveScroll: true, preserveState: true })
      toast({
        title: "Saved",
        description: "Success indicator added successfully.",
      })
    } catch (error) {
      toast({
        title: "Unable to add success indicator",
        description:
          error?.response?.data?.errors?.performance_rating_id?.[0] ||
          error?.response?.data?.errors?.matrix_payload?.[0] ||
          error?.response?.data?.errors?.sub_activity_id?.[0] ||
          error?.response?.data?.errors?.success_indicator_title?.[0] ||
          error?.response?.data?.message ||
          error?.message ||
          "Failed to save the success indicator.",
        variant: "destructive",
      })
    } finally {
      setSuccessIndicatorCreating(false)
    }
  }

  const handleCreateSpecificActivity = async (payload) => {
    if (!selectedRecord?.id || !specificActivityParent?.id) return

    try {
      setSpecificActivityCreating(true)
      await axios.post(
        route("dpcrs.specific-activities.store", {
          recordId: selectedRecord.id,
          parentItemId: specificActivityParent.id,
        }),
        payload
      )

      setSpecificActivityOpen(false)
      setSpecificActivityParent(null)
      router.reload({ preserveScroll: true, preserveState: true })
      toast({
        title: "Saved",
        description: "Specific activity/output added successfully.",
      })
    } catch (error) {
      toast({
        title: "Unable to add specific activity/output",
        description:
          error?.response?.data?.errors?.sub_activity_id?.[0] ||
          error?.response?.data?.message ||
          error?.message ||
          "Failed to save the specific activity/output.",
        variant: "destructive",
      })
    } finally {
      setSpecificActivityCreating(false)
    }
  }

  return (
    <>
      <Head title="DPCR" />
      <PageTitle
        pageTitle="DPCR"
        description="Division Performance Commitment and Review records aligned to the SPMS cycle."
        breadcrumbItems={[
          { label: "Home", href: "/" },
          { label: "Performance" },
          { label: "DPCR" },
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
                          placeholder="Select DPCR year"
                          className={controlWidth}
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

                    {canSelectDivision ? (
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-slate-900">Division</div>
                        <SingleComboBox
                          items={divisionOptions}
                          placeholder="Select division"
                          selectedItem={selectedDivision}
                          value={selectedDivision?.value}
                          onChange={handleDivisionChange}
                          className={controlWidth}
                          width={controlWidth}
                          name="division"
                        />
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-slate-900">Division</div>
                        <Badge variant="secondary" className="rounded-md px-3 py-2 text-sm font-medium">
                          {selectedDivisionLabel}
                        </Badge>
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
                  <DpcrPnc
                    viewMode="dpcr"
                    record={sourceRecord}
                    periodLabel={periodLabel}
                    selectedDivisionLabel={selectedDivisionLabel}
                    ppmpHierarchy={ppmpHierarchy}
                    onAddSuccessIndicator={handleOpenSuccessIndicatorDialog}
                    onAddSpecificAO={handleOpenSpecificActivityDialog}
                    groupMap={groupMap}
                    employeeMap={employeeMap}
                    divisionMap={divisionMap}
                    categories={categories}
                    sourceRecord={sourceRecord}
                    dpcrRecord={selectedRecord}
                    dpcrSourceItemIds={dpcrSourceItemIds}
                  />
                </TabsContent>

                <TabsContent value="mnc">
                  <Mnc
                    record={activeRecord}
                    periodLabel={periodLabel}
                  />
                </TabsContent>

                <TabsContent value="rne">
                  <Rne
                    record={activeRecord}
                    libraryOptions={libraryOptions}
                    categories={categories}
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
            <SheetTitle className="text-base">DPCR Period Details</SheetTitle>
            <SheetDescription>
              The DPCR mirrors the OPCR structure at the division level and displays the OPCR items assigned to the selected division.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            <div className="rounded-lg border bg-white p-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Selected Record</div>
              <div className="mt-1 text-sm font-medium text-slate-900">{activeRecord?.title || `DPCR ${periodLabel}`}</div>
              <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-[11px] uppercase tracking-wide text-slate-500">Division</dt>
                  <dd className="mt-0.5 font-medium text-slate-900">{selectedDivisionLabel}</dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-wide text-slate-500">Status</dt>
                  <dd className="mt-0.5 font-medium text-slate-900">{activeRecord?.state || "-"}</dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-wide text-slate-500">Created At</dt>
                  <dd className="mt-0.5 font-medium text-slate-900">{activeRecord?.created_at || "-"}</dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-wide text-slate-500">Updated At</dt>
                  <dd className="mt-0.5 font-medium text-slate-900">{activeRecord?.updated_at || "-"}</dd>
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

      <SpecificActivityCreateDialog
        open={specificActivityOpen}
        onOpenChange={(open) => {
          setSpecificActivityOpen(open)
          if (!open) {
            setSpecificActivityParent(null)
          }
        }}
        successIndicatorTitle={specificActivityParent?.success_indicator_title ?? specificActivityParent?.title ?? ""}
        successIndicatorLabel={specificActivityParent?.success_indicator_title ?? specificActivityParent?.title ?? ""}
        selectedDivisionLabel={selectedDivisionLabel}
        selectedDivisionValue={selectedDivision?.value ?? ""}
        ppmpHierarchy={ppmpHierarchy}
        groups={groups}
        employees={employees}
        onCancel={() => {
          setSpecificActivityOpen(false)
          setSpecificActivityParent(null)
        }}
        onCreate={handleCreateSpecificActivity}
        creating={specificActivityCreating}
      />

      <DpcrSuccessIndicatorCreateDialog
        open={successIndicatorOpen}
        onOpenChange={(open) => {
          setSuccessIndicatorOpen(open)
          if (!open) {
            setSuccessIndicatorSourceItem(null)
            setSuccessIndicatorTemplateItem(null)
            setSuccessIndicatorInitialTitle("")
            setSuccessIndicatorCreating(false)
          }
        }}
        selectedDivisionLabel={selectedDivisionLabel}
        selectedDivisionValue={selectedDivision?.value ?? ""}
        ppmpHierarchy={ppmpHierarchy}
        groups={groups}
        employees={employees}
        ratingItems={dpcrRatingItems}
        initialSuccessIndicatorTitle={successIndicatorInitialTitle}
        initialTemplateItem={successIndicatorTemplateItem}
        onCancel={() => {
          setSuccessIndicatorOpen(false)
          setSuccessIndicatorSourceItem(null)
          setSuccessIndicatorTemplateItem(null)
          setSuccessIndicatorInitialTitle("")
        }}
        onCreate={handleCreateSuccessIndicator}
        creating={successIndicatorCreating}
      />
    </>
  )
}
