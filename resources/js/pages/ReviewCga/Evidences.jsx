import SingleComboBox from "@/components/SingleComboBox"
import { useState, useEffect, useCallback, useMemo, useReducer } from "react"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import useDebounce from "@/hooks/useDebounce"
import { useToast } from "@/hooks/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatDate, formatNumberWithCommas } from "@/lib/utils.jsx"
import { Button } from "@/components/ui/button"
import { SquarePen, Search, Loader2 } from 'lucide-react'
import AttachmentList from "@/pages/MyCga/AttachmentList"
import ApproveForm from "@/pages/ReviewCga/ApproveForm"
import DisapproveForm from "@/pages/ReviewCga/DisapproveForm"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { usePage } from '@inertiajs/react'
  
const initialState = {
    evidences: [],
    files: [],
    filters: {
        staff: null,
        competency: null,
        status: "all",
        selectedTypes: ["Training", "Award", "Performance", "Others"],
    },
    searchTerm: "",
    activeModal: null,
    loading: true,
    filteredEvidences: [],
    currentPage: 1,
    selectedEvidence: null,
    evidenceStatusCounts: { all: 0, pending: 0, hrConfirmed: 0, dcConfirmed: 0, disapproved: 0 },
    evidenceTypeCounts: { training: 0, award: 0, performance: 0, others: 0 },
}

function useFetchCompetencies(state, toast) {
    const fetchCompetencies = useCallback(async () => {
        try {
            const response = await fetch(`/review-cga/competencies`)
            if (!response.ok) {
                toast({
                    title: "Uh oh! Something went wrong.",
                    description: "Network response was not ok",
                    variant: "destructive"
                })
            }

            const data = await response.json()
            return data
        } catch (error) {
            toast({
                title: "Uh oh! Something went wrong.",
                description: "There was a problem with your request",
                variant: "destructive",
            })
            return null
        }
    }, [state, toast])

    return fetchCompetencies
}

function useFetchEvidences(state, dispatch, toast) {
    const fetchEvidences = useCallback(async () => {
        try {
            const params = new URLSearchParams()
            if (state.currentPage) params.append('page', state.currentPage)
            if (state.filters.competency) params.append('competency', state.filters.competency)
            if (state.filters.staff) params.append('emp_id', state.filters.staff)
            if (state.filters.status) params.append('status', state.filters.status)
            if (state.filters.selectedTypes) params.append('selectedTypes', state.filters.selectedTypes)
            if (state.searchTerm) params.append('search', state.searchTerm)

            const response = await fetch(`/review-cga/evidences?${params.toString()}`)
          
            if (!response.ok) {
                toast({
                    title: "Uh oh! Something went wrong.",
                    description: "There was a problem with your request",
                    variant: "destructive",
                })
            }

            const data = await response.json()

            dispatch({
                type: 'SET_EVIDENCES',
                payload: {
                    evidences: data.evidences,
                    files: data.files,
                }
            })

            dispatch({ 
                type: 'SET_EVIDENCE_COUNTS', 
                payload: {
                    evidenceStatusCounts: data.evidenceStatusCounts, 
                    evidenceTypeCounts: data.evidenceTypeCounts 
                } 
            })

        } catch (error) {
            toast({
                title: "Uh oh! Something went wrong.",
                description: "There was a problem with your request",
                variant: "destructive",
            })
            dispatch({ type: 'SET_LOADING', payload: false })
        }
    }, [state, dispatch])

    return fetchEvidences
}

function reducer(state, action) {
    switch (action.type) {
        case 'SET_EVIDENCES':
            return { ...state, evidences: action.payload.evidences, files: action.payload.files, loading: false }
        case 'SET_LOADING':
            return { ...state, loading: action.payload }
        case 'SET_FILTER':
            return {
                ...state,
                currentPage: 1,
                filters: { ...state.filters, [action.field]: action.payload }
            }
        case 'SET_SEARCH_TERM':
            return { ...state, searchTerm: action.payload }
        case 'SET_CURRENT_PAGE':
            return { ...state, currentPage: action.payload }
        case 'OPEN_MODAL':
            return { ...state, activeModal: action.payload.type, selectedEvidence: action.payload.evidence }
        case 'CLOSE_MODAL':
            return { ...state, activeModal: null, selectedEvidence: null }
        case 'CLEAR_FILTERS':
            return { ...state, filters: initialState.filters }
        case 'SET_FILTERED_EVIDENCES':
            return { ...state, filteredEvidences: action.payload }
        case 'SET_EVIDENCE_COUNTS':
            return { ...state, evidenceStatusCounts: action.payload.evidenceStatusCounts, evidenceTypeCounts: action.payload.evidenceTypeCounts }
        case 'SET_SELECTED_TYPES':
            return {
                ...state,
                filters: {
                    ...state.filters,
                    selectedTypes: action.payload,
                },
            }
        default:
            return state
    }
}

const Evidences = ({employees}) => {

    const { toast } = useToast()
    const user = usePage().props.auth.user
    const [state, dispatch] = useReducer(reducer, initialState)
    const [competencies, setCompetencies] = useState([])
    const debouncedSearchValue = useDebounce(state.searchTerm, 500)

    const fetchCompetencies = useFetchCompetencies(state, toast)
    const fetchEvidences = useFetchEvidences(state, dispatch, toast)

    const itemsPerPage = 20
    const total = state.evidences?.total || 0
    const startIndex = (state.currentPage - 1) * itemsPerPage + 1
    const endIndex = Math.min(startIndex + itemsPerPage - 1, total)

    useEffect(() => {
        const loadCompetencies = async () => {
            const data = await fetchCompetencies()
            if (data) {
                setCompetencies(data)
            }
        }
        loadCompetencies()
    }, [])

    useEffect(() => {
        const loadEvidences = async () => {
            const data = await fetchEvidences()
            if (data) {
                dispatch({ type: 'SET_EVIDENCES', payload: data })
            }
        }
        loadEvidences()
    }, [
        state.currentPage, 
        state.filters.staff, 
        state.filters.competency, 
        state.filters.status, 
        state.filters.selectedTypes, 
        debouncedSearchValue
    ])

    useEffect(() => {
        if (state.evidences.data) {
            filterEvidences()
        }
    }, [state.evidences])

    const evidenceStatusLabels = {
        all: 'All',
        pending: 'Pending',
        hrConfirmed: 'HR Approved',
        dcConfirmed: 'DC Approved',
        disapproved: 'Disapproved'
    }

    const handlePaginationClick = useCallback(
        (link, e) => {
          e.preventDefault()
    
          if (link.url) {
            const url = new URL(link.url)
            const params = new URLSearchParams(url.search)
            const page = params.get('page')
            
            if (page) {
                dispatch({ type: 'SET_CURRENT_PAGE', payload: parseInt(page, 10) })
            }
          }
        },
        [dispatch]
    )

    const handleSearch = useCallback((e) => {
        dispatch({ type: 'SET_SEARCH_TERM', payload: e.target.value })
    }, [dispatch])

    const handleFilter = useCallback((value, field) => {
        dispatch({ type: 'SET_FILTER', payload: value, field })
    }, [dispatch])

    const handleClearFilters = useCallback(() => {
        dispatch({ type: 'CLEAR_FILTERS' })
    }, [dispatch])

    const openModal = useCallback((type, evidence = null) => {
        dispatch({ type: 'OPEN_MODAL', payload: { type, evidence } })
    }, [dispatch])

    const closeModal = useCallback(() => {
        dispatch({ type: 'CLOSE_MODAL' })
    }, [dispatch])

    const handleSuccess = useCallback(() => {
        fetchEvidences()
    }, [fetchEvidences, state.currentPage])

    const filterEvidences = useCallback(() => {
        const filtered = state.evidences.data?.filter((evidence) => {
          const matchesSearch =
            evidence.title?.toLowerCase().includes(debouncedSearchValue.toLowerCase()) ||
            evidence.description?.toLowerCase().includes(debouncedSearchValue.toLowerCase())
    
          const matchesStatusFilter =
            state.filters.status === "all" ||
            (state.filters.status === "disapproved" && evidence.disapproved === 1) ||
            (state.filters.status === "pending" && evidence.hr_confirmation === null && evidence.dc_confirmation === null) ||
            (state.filters.status === "hrConfirmed" && evidence.hr_confirmation !== null) ||
            (state.filters.status === "dcConfirmed" && evidence.dc_confirmation !== null) 
    
          return matchesSearch && matchesStatusFilter
        })
        dispatch({ type: 'SET_FILTERED_EVIDENCES', payload: filtered })
      }, [state.evidences, debouncedSearchValue, state.filters.status])

  return (
    <div className="grid grid-cols-[300px,1fr] gap-4 h-full w-full">
        <div className="flex flex-col gap-2 h-full">
            <h4 className="text-normal font-semibold">Filter Evidences</h4>

            <ScrollArea className="pb-4 h-full">
                <div className="h-12 flex flex-col gap-6 pr-6">
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="staff">Competency</Label>
                        <SingleComboBox 
                            items={competencies} 
                            onChange={(value => handleFilter(value, 'competency'))}
                            value={state.filters.competency}
                            placeholder="Select competency"
                            name="competency"
                            id="competency"
                            width="w-[400px]"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <Label htmlFor="staff">Staff</Label>
                        <SingleComboBox 
                            items={employees} 
                            onChange={(value => handleFilter(value, 'staff'))}
                            value={state.filters.staff}
                            placeholder="Select staff"
                            name="staff"
                            id="staff"
                            width="w-[400px]"
                        />
                    </div>

                    <div className="flex flex-col gap-3">
                        <Label htmlFor="staff">Approval Status</Label>
                        <RadioGroup
                            value={state.filters.status}
                            onValueChange={(value) => handleFilter(value, 'status')}
                            className="flex flex-col gap-2"
                        >
                            {Object.keys(evidenceStatusLabels).map((key) => (
                                <div className="inline-flex justify-between items-center" key={key}>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value={key} id={key} />
                                        <Label htmlFor={key}>{evidenceStatusLabels[key]}</Label>
                                    </div>
                                    <div>
                                        <Badge variant={state.filters.status !== key ? "outline" : ""}>{formatNumberWithCommas(state.evidenceStatusCounts[key] || 0)}</Badge>
                                    </div>
                                </div>
                            ))}
                        </RadioGroup>
                    </div>

                    <div className="flex flex-col gap-3">
                        <Label htmlFor="staff">Type of Evidence</Label>
                        <div className="flex flex-col gap-2">
                        {Object.keys(state.evidenceTypeCounts).map((key) => {
                            const formattedKey = key.charAt(0).toUpperCase() + key.slice(1)
                            const isSelected = state.filters.selectedTypes.includes(formattedKey)

                            return (
                                <div className="inline-flex justify-between items-center" key={key}>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox 
                                            id={key} 
                                            checked={isSelected}
                                            onCheckedChange={() => {
                                                const newSelectedTypes = isSelected 
                                                    ? state.filters.selectedTypes.filter(type => type !== formattedKey)
                                                    : [...state.filters.selectedTypes, formattedKey]

                                                dispatch({
                                                    type: 'SET_SELECTED_TYPES',
                                                    payload: newSelectedTypes,
                                                })
                                            }} 
                                        />
                                        <label
                                            htmlFor={key}
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        >
                                            {formattedKey}
                                        </label>
                                    </div>
                                    <div>
                                        <Badge variant={!isSelected ? "outline" : ""}>{formatNumberWithCommas(state.evidenceTypeCounts[key] || 0)}</Badge>
                                    </div>
                                </div>
                            )
                        })}
                        </div>
                    </div>
                    <div className="flex justify-start">
                        <Button onClick={handleClearFilters} variant="outline" className="w-full">Clear Filters</Button>
                    </div>
                </div>
            </ScrollArea>
        </div>
        <div className="grid grid-rows-[auto,1fr,auto] gap-2 h-full">
            <div className="flex flex-col gap-2">
                <Label htmlFor="search">Search title or context</Label>
                <div className="relative">
                    <Search className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Type to search..."
                        type="search"
                        value={state.searchTerm}
                        onChange={handleSearch}
                        className="text-sm pl-8 w-full"
                    />
                </div>
            </div>
            <ScrollArea className="p-4 rounded-md border">
                {!state.loading ? (
                    state.filteredEvidences && state.filteredEvidences.length > 0 ? (
                        <div className="h-12">
                            {state.filteredEvidences.map((evidence) => {
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
                                                        <span className="font-medium text-sm">{evidence.hr_remarks}</span>
                                                    </div>
                                                )}
                                                {evidence.dc_remarks && (
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-muted-foreground">DC Remarks:</span>
                                                        <span className="font-medium text-sm">{evidence.dc_remarks}</span>
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
                                                        <span className="font-medium text-sm">{evidence.hr_remarks}</span>
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
                                                        <span className="font-medium text-sm">{evidence.dc_remarks}</span>
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
                                                        <span className="font-medium text-sm">{evidence.disapproved_remarks}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    }

                                    return { status, approver, approvalDate, remarks }
                                })()

                                const employee = employees.find(emp => emp.value === evidence.emp_id)

                                return (
                                    <div key={evidence.id} className="flex flex-col w-full items-start gap-2 rounded-lg border p-4 text-left text-sm transition-all hover:bg-accent mb-4">
                                        <div className="flex w-full flex-col gap-2">
                                        <div className="flex w-full justify-between gap-4">
                                            <div className="flex flex-col gap-2 w-full">
                                                <div className="inline-flex items-center gap-2">
                                                    <Avatar className="size-8">
                                                        <AvatarImage src={`/employees/image/${evidence.emp_id}`} loading="lazy" />
                                                        <AvatarFallback>{employee ? employee.label : 'Unknown Staff'}</AvatarFallback>
                                                    </Avatar>
                                                    <span className="font-semibold text-sm">{employee ? employee.label : 'Unknown Staff'}</span>
                                                </div>
                                                <div className="flex flex-col gap-2">
                                                    <div className="flex flex-col lg:flex-row lg:justify-between gap-4">
                                                        <div className="flex flex-1 flex-col">
                                                            <span className="text-xs text-muted-foreground">Competency:</span>
                                                            <span className="font-medium">{evidence.competency} (Level {evidence.proficiency})</span>
                                                        </div>
                                                        <div className="flex flex-1 flex-col">
                                                            <span className="text-xs text-muted-foreground">Indicator:</span>
                                                            <span className="font-medium">{evidence.indicator}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col lg:flex-row lg:justify-between gap-4">
                                                        <div className="flex flex-1 flex-col">
                                                            <span className="text-xs text-muted-foreground">Title of Evidence:</span>
                                                            <span className="font-medium">{evidence.title}</span>
                                                        </div>
                                                        <div className="flex flex-1 flex-col">
                                                            <div className="flex flex-col lg:flex-row lg:justify-between gap-2">
                                                                <div className="flex flex-1 flex-col">
                                                                    <span className="text-xs text-muted-foreground">Date of Evidence:</span>
                                                                    <span className="font-medium">
                                                                        {evidence.start_date ? `${formatDate(evidence.start_date)} - ${formatDate(evidence.end_date)}` : ''}
                                                                    </span>
                                                                </div>
                                                                <div className="flex flex-1 flex-col">
                                                                    <span className="text-xs text-muted-foreground">Type of Evidence:</span>
                                                                    <span className="font-medium">{evidence.reference}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col lg:flex-row lg:justify-between gap-4">
                                                        <div className="flex flex-1 flex-col">
                                                            <span className="text-xs text-muted-foreground">Context:</span>
                                                            <span>{evidence.description}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col lg:flex-row lg:justify-between gap-4">
                                                        <div className="flex flex-1 flex-col gap-2">
                                                            <div className="flex flex-col gap-1">
                                                                <span className="text-xs text-muted-foreground">Approval Status:</span>
                                                                <div className="inline-flex gap-4 items-center">
                                                                    <span className="inline-block">
                                                                        <Badge className="rounded-lg" variant={status === 'Disapproved' && 'destructive'}>{status}</Badge>
                                                                    </span>
                                                                    {['HR Approved', 'DC Approved', 'HR and DC Approved'].includes(status) ? (
                                                                        <span className="text-xs">
                                                                            Approved by <strong>{approver}</strong>{approvalDate}
                                                                        </span>
                                                                    ) : status === 'Disapproved' ? (
                                                                        <span className="text-xs">
                                                                            Disapproved by <strong>{approver}</strong>{approvalDate}
                                                                        </span>
                                                                    ) : null}
                                                                </div>
                                                            </div>
                                                            <span>
                                                                {['HR Approved', 'DC Approved', 'HR and DC Approved', 'Disapproved'].includes(status) && remarks}
                                                            </span>
                                                        </div>
                                                        <div className="flex flex-1 flex-col">
                                                            <span className="text-xs text-muted-foreground">Supporting Documents:</span>
                                                            <span className="font-medium">{state.files[evidence.id] && <AttachmentList files={state.files[evidence.id]} evidence={evidence} />}</span>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex gap-2 mt-2">
                                                        {((evidence.hr_confirmation === null || evidence.dc_confirmation === null) || evidence.disapproved === 1) && user.ipms_id !== evidence.emp_id && (
                                                            <Button 
                                                            onClick={() => openModal('approve', evidence)}
                                                            size="sm" 
                                                            className=""
                                                            >
                                                                Approve
                                                            </Button>
                                                        )}
                                                        {evidence.disapproved === null && user.ipms_id !== evidence.emp_id && (
                                                            <Button 
                                                            onClick={() => openModal('disapprove', evidence)}
                                                            size="sm" 
                                                            variant="ghost"
                                                            >
                                                                Disapprove
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="flex flex-col flex-1 items-center justify-center h-full">
                            <span className="text-center w-full text-sm font-semibold">No records yet</span>
                            <span className="text-center w-full text-xs">Once a staff adds evidence, it will appear here.</span>
                        </div>
                    )
                ) : (
                    <div className="flex items-center justify-center w-full h-full text-sm flex-1">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        <span>Loading evidences...</span>
                    </div>
                )}
            </ScrollArea>


            <div className="inline-flex gap-2 items-center justify-between">
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
                <div className="text-xs font-medium">
                    Showing {startIndex}-{endIndex} of {total} items
                </div>
            </div>
        </div>

        <ApproveForm 
          evidence={state.selectedEvidence}
          open={state.activeModal === 'approve'} 
          onClose={closeModal} 
          onSuccess={handleSuccess} 
        />

        <DisapproveForm 
          evidence={state.selectedEvidence}
          open={state.activeModal === 'disapprove'} 
          onClose={closeModal} 
          onSuccess={handleSuccess} 
        />
    </div>
  )
}

export default Evidences