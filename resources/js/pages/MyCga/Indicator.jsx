import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import DataTable from "@/components/DataTable"
import TrainingForm from "@/pages/MyCga/TrainingForm"
import AwardForm from "@/pages/MyCga/AwardForm"
import PerformanceForm from "@/pages/MyCga/PerformanceForm"
import OtherEvidenceForm from "@/pages/MyCga/OtherEvidenceForm"
import ComponentLoading from "@/components/ComponentLoading"
import EvidenceDescription from "@/pages/MyCga/EvidenceDescription"
import AttachmentList from "@/pages/MyCga/AttachmentList"
import DeleteConfirmationDialog from "@/components/DeleteConfirmationDialog"
import { useState, useEffect, useMemo, useCallback } from 'react'
import { useForm, Link } from '@inertiajs/react'
import { SquarePen, Search, CirclePlus, SlidersHorizontal } from 'lucide-react'
import { formatDate, formatNumberWithCommas } from "@/lib/utils.jsx"
import useDebounce from "@/hooks/useDebounce"
import { useToast } from "@/hooks/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"

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

const Indicator = ({ indicator }) => {

  const references = useMemo(() => ["Training", "Award", "Performance", "Others"], [])
  
  const { toast } = useToast()

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
    evidenceCounts: { all: 0, pending: 0, hrConfirmed: 0, dcConfirmed: 0 },
    evidenceCountLabels: { all: 'All', pending: 'Pending', hrConfirmed: 'HR Approved', dcConfirmed: 'DC Approved'}
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

  // Fetch data based on currentPage and selected filters
  useEffect(() => {
    fetchData(
      `/my-cga/indicator/${indicator.indicator_id}?page=${state.currentPage}&references=${encodeURIComponent(referencesJoined)}&search=${debouncedSearchValue}`,
      `/my-cga/evidences/${indicator.indicator_id}?references=${encodeURIComponent(referencesJoined)}&search=${debouncedSearchValue}`
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
        (state.filter === "pending" && evidence.hr_confirmation === null && evidence.dc_confirmation === null) ||
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
  useEffect(() => {
    post('/my-cga/indicator/{indicator_id}', {
      preserveState: true
    })
  }, [indicator.indicator_id])

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
            const wasHrConfirmed = deletedEvidence?.hr_confirmation !== null
            const wasDcConfirmed = deletedEvidence?.dc_confirmation !== null

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
    fetchData(`/my-cga/indicator/${indicator.indicator_id}?page=${state.currentPage}`, `/my-cga/evidences/${indicator.indicator_id}`)
  }, [fetchData, indicator.indicator_id, state.currentPage])

  return (
    <div className="grid grid-rows-[auto,1fr,auto] gap-2 h-full">
      <div>
        <div>
          <h5 className="font-semibold text-sm leading-normal tracking-tight lg:mt-0">
                {indicator.indicator}
          </h5>
          <span className="text-xs">Level { indicator.proficiency } Indicator</span>
        </div>
        <div className="flex flex-end mt-2">
          <DropdownMenu>
              <div className="flex flex-col gap-2 w-full">
                <div className="inline-flex text-xs gap-2">
                {['all', 'pending', 'hrConfirmed', 'dcConfirmed'].map((status) => (
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
                    className={`${state.filter === status ? 'font-semibold' : ''}`}
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
                            className="text-xs pl-8 xl:min-w-[150px] h-8 placeholder:text-xs"
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
                    <Button size="sm" variant="" className="h-8 gap-1 text-xs">
                      <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                        Add Evidence
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
      {state.loading ? (
          <div className="h-full"><ComponentLoading /></div>
        ) : (
            state.filteredEvidences && state.filteredEvidences.length > 0 ? (
                <div className="h-12">
                    {state.filteredEvidences.map((evidence) => (
                        <div key={evidence.id} className="flex flex-col w-full items-start gap-2 rounded-lg border p-4 text-left text-sm transition-all hover:bg-accent mb-4">
                            <div className="flex w-full flex-col gap-1">
                                <div className="flex items-center justify-between">
                                    <div className="font-bold text-xs">{evidence.title}</div>
                                    <div className="flex gap-2">
                                        <Button onClick={() => openModal(evidence.reference, evidence)} type="icon" size="xs" variant="ghost">
                                            <SquarePen className="h-4 w-4" />
                                        </Button>
                                        <DeleteConfirmationDialog onConfirm={() => handleDelete(evidence.id)} type="icon" size="xs" variant="ghost" />
                                    </div>
                                </div>
                                <div className="text-xs font-medium">
                                    {evidence.start_date ? `${formatDate(evidence.start_date)} - ${formatDate(evidence.end_date)}` : ''}
                                </div>
                                {state.files[evidence.id] && <AttachmentList files={state.files[evidence.id]} evidence={evidence} />}
                            </div>
                            <EvidenceDescription text={evidence.description} />
                            <div className="flex items-center gap-2">
                                {references.map((reference) => (
                                    <div
                                        key={reference}
                                        className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent ${
                                            evidence.reference === reference ? 'bg-primary text-primary-foreground shadow hover:bg-primary/80' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                                        }`}
                                    >
                                        {reference.toLowerCase()}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col flex-1 items-center justify-center h-full">
                    <span className="text-center w-full text-sm font-semibold">No records yet</span>
                    <span className="text-center w-full text-xs">Once you add an evidence, it will appear here</span>
                </div>
            )
        )}
      </ScrollArea>
      <div>
        {state.evidences.data && state.evidences.data.length > 0 && (
            <div className="flex items-center space-x-1">
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
      </div>

        {/* <DataTable columns={columns} data={evidences} /> */}

        <TrainingForm 
          evidence={state.selectedEvidence}
          indicator={indicator} 
          open={state.activeModal === 'Training'} 
          onClose={closeModal} 
          onSuccess={handleSuccess} 
        />

        <AwardForm 
          evidence={state.selectedEvidence}
          indicator={indicator} 
          open={state.activeModal === 'Award'}
          onClose={closeModal} 
          onSuccess={handleSuccess} 
        />

        <PerformanceForm 
          evidence={state.selectedEvidence}
          indicator={indicator} 
          open={state.activeModal === 'Performance'} 
          onClose={closeModal} 
          onSuccess={handleSuccess} 
        />

        <OtherEvidenceForm 
          evidence={state.selectedEvidence}
          indicator={indicator} 
          open={state.activeModal === 'Others'} 
          onClose={closeModal} 
          onSuccess={handleSuccess} 
        />

      </div>
  )
}

export default Indicator