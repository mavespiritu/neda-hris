import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import DataTable from "@/components/DataTable"
import TrainingForm from "@/pages/MyCga/TrainingForm"
import AwardForm from "@/pages/MyCga/AwardForm"
import PerformanceForm from "@/pages/MyCga/PerformanceForm"
import OtherEvidenceForm from "@/pages/MyCga/OtherEvidenceForm"
import EvidencesLoading from "@/components/skeletons/EvidencesLoading"
import EvidenceDescription from "@/pages/MyCga/EvidenceDescription"
import AttachmentList from "@/pages/MyCga/AttachmentList"
import DeleteConfirmationDialog from "@/components/DeleteConfirmationDialog"
import { useState, useEffect, useMemo, useCallback } from 'react'
import { useForm, Link } from '@inertiajs/react'
import { SquarePen, Search, FilePlus, SlidersHorizontal, ChevronDown } from 'lucide-react'
import { formatDate, formatNumberWithCommas } from "@/lib/utils.jsx"
import useDebounce from "@/hooks/useDebounce"
import { useToast } from "@/hooks/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { useTextSize } from "@/providers/TextSizeProvider"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import { Switch } from "@/components/ui/switch"

const Indicator = ({ emp_id, indicator, handleToggleChange, compliance }) => {

  const textSize = useTextSize()
  
  const { toast } = useToast()

  const [employees, setEmployees] = useState([])

  const references = useMemo(() => ["Training", "Award", "Performance", "Others"], [])

  const [state, setState] = useState({
    evidences: [],
    files: [],
    loading: true,
    filteredEvidences: [],
    activeModal: null,
    currentPage: 1,
    selectedEvidence: null,
    filter: "all",
    searchTerm: "",
    selectedFilters: references,
    evidenceCounts: { all: 0, pending: 0, hrConfirmed: 0, dcConfirmed: 0, disapproved: 0 },
    evidenceCountLabels: { all: 'All', pending: 'Pending', hrConfirmed: 'HR Approved', dcConfirmed: 'DC Approved', disapproved: 'Disapproved' }
  })

  const debouncedSearchValue = useDebounce(state.searchTerm, 500)

  const referencesJoined = useMemo(() => state.selectedFilters.join(","), [state.selectedFilters])

  // Form submission
  const { post, delete: destroy } =  useForm({
    indicator_id: indicator.indicator_id,
  })

  // Function to fetch evidences and counts
  const fetchData = useCallback(async (evidencesUrl, countsUrl) => {
    setState((prev) => ({ ...prev, loading: true }))
    try {
      const [evidencesResponse, countsResponse] = await Promise.all([
        fetch(evidencesUrl), 
        fetch(countsUrl)
      ])

      if (!evidencesResponse.ok || !countsResponse.ok) {
        throw new Error("Network response was not ok")
      }

      const evidencesData = await evidencesResponse.json()
      const countsData = await countsResponse.json()

      setState((prev) => ({
        ...prev,
        evidences: evidencesData.evidences,
        files: evidencesData.files,
        evidenceCounts: countsData,
        loading: false,
      }))

    } catch (error) {
      console.error(error.message)
      setState((prev) => ({ ...prev, loading: false }))
    }

    
  }, [])

  const fetchActiveEmployees = async () => {
    try {
        const response = await fetch(`/employees/active-employees`)
        if (!response.ok) {
            toast({
                title: "Uh oh! Something went wrong.",
                description: "Network response was not ok",
            })
        }
        const data = await response.json()
      
        setEmployees(data)

    } catch (err) {
        toast({
            title: "Uh oh! Something went wrong.",
            description: "There was a problem with your request",
        })
    }
  }

  useEffect(() => {
    fetchActiveEmployees()
}, [])

  // Fetch data based on currentPage and selected filters
  useEffect(() => {
    fetchData(
      `/my-cga/indicator/${emp_id}?page=${state.currentPage}&references=${encodeURIComponent(referencesJoined)}&search=${debouncedSearchValue}&indicator_id=${indicator.indicator_id}`,
      `/my-cga/evidences/${emp_id}?references=${encodeURIComponent(referencesJoined)}&search=${debouncedSearchValue}&indicator_id=${indicator.indicator_id}`
    )

    console.log("fetch data based on currentPage and selected filters")
  }, [indicator?.indicator_id, state.currentPage, referencesJoined, debouncedSearchValue, fetchData])

  // Update filtered evidences based on status and search term
  const filterEvidences = useCallback(() => {
    const filtered = state.evidences.data?.filter((evidence) => {
      const matchesSearch =
        evidence.title?.toLowerCase().includes(debouncedSearchValue.toLowerCase()) ||
        evidence.description?.toLowerCase().includes(debouncedSearchValue.toLowerCase())

      const matchesStatusFilter =
        state.filter === "all" ||
        (state.filter === "disapproved" && evidence.disapproved === 1) ||
        (state.filter === "pending" && evidence.hr_confirmation === null && evidence.dc_confirmation === null  && evidence.disapproved === null) ||
        (state.filter === "hrConfirmed" && evidence.hr_confirmation !== null) ||
        (state.filter === "dcConfirmed" && evidence.dc_confirmation !== null)

      return matchesSearch && matchesStatusFilter
    })
    console.log("update filtered evidences based on status and search term")
    setState((prev) => ({ ...prev, filteredEvidences: filtered }))
  }, [state.evidences, debouncedSearchValue, state.filter])

  // filter based on the status
  useEffect(() => {
    filterEvidences()
  }, [state.evidences, debouncedSearchValue, state.filter, filterEvidences])

  //handles create of indicator evidence
  /* useEffect(() => {
    post(`/my-cga/indicator/${emp_id}`, {
      data: { indicator_id: indicator.indicator_id },
      preserveState: true
    })
  }, [indicator.indicator_id]) */

  // handles the search of evidences
  const handleSearch = useCallback((event) => {
    setState((prev) => ({ ...prev, searchTerm: event.target.value, currentPage: 1 }))
  }, [])

  // handles the delete of evidence
  const handleDelete = useCallback(
    async (evidenceId) => {
      destroy(`/my-cga/evidence/${evidenceId}`, {
        preserveState: true,
        onSuccess: () => {
          toast({
            title: "Success!",
            description: "The evidence has been deleted successfully",
          })

          setState((prev) => {
            const deletedEvidence = prev.evidences.data.find(evidence => evidence.id === evidenceId)

            // Determine if the deleted evidence was confirmed or pending
            const wasPending = deletedEvidence?.hr_confirmation === null && deletedEvidence?.dc_confirmation === null
            const wasHrConfirmed = deletedEvidence?.hr_confirmation !== null && deletedEvidence?.disapproved === null
            const wasDcConfirmed = deletedEvidence?.dc_confirmation !== null && deletedEvidence?.disapproved === null

            const updatedEvidences = prev.evidences.data.filter((evidence) => evidence.id !== evidenceId)
            
            const newCounts = {
              all: prev.evidenceCounts.all > 0 ? prev.evidenceCounts.all - 1 : 0,
              pending: prev.evidenceCounts.pending - (wasPending ? 1 : 0),
              hrConfirmed: prev.evidenceCounts.hrConfirmed - (wasHrConfirmed ? 1 : 0),
              dcConfirmed: prev.evidenceCounts.dcConfirmed - (wasDcConfirmed ? 1 : 0),
            };
  
            return {
              ...prev,
              evidences: { ...prev.evidences, data: updatedEvidences },
              evidenceCounts: newCounts,
            }
          })
          
        },
        onError: (e) => {
          console.error(e)
        },
      })
    },
    [destroy, state.evidences, toast]
  )

  const handlePaginationClick = useCallback(
    (link, e) => {
      e.preventDefault()

      // Check if the URL exists and extract the page number
      if (link.url) {
        const url = new URL(link.url)
        const params = new URLSearchParams(url.search)
        const page = params.get('page') // Extract the page number
        
        if (page) {
          setState((prev) => ({ ...prev, currentPage: parseInt(page, 10) })) 
        }
      }
    },
    []
  )

  const toggleFilter = useCallback((reference) => {
    setState((prev) => ({
      ...prev,
      selectedFilters: prev.selectedFilters.includes(reference)
        ? prev.selectedFilters.filter((filter) => filter !== reference)
        : [...prev.selectedFilters, reference],
    }))
  }, [])

  const openModal = useCallback((type, evidence = null) => {
    setState((prev) => ({ ...prev, activeModal: type, selectedEvidence: evidence }))
  }, [])

  const closeModal = useCallback(() => {
    setState((prev) => ({ ...prev, activeModal: null, selectedEvidence: null }))
  }, [])

  const handleSuccess = useCallback(() => {
    fetchData(`/my-cga/indicator/${emp_id}?page=${state.currentPage}&indicator_id=${indicator.indicator_id}`, `/my-cga/evidences/${emp_id}?indicator_id=${indicator.indicator_id}`)
  }, [fetchData, indicator.indicator_id, state.currentPage])

  const itemsPerPage = 10

  const total = state.evidences?.total || 0
  const startIndex = (state.currentPage - 1) * itemsPerPage + 1
  const endIndex = Math.min(startIndex + itemsPerPage - 1, total)

  return (
    <div className="grid grid-rows-[auto,1fr,auto] gap-2 h-full">
      <div>
        <div className="flex gap-2 items-center">
          <Switch 
            checked={compliance}
            onCheckedChange={(isChecked) => handleToggleChange(indicator.indicator_id, isChecked)}
            className="block lg:hidden"
          />
          <div className="flex flex-col">
            <h5 className="font-semibold text-sm leading-normal tracking-tight lg:mt-0">
                  {indicator.indicator}
            </h5>
            <span className="text-xs font-semibold">Level { indicator.proficiency } Indicator</span>
          </div>
        </div>
        <div className="flex flex-end mt-2">
          <DropdownMenu>
              <div className="flex flex-col gap-2 w-full">
                <div className="inline-flex text-sm lg:text-xs gap-2">
                {['all', 'pending', 'hrConfirmed', 'dcConfirmed', 'disapproved'].map((status) => (
                  <Link
                    key={status}
                    onClick={(e) => {
                      e.preventDefault()
                      setState((prev) => ({
                        ...prev,
                        filter: status,
                        currentPage: 1, // Reset to the first page when changing filter
                      }))
                    }}
                    className={`${state.filter === status && 'font-semibold'}`}
                    preserveState
                  >
                    {`${state.evidenceCountLabels[status]} (${formatNumberWithCommas(state.evidenceCounts[status])})`}
                  </Link>
                ))}
                </div>
                <div className="flex justify-between sm:gap-2">
                  <div className="flex justify-start gap-2">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-3 w-3 text-muted-foreground" />
                        <Input
                            placeholder="Type to search..."
                            type="search"
                            value={state.searchTerm}
                            onChange={handleSearch}
                            className="text-sm lg:text-xs pl-8 w-[300px] lg:min-w-[150px] h-8 placeholder:text-sm lg:placeholder:text-xs"
                        />
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="ml-auto h-8 gap-2 text-xs">
                          <SlidersHorizontal className="h-4 w-4" />
                          <span className="hidden md:block">Filter</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-[150px]">
                        <DropdownMenuLabel className="text-xs">Filter by type</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {references.map((reference) => (
                          <DropdownMenuCheckboxItem
                            key={reference}
                            className="capitalize text-xs"
                            checked={state.selectedFilters.includes(reference)}
                            onCheckedChange={() => toggleFilter(reference)}
                          >
                            {reference}
                          </DropdownMenuCheckboxItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="" className="border h-8 gap-1">
                      <span className="sr-only sm:not-sr-only sm:whitespace-nowrap flex gap-2 items-center text-xs">
                        <FilePlus className="h-4 w-4" />
                        <span>Add Evidence</span>
                        <ChevronDown className="h-3 w-3" />
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                </div>
              </div>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuLabel className="text-xs">Select Type</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  {references.map((reference) => (
                    <DropdownMenuItem 
                      key={reference}
                      onClick={() => openModal(reference)}
                    >
                      <span className="text-xs">{reference}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </div>
      <ScrollArea className="p-4 rounded-md border h-full">
        {state.filteredEvidences && state.filteredEvidences.length > 0 ? (
          <div className="h-12">
            {state.loading ? (
              <EvidencesLoading />
            ) : (
              state.filteredEvidences.map((evidence) => {
                        const { status, approver, approvalDate, remarks } = (() => {
                            let status = 'Pending'
                            let approver = ''
                            let approvalDate = ''
                            let remarks = ''

                            if (evidence.hr_confirmation === 1 && evidence.dc_confirmation === 1) {
                                status = 'HR and DC Approved'
                                approver = `${employees.find(emp => emp.value === evidence.hr_confirmed_by)?.label} and ${employees.find(emp => emp.value === evidence.dc_confirmed_by)?.label}`
                                approvalDate = ` on ${formatDate(evidence.hr_date)} and ${formatDate(evidence.dc_date)} respectively`
                                remarks = (evidence.dc_remarks || evidence.hr_remarks) && (
                                    <div className="flex flex-col gap-2 text-xs">
                                        {evidence.hr_remarks && (
                                            <div className="flex flex-col gap-1">
                                                <span className="text-muted-foreground">HR Remarks:</span>
                                                <span className="font-medium">{evidence.hr_remarks}</span>
                                            </div>
                                        )}
                                        {evidence.dc_remarks && (
                                            <div className="flex flex-col gap-1">
                                                <span className="text-muted-foreground">DC Remarks:</span>
                                                <span className="font-medium">{evidence.dc_remarks}</span>
                                            </div>
                                        )}
                                    </div>
                                )
                            } else if (evidence.hr_confirmation === 1) {
                                status = 'HR Approved'
                                approver = employees.find(emp => emp.value === evidence.hr_confirmed_by)?.label
                                approvalDate = ` on ${formatDate(evidence.hr_date)}`
                                remarks = evidence.hr_remarks && (
                                    <div className="flex flex-col gap-2 text-xs">
                                        {evidence.hr_remarks && (
                                            <div className="flex flex-col gap-1">
                                                <span className="text-muted-foreground">HR Remarks:</span>
                                                <span className="font-medium">{evidence.hr_remarks}</span>
                                            </div>
                                        )}
                                    </div>
                                )
                            } else if (evidence.dc_confirmation === 1) {
                                status = 'DC Approved'
                                approver = employees.find(emp => emp.value === evidence.dc_confirmed_by)?.label
                                approvalDate = ` on ${formatDate(evidence.dc_date)}`
                                remarks = evidence.dc_remarks && (
                                    <div className="flex flex-col gap-2 text-xs">
                                        {evidence.dc_remarks && (
                                            <div className="flex flex-col gap-1">
                                                <span className="text-muted-foreground">DC Remarks:</span>
                                                <span className="font-medium">{evidence.dc_remarks}</span>
                                            </div>
                                        )}
                                    </div>
                                )
                            } else if (evidence.disapproved === 1) {
                                status = 'Disapproved'
                                approver = employees.find(emp => emp.value === evidence.disapproved_by)?.label
                                approvalDate = ` on ${formatDate(evidence.disapproved_date)}`
                                remarks = evidence.disapproved_remarks && (
                                    <div className="flex flex-col gap-2 text-xs">
                                        {evidence.disapproved_remarks && (
                                            <div className="flex flex-col gap-1">
                                                <span className="text-muted-foreground">Remarks:</span>
                                                <span className="font-medium">{evidence.disapproved_remarks}</span>
                                            </div>
                                        )}
                                    </div>
                                )
                            }

                            return { status, approver, approvalDate, remarks }
                        })()

                        return (
                            <div key={evidence.id} className="flex flex-col w-full items-start rounded-lg border p-4 text-left text-sm transition-all hover:bg-accent mb-4">
                                <div className="flex w-full flex-col gap-1">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className={`font-semibold ${textSize}`}>{evidence.title}</div>
                                        <div className="flex gap-2">
                                            {['Pending'].includes(status) ? (
                                                <>
                                                    <Button 
                                                        onClick={() => openModal(evidence.reference, evidence)} 
                                                        type="icon" 
                                                        size="xs" 
                                                        variant="ghost"
                                                    >
                                                        <SquarePen className="h-4 w-4" /> 
                                                    </Button>
                                                    <DeleteConfirmationDialog 
                                                        onConfirm={() => handleDelete(evidence.id)} 
                                                        type="icon" 
                                                        size="xs" 
                                                        variant="ghost" 
                                                    />
                                                </>
                                            ) : (
                                                <Badge className="text-center rounded-lg" variant={status === 'Disapproved' && 'destructive'}>{status}</Badge>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex justify-between">
                                        <div className="flex flex-col">
                                            <div className="text-xs font-medium">
                                                {evidence.start_date && `${formatDate(evidence.start_date)} - ${formatDate(evidence.end_date)}`}
                                            </div>
                                        </div>
                                        <div className="flex flex-col text-xs text-right">
                                            <span className="text-muted-foreground font-medium">Type of Evidence:</span>
                                            <span className="font-medium">{evidence.reference}</span> 
                                        </div>
                                    </div>
                                </div>
                                <EvidenceDescription text={evidence.description} />
                                <div className="flex flex-col gap-2">
                                    <div>
                                        {state.files[evidence.id] && <span className="text-xs text-muted-foreground font-medium">Supporting Documents:</span>}
                                        {state.files[evidence.id] && <AttachmentList files={state.files[evidence.id]} evidence={evidence} />}
                                    </div>
                                    {['HR Approved', 'DC Approved', 'HR and DC Approved'].includes(status) ? (
                                        <span className="text-xs">
                                            Approved by <strong>{approver}</strong>{approvalDate}
                                        </span>
                                    ) : status === 'Disapproved' ? (
                                        <span className="text-xs">
                                            Disapproved by <strong>{approver}</strong>{approvalDate}
                                        </span>
                                    ) : null}
                                    <span>
                                        {['HR Approved', 'DC Approved', 'HR and DC Approved', 'Disapproved'].includes(status) && remarks}
                                    </span>
                                </div>
                            </div>
                        )
              })
            )}
          </div>
        ) : (
            <div className="flex flex-col flex-1 items-center justify-center h-full">
                <span className="text-center w-full text-sm font-semibold">No records yet</span>
                <span className="text-center w-full text-xs">Once you add an evidence, it will appear here</span>
            </div>
        )}
    </ScrollArea>

      <div className="flex gap-2 items-center justify-between">
        {state.evidences.data && state.evidences.data.length > 0 && (
            <div className="flex items-center space-x-2">
              {state.evidences.links.map((link) => (
                link.url ? (
                  <Button
                    key={link.label}
                    variant={link.active ? "default" : "outline"}
                    size="sm"
                    onClick={(e) => handlePaginationClick(link, e)}
                    dangerouslySetInnerHTML={{ __html: link.label }} // Renders the label directly
                    className="text-xs"
                  />
                ) : (
                  <Button
                    key={link.label}
                    variant="outline"
                    size="sm"
                    disabled
                    dangerouslySetInnerHTML={{ __html: link.label }}
                    className="text-xs text-slate-400"
                  />
                )
              ))}
            </div>
          )}
          <div className="text-xs font-medium">
              Showing {endIndex > 0 ? startIndex : 0}-{endIndex} of {total} items
          </div>
      </div>

        {/* <DataTable columns={columns} data={evidences} /> */}

        <TrainingForm 
          evidence={state.selectedEvidence}
          indicator={indicator} 
          open={state.activeModal === 'Training'} 
          onClose={closeModal} 
          onSuccess={handleSuccess}
          emp_id={emp_id} 
        />

        <AwardForm 
          evidence={state.selectedEvidence}
          indicator={indicator} 
          open={state.activeModal === 'Award'}
          onClose={closeModal} 
          onSuccess={handleSuccess}
          emp_id={emp_id}
        />

        <PerformanceForm 
          evidence={state.selectedEvidence}
          indicator={indicator} 
          open={state.activeModal === 'Performance'} 
          onClose={closeModal} 
          onSuccess={handleSuccess}
          emp_id={emp_id}
        />

        <OtherEvidenceForm 
          evidence={state.selectedEvidence}
          indicator={indicator} 
          open={state.activeModal === 'Others'} 
          onClose={closeModal} 
          onSuccess={handleSuccess}
          emp_id={emp_id} 
        />

      </div>
  )
}

export default Indicator