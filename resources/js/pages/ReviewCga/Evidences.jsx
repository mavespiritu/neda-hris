import SingleComboBox from "@/components/SingleComboBox"
import { useState, useEffect, useCallback, useMemo } from "react"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import useDebounce from "@/hooks/useDebounce"
import { useToast } from "@/hooks/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatDate, formatNumberWithCommas } from "@/lib/utils.jsx"
import ComponentLoading from "@/components/ComponentLoading"
import { Button } from "@/Components/ui/button"
import { SquarePen, Search, AlertCircle } from 'lucide-react'
import AttachmentList from "@/pages/MyCga/AttachmentList"
import ApproveForm from "@/pages/ReviewCga/ApproveForm"
import DisapproveForm from "@/pages/ReviewCga/DisapproveForm"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    Alert,
    AlertDescription,
    AlertTitle,
  } from "@/components/ui/alert"

const Evidences = () => {

    const { toast } = useToast()

    const [roles, setRoles] = useState([])
    const [employees, setEmployees] = useState([])
    const [competencies, setCompetencies] = useState([])

    const references = useMemo(() => ["Training", "Award", "Performance", "Others"], [])

    const itemsPerPage = 20

    const evidenceStatusLabels = {
        all: 'All',
        pending: 'Pending',
        hrConfirmed: 'HR Approved',
        dcConfirmed: 'DC Approved',
        disapproved: 'Disapproved'
    }

    const [state, setState] = useState({
        evidences: [],
        files: [],
        filters: {
            staff: null,
            competency: null,
            status: "all",
            selectedTypes: references,
        },
        searchTerm: "",
        activeModal: null,
        loading: true,
        filteredEvidences: [],
        activeModal: null,
        currentPage: 1,
        selectedEvidence: null,
        evidenceStatusCounts: { all: 0, pending: 0, hrConfirmed: 0, dcConfirmed: 0, disapproved: 0 },
        evidenceTypeCounts: { training: 0, award: 0, performance: 0, others: 0 },
    })

    const debouncedSearchValue = useDebounce(state.searchTerm, 500)

    const referencesJoined = useMemo(() => state.filters.selectedTypes.join(","), [state.filters.selectedTypes])

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

    const fetchCompetencies = async () => {
        try {
            const response = await fetch(`/review-cga/competencies`)
            if (!response.ok) {
                toast({
                    title: "Uh oh! Something went wrong.",
                    description: "Network response was not ok",
                })
            }
            const data = await response.json()
          
            setCompetencies(data)

        } catch (err) {
            toast({
                title: "Uh oh! Something went wrong.",
                description: "There was a problem with your request",
            })
        }
    }

    const fetchRoles = async () => {
        try {
            const response = await fetch(`/roles`)
            if (!response.ok) {
                toast({
                    title: "Uh oh! Something went wrong.",
                    description: "Network response was not ok",
                })
            }
            const data = await response.json()
          
            setRoles(data)

        } catch (err) {
            toast({
                title: "Uh oh! Something went wrong.",
                description: "There was a problem with your request",
            })
        }
    }

    // Function to fetch evidences and counts
    const fetchEvidences = useCallback(async () => {
        setState((prev) => ({ ...prev, loading: true }))
            try {
            const evidencesResponse = await fetch(`/review-cga/evidences?page=${state.currentPage}&competency=${state.filters.competency}&emp_id=${state.filters.staff}&status=${state.filters.status}&selectedTypes=${state.filters.selectedTypes}&search=${debouncedSearchValue}`)

            if (!evidencesResponse.ok) {
                throw new Error("Network response was not ok")
            }

            const evidences = await evidencesResponse.json()

            setState((prev) => ({
                ...prev,
                evidences: evidences.evidences,
                files: evidences.files,
                staffs: evidences.staffs,
                evidenceStatusCounts: evidences.evidenceStatusCounts,
                evidenceTypeCounts: evidences.evidenceTypeCounts,
                loading: false,
            }))

            } catch (error) {
                console.error(error.message)
                setState((prev) => ({ ...prev, loading: false }))
            }
    }, [state.currentPage, state.filters, debouncedSearchValue])

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

    const handleSearch = useCallback((e) => {
        setState((prev) => ({
            ...prev,
            searchTerm: e.target.value
        }))
    }, [])

    const handleFilter = useCallback((value, field) => {
        setState((prev) => ({
            ...prev,
            currentPage: 1,
            filters: {
                ...prev.filters,
                [field]: value
            }
        }))
    }, [])

    const openModal = useCallback((type, evidence = null) => {
        setState((prev) => ({ ...prev, activeModal: type, selectedEvidence: evidence }))
    }, [])

    const closeModal = useCallback(() => {
        setState((prev) => ({ ...prev, activeModal: null, selectedEvidence: null }))
    }, [])

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
        setState((prev) => ({ ...prev, filteredEvidences: filtered }))
      }, [state.evidences, debouncedSearchValue, state.filters.status])

    useEffect(() => {
        fetchActiveEmployees()
        fetchCompetencies()
        fetchRoles()
        console.log("fetch active employees and competencies")
    }, [])

    useEffect(() => {
        fetchEvidences()
        console.log("fetch active evidences")
        console.log(state)
    }, [state.currentPage, state.filters, debouncedSearchValue, fetchEvidences])

    useEffect(() => {
        filterEvidences()
      }, [state.evidences, debouncedSearchValue, state.filters.status, filterEvidences])

    const total = state.evidences?.total || 0
    const startIndex = (state.currentPage - 1) * itemsPerPage + 1
    const endIndex = Math.min(startIndex + itemsPerPage - 1, total)

  return (
    <div className="grid grid-cols-[300px,1fr] gap-4 h-full w-full">
        <div className="flex flex-col gap-2 h-full">
            <h4 className="text-normal font-semibold">Filter Evidences</h4>

            <ScrollArea className="pr-2 pb-4 h-full">
                <div className="h-12 flex flex-col gap-6 p-2">
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
                            defaultValue={state.filters.status}
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
                                                setState((prev) => ({
                                                    ...prev,
                                                    filters: {
                                                        ...prev.filters,
                                                        selectedTypes: isSelected 
                                                            ? prev.filters.selectedTypes.filter(type => type !== formattedKey) 
                                                            : [...prev.filters.selectedTypes, formattedKey]
                                                    }
                                                }))
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
                                        remarks = evidence.dc_remarks || evidence.hr_remarks ? `DC Remarks: ${evidence.dc_remarks} and HR Remarks: ${evidence.hr_remarks}` : ""
                                    } else if (evidence.hr_confirmation === 1) {
                                        status = 'HR Approved'
                                        approver = employees.find(emp => emp.value === evidence.hr_confirmed_by)?.label
                                        approvalDate = ` on ${formatDate(evidence.hr_date)}`
                                        remarks = evidence.hr_remarks ? `HR Remarks: ${evidence.hr_remarks}` : ""
                                    } else if (evidence.dc_confirmation === 1) {
                                        status = 'DC Approved'
                                        approver = employees.find(emp => emp.value === evidence.dc_confirmed_by)?.label
                                        approvalDate = ` on ${formatDate(evidence.dc_date)}`
                                        remarks = evidence.dc_remarks ? `DC Remarks: ${evidence.dc_remarks}` : ""
                                    } else if (evidence.disapproved === 1) {
                                        status = 'Disapproved'
                                        approver = employees.find(emp => emp.value === evidence.disapproved_by)?.label
                                        approvalDate = ` on ${formatDate(evidence.disapproved_date)}`
                                        remarks = evidence.disapproved_remarks ? `Remarks: ${evidence.disapproved_remarks}` : ""
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
                                                            <span className="text-xs text-muted-foreground">Title of Evidence:</span>
                                                            <span className="font-medium">{evidence.title}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col lg:flex-row lg:justify-between gap-4">
                                                        <div className="flex flex-1 flex-col">
                                                            <span className="text-xs text-muted-foreground">Indicator:</span>
                                                            <span className="font-medium">{evidence.indicator}</span>
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
                                                        <div className="flex flex-1 flex-col">
                                                            <span className="text-xs text-muted-foreground">Approval Status:</span>
                                                            <span className="font-medium">{status}</span>
                                                        </div>
                                                        <div className="flex flex-1 flex-col">
                                                            <span className="text-xs text-muted-foreground">Supporting Documents:</span>
                                                            <span className="font-medium">{state.files[evidence.id] && <AttachmentList files={state.files[evidence.id]} evidence={evidence} />}</span>
                                                        </div>
                                                    </div>
                                                    {approver && (
                                                        <Alert variant={status === 'Disapproved' ? 'destructive' : ''}>
                                                            <AlertCircle className="h-4 w-4" />
                                                            <AlertTitle className="leading-normal">
                                                                {['HR Approved', 'DC Approved', 'HR and DC Approved'].includes(status) ? (
                                                                    <span>
                                                                        Approved by <strong>{approver}</strong>{approvalDate}
                                                                    </span>
                                                                ) : status === 'Disapproved' ? (
                                                                    <span>
                                                                        Disapproved by <strong>{approver}</strong>{approvalDate}
                                                                    </span>
                                                                ) : null}
                                                            </AlertTitle>
                                                            
                                                            {['HR Approved', 'DC Approved', 'HR and DC Approved', 'Disapproved'].includes(status) ? (
                                                                <AlertDescription className="text-xs">
                                                                    {remarks}
                                                                    </AlertDescription>
                                                            ) : null}
                                                        </Alert>
                                                    )}
                                                    
                                                    <div className="flex gap-2 mt-2">
                                                        {((evidence.hr_confirmation === null || evidence.dc_confirmation === null) || evidence.disapproved === 1) && (
                                                            <Button 
                                                            onClick={() => openModal('approve', evidence)}
                                                            size="sm" 
                                                            className=""
                                                        >
                                                            Approve
                                                        </Button>
                                                        )}
                                                        <Button 
                                                            onClick={() => openModal('disapprove', evidence)}
                                                            size="sm" 
                                                            variant="outline"
                                                        >
                                                            Disapprove
                                                        </Button>
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
                    <ComponentLoading />
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