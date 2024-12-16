import SingleComboBox from "@/components/SingleComboBox"
import { useState, useEffect, useCallback, useMemo, useReducer } from "react"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import useDebounce from "@/hooks/useDebounce"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { SquarePen, Search, Loader2, SlidersHorizontal, ChevronDown, MessageCirclePlus, Pencil, Trash2 } from 'lucide-react'
import RemarksForm from "@/pages/ReviewCga/RemarksForm"
import CompetenciesList from "@/pages/ReviewCga/CompetenciesList"
import EvidencesList from "@/pages/ReviewCga/EvidencesList"
import { Link } from '@inertiajs/react'
import { useTextSize } from "@/providers/TextSizeProvider"
import { useUser } from "@/providers/UserProvider"
import { Switch } from "@/components/ui/switch"
import { format } from 'date-fns'
import { usePage, useForm } from '@inertiajs/react'
import useCompetencyReviewStore from '@/stores/useCompetencyReviewStore'

import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table"

  import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
  } from "@/components/ui/tooltip"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"


/* const initialCompetenciesState = {
    currentPage: 1,
    competencies: [],
    loading: true,
    filteredCompetencies: [],
    currentPage: 1,
    selectedCompetency: null,
    searchTerm: "",
    filters: {
        staff: null,
        status: "pending"
    }
}

const initialSelectedCompetencyDetailsState = {
    competencies: [],
    loading: true
}

const initialCompetencyForReviewState = {
    expandedRows: {},
    additionalInfo: {},
    loadingInfo: {},
    type: null,
    selectedIndicator: null
}

function competenciesReducer(state, action) {
    switch (action.type) {
        case 'SET_COMPETENCIES':
            return { ...state, competencies: action.payload, loading: false }
        case 'SET_FILTERED_COMPETENCIES':
            return { ...state, filteredCompetencies: action.payload }
        case 'SET_LOADING':
            return { ...state, loading: action.payload }
        case 'SET_SEARCH_TERM':
            return { ...state, searchTerm: action.payload }
        case 'SET_FILTER':
            return {
                ...state,
                currentPage: 1,
                filters: { ...state.filters, [action.field]: action.payload }
            }
        case 'CLEAR_FILTERS':
            return { ...state, filters: { staff: null } }
        case 'SET_SELECTED_COMPETENCY':
            return { ...state, selectedCompetency: action.payload }
        case 'SET_CURRENT_PAGE':
            return { ...state, currentPage: action.payload }
        case 'UPDATE_SELECTED_COMPETENCY':

        const { approver, dateApproved } = action.payload

        const updatedCompetencies = state.competencies.data.filter(comp => comp.id !== state.selectedCompetency.id)
        const updatedFilteredCompetencies = state.filteredCompetencies.filter(comp => comp.id !== state.selectedCompetency.id)

        return {
            ...state,
            selectedCompetency: {
                ...state.selectedCompetency,
                approver,
                date_acted: dateApproved,
                status: 'Approved'
            },
            competencies: {
                ...state.competencies,
                data: updatedCompetencies
            },
            filteredCompetencies: updatedFilteredCompetencies,
        }
        default:
            return state
    }
}

function competencyDetailsReducer(state, action) {
    switch (action.type) {
        case 'SET_COMPETENCIES':
            return { ...state, competencies: action.payload, loading: false }
        case 'UPDATE_COMPETENCY_PERCENTAGE': {
            const { competencyId, type, newPercentage } = action.payload

            if (!state.competencies[type]) return state

            const updatedCompetencies = {
                ...state.competencies,
                [type]: state.competencies[type].map(competency => 
                    competency.competency_id === competencyId
                        ? { ...competency, percentage: newPercentage }
                        : competency
                )
            }

            return {
                ...state,
                competencies: updatedCompetencies
            }
        }
        default:
            return state
    }
}

function competencyForReviewReducer(state, action) {
     
    switch (action.type) {
        case 'TOGGLE_ROW':
            return { 
                ...state, 
                expandedRows: {
                    ...state.expandedRows,
                    [action.payload.competencyId]: !state.expandedRows[action.payload.competencyId]
                } 
            }
        case 'SET_ADDITIONAL_INFO':
            return {
                ...state,
                additionalInfo: {
                    ...state.additionalInfo,
                    [action.payload.competencyId]: action.payload.data
                }
            }
        case 'SET_LOADING':
            return { 
                ...state, 
                loadingInfo: {
                    ...state.loadingInfo,
                    [action.payload.competencyId]: action.payload.isLoading
                } 
            }
        case 'SET_ERROR':
            return { 
                ...state, 
                additionalInfo: {
                    ...state.additionalInfo,
                    [action.payload.competencyId]: null
                },
                loadingInfo: {
                    ...state.loadingInfo,
                    [action.payload.competencyId]: false
                }
            }
        case 'UPDATE_ADDITIONAL_INFO': {
            const { competencyId, updatedIndicator } = action.payload

            return {
                ...state,
                additionalInfo: {
                    ...state.additionalInfo,
                    [competencyId]: updatedIndicator,
                },
            }
        }
        case 'OPEN_MODAL':
            return { ...state, type: action.payload.type, selectedIndicator: action.payload.indicator }
        case 'CLOSE_MODAL':
            return { ...state, type: null, selectedIndicator: null }
        case 'RESET_STATE':
            return initialCompetencyForReviewState
        default:
            return state
    }
}

function useFetchCompetencies(state, dispatch, toast) {
    const fetchCompetencies = useCallback(async (tab) => {
        try {
            const params = new URLSearchParams()
            if (state.currentPage) params.append('page', state.currentPage)
            if (state.filters.staff) params.append('emp_id', state.filters.staff)
            if (state.searchTerm) params.append('search', state.searchTerm)
            params.append('status', tab)

            const response = await fetch(`/review-cga/competencies-for-review?${params.toString()}`)
            if (!response.ok){
                toast({
                    title: "Uh oh! Something went wrong.",
                    description: "There was a problem with your request",
                    variant: "destructive",
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
            dispatch({ type: 'SET_LOADING', payload: false })
        }
    }, [state, toast])

    return fetchCompetencies
}

function useFetchSelectedCompetencyDetails(selectedCompetency, dispatch, toast) {
    const fetchSelectedCompetencyDetails = useCallback(async () => {
        if (!selectedCompetency) return
        
        try {
            const response = await fetch(`/review-cga/competencies-for-review/${selectedCompetency.id}`)
            if (!response.ok) {
                toast({
                    title: "Uh oh! Something went wrong.",
                    description: "There was a problem fetching competency details",
                    variant: "destructive",
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
            dispatch({ type: 'SET_LOADING', payload: false })
        }
    }, [selectedCompetency, toast])

    return fetchSelectedCompetencyDetails
}

function useFetchCompetencyForReview(state, dispatch, toast) {
    const fetchCompetencyForReview = useCallback(
        async (competency) => {
            const {id, competency_id: competencyId } = competency

            dispatch({ type: "SET_LOADING", payload: { competencyId, isLoading: true } })

            try {
                const response = await fetch(`/review-cga/competencies-for-review/competency/${id}`)
                if (!response.ok) {
                    toast({
                        title: "Uh oh! Something went wrong.",
                        description: "There was a problem with your request",
                        variant: "destructive",
                    })
                    dispatch({ type: "SET_LOADING", payload: { competencyId, isLoading: false } })
                }
                const data = await response.json()

                dispatch({ type: "SET_ADDITIONAL_INFO", payload: { competencyId, data } })
                dispatch({ type: "SET_LOADING", payload: { competencyId, isLoading: false } })

            } catch (error) {
                toast({
                    title: "Uh oh! Something went wrong.",
                    description: "Network response was not ok",
                    variant: "destructive"
                })
                dispatch({ type: "SET_LOADING", payload: { competencyId, isLoading: false } })
            }
        },
        [toast]
    )

    return fetchCompetencyForReview
} */

const Competencies = ({employees}) => {

    const textSize = useTextSize()
    const { user } = useUser()
    const { toast } = useToast()
    /* const { post } = useForm() */
    const debouncedSearchValue = useDebounce(competenciesState.searchTerm, 500)

    /* const [competenciesState, competenciesDispatch] = useReducer(competenciesReducer, initialCompetenciesState)
    const [competencyDetailsState, competencyDetailsDispatch] = useReducer(competencyDetailsReducer, initialSelectedCompetencyDetailsState)
    const [competencyForReviewState, competencyForReviewDispatch] = useReducer(competencyForReviewReducer, initialCompetencyForReviewState)

    

    const fetchCompetencies = useFetchCompetencies(competenciesState, competenciesDispatch, toast)
    const fetchSelectedCompetencyDetails = useFetchSelectedCompetencyDetails(competenciesState.selectedCompetency, competencyDetailsDispatch, toast)
    const fetchCompetencyForReview = useFetchCompetencyForReview(competencyForReviewState, competencyForReviewDispatch, toast) */

    const itemsPerPage = 20
    /* const total = useMemo(() => competenciesState.competencies?.total || 0, [competenciesState.competencies]) */
    

    const [activeTab, setActiveTab] = useState(() => {
        return localStorage.getItem('HRIS_ReviewCGA_activeCompetenciesTab') || 'Pending'
    })

    /* useEffect(() => {
        const loadCompetencies = async () => {
            const data = await fetchCompetencies(activeTab)
            if (data) {
                competenciesDispatch({ type: 'SET_COMPETENCIES', payload: data })
            }
        }
        loadCompetencies()
    }, [ 
        competenciesState.currentPage, 
        competenciesState.filters.staff, 
        debouncedSearchValue,
        activeTab,
    ]) */

    const {
        setToast,
        competenciesState: { 
            competencies, 
            currentPage,
            loading: competenciesLoading, 
            filters,
            selectedCompetency 
        },
        indicatorsState: {
            expandedRows,
            additionalInfo: indicatorAdditionalInfo,
            loadingAdditionalInfo: loadingIndicatorAdditionalInfo
        },
        loadCompetencies,
        loadSelectedCompetency,
        setFilteredCompetencies,
        setFilters,
        setSelectedCompetency,
        setCurrentPage,
        updateCompliance,
        openIndicatorModal,
        closeIndicatorModal,
        approveCompetency,
        updateIndicatorAdditionalInfo,
        deleteRemarks
    } = useCompetencyReviewStore()

    /* const total = useMemo(() => competenciesState.competencies?.total || 0, [competencies])
    const startIndex = useMemo(() => (competenciesState.currentPage - 1) * itemsPerPage + 1, [competenciesState.currentPage])
    const endIndex = useMemo(() => Math.min(startIndex + itemsPerPage - 1, total), [startIndex, total]) */

    const total = useMemo(() => competencies?.total || 0, [competencies])
    const startIndex = useMemo(() => (currentPage - 1) * itemsPerPage + 1, [currentPage])
    const endIndex = useMemo(() => Math.min(startIndex + itemsPerPage - 1, total), [startIndex, total])

    useEffect(() => {
        setToast(toast)
    }, [toast, setToast])

    useEffect(() => {
        loadCompetencies(filters.status)
    }, [filters.status])
    

    /* useEffect(() => {
        if (competenciesState.competencies.data) {
            filterCompetencies(activeTab)
        }
    }, [
        competenciesState.competencies.data, 
        debouncedSearchValue, 
        activeTab
    ]) */

    useEffect(() => {
        if (competencies.data) {
            handleFilterCompetencies(activeTab)
        }
    }, [
        competencies.data, 
        debouncedSearchValue, 
        activeTab
    ])

    /* useEffect(() => {
        if (competenciesState.selectedCompetency) {
            const loadSelectedCompetencyDetails = async () => {
                const data = await fetchSelectedCompetencyDetails()
                if (data) {
                    competencyDetailsDispatch({ type: 'SET_COMPETENCIES', payload: data })
                    competencyForReviewDispatch({ type: '+STATE' })
                }
            }
            loadSelectedCompetencyDetails()
            
        }
    }, [competenciesState.selectedCompetency]) */

    useEffect(() => {
        if (selectedCompetency) {
            loadSelectedCompetency()
        }
    }, [selectedCompetency])

    useEffect(() => {
        localStorage.setItem('HRIS_ReviewCGA_activeCompetenciesTab', activeTab)
    }, [activeTab])

    const handleTabChange = (value) => {
        setActiveTab(value)
        setFilters('status', value)
        //competenciesDispatch({ type: 'SET_FILTER', field: 'status', payload: value })
    }

    /* const handleCompetencyClick = useCallback((competencyId) => {
        const selectedCompetency = competenciesState.competencies.data.find(comp => comp.id === competencyId)
        competenciesDispatch({
            type: 'SET_SELECTED_COMPETENCY',
            payload: selectedCompetency
        })
        }, [competenciesState.competencies.data]
    ) */

    const handleCompetencyClick = useCallback((competencyId) => {
        const selectedCompetency = competencies.data.find(comp => comp.id === competencyId)
        setSelectedCompetency(selectedCompetency)
        }, [setSelectedCompetency]
    )

    /* const handlePaginationClick = useCallback((link, e) => {
          e.preventDefault()

          if (link.url) {
            const url = new URL(link.url)
            const params = new URLSearchParams(url.search)
            const page = params.get('page') 
            
            if (page) {
                competenciesDispatch({ type: 'SET_CURRENT_PAGE', payload: parseInt(page, 10) })
            }
          }
        }, [competenciesDispatch]
    ) */

    const handlePaginationClick = useCallback((link, e) => {
        e.preventDefault()

        if (link.url) {
            const url = new URL(link.url)
            const params = new URLSearchParams(url.search)
            const page = params.get('page') 
            
            if (page) {
                setCurrentPage(parseInt(page, 10))
            }
        }
        }, [setCurrentPage]
    )

    /* const filterCompetencies = useCallback((activeTab) => {
        
        const filtered = competenciesState.competencies.data?.filter((competency) => {
            const matchesSearch =
            competency.staff?.toLowerCase().includes(debouncedSearchValue.toLowerCase()) ||
            competency.date_submitted?.toLowerCase().includes(debouncedSearchValue.toLowerCase())

            return matchesSearch
        })
        competenciesDispatch({ type: 'SET_FILTERED_COMPETENCIES', payload: filtered })

    }, [
        competenciesState.competencies.data, 
        competenciesState.filters.status,
        debouncedSearchValue,
    ]) */

    const handleFilterCompetencies = useCallback((activeTab) => {
        
        const filtered = competencies.data?.filter((competency) => {
            const matchesSearch =
            competency.staff?.toLowerCase().includes(debouncedSearchValue.toLowerCase()) ||
            competency.date_submitted?.toLowerCase().includes(debouncedSearchValue.toLowerCase())

            return matchesSearch
        })
        setFilteredCompetencies(filtered)
    }, [
        competencies.data, 
        filters.status,
        debouncedSearchValue,
    ])

    /* const toggleRow = useCallback(async (competency) => {
        const competencyId = competency.competency_id

        if (!competencyForReviewState.expandedRows[competencyId] && !competencyForReviewState.additionalInfo[competencyId]) {
            await fetchCompetencyForReview(competency)
        }

        competencyForReviewDispatch({ type: 'TOGGLE_ROW', payload: { competencyId } })

    }, [
        competencyForReviewState.expandedRows, 
        competencyForReviewState.additionalInfo, 
        fetchCompetencyForReview
    ]) */

    const handleExpandRow = useCallback(async (competency) => {
        const competencyId = competency.competency_id

        if (!expandedRows[competencyId] && !indicatorAdditionalInfo[competencyId]) {
            await loadIndicators(competency)
        }
        expandCompetencyRow(competencyId)
    }, [expandedRows])

    /* const handleToggleChange = async (competency, indicatorId, isChecked) => {
        const {competency_id: competencyId, type, emp_id, position_id, date_created, proficiency } = competency
        const updatedIndicator = competencyForReviewState.additionalInfo[competencyId].map((indicator) => {
            if (indicator.id === indicatorId) {
                return { ...indicator, compliance: isChecked ? 1 : 0 }
            }
            return indicator
        })
    
        const totalIndicators = updatedIndicator.length
        const compliantCount = updatedIndicator.filter(indicator => indicator.compliance === 1).length
        const newPercentage = totalIndicators > 0 ? parseFloat(((compliantCount / totalIndicators) * 100).toFixed(2)) : 0

        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content')
            const response = await fetch(`/review-cga/competencies-for-review/competency/${indicatorId}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken,
              },
              body: JSON.stringify({ 
                id: indicatorId, 
                compliance: isChecked ? 1 : 0,
                competency_id: competencyId,
                emp_id: emp_id,
                position_id: position_id,
                date_created: date_created,
                percentage: newPercentage,
                proficiency: proficiency
             }),
            })
            if (!response.ok) {
                
            toast({
                title: "Uh oh! Something went wrong.",
                description: "Network response was not ok",
                variant: "destructive"
            })
      
            }else{
              
                toast({
                    title: "Success!",
                    description: "The indicator compliance has been updated successfully",
                })

                competencyForReviewDispatch({
                    type: 'UPDATE_ADDITIONAL_INFO',
                    payload: { competencyId, updatedIndicator },
                })
    
                competencyDetailsDispatch({
                    type: 'UPDATE_COMPETENCY_PERCENTAGE',
                    payload: { competencyId, type, newPercentage },
                })
      
            }
        } catch (err) {
            console.log(err)
            toast({
              title: "Uh oh! Something went wrong.",
              description: "There was a problem updating your indicator compliance",
            })
        }
    } */

    const handleComplianceToggleChange = useCallback((competency, indicatorId, isChecked) => {
        const {
            competency_id: competencyId, 
            type, 
        } = competency

        const updatedIndicator = indicatorAdditionalInfo[competencyId].map((indicator) => indicator.id === indicatorId ? { ...indicator, compliance: isChecked ? 1 : 0 } : indicator)

        const compliantCount = updatedIndicator.filter(indicator => indicator.compliance === 1).length
        const newPercentage = updatedIndicator.length > 0 ? parseFloat(((compliantCount / updatedIndicator.length) * 100).toFixed(2)) : 0

        const data = {
            ...competency,
            id: indicatorId, 
            compliance: isChecked ? 1 : 0,
            percentage: newPercentage,
        }

        updateCompliance(updatedIndicator, data, type)
    }, [updateCompliance])

    /* const openModal = useCallback((type, indicator = null) => {
        competencyForReviewDispatch({ type: 'OPEN_MODAL', payload: { type: type, indicator } })
    }, [competencyForReviewDispatch]) */

    const handleOpenIndicatorModal = useCallback((type, indicator = null) => {
        openIndicatorModal(type, indicator)
    }, [openIndicatorModal])

    /* const handleCloseIndicatorModal = useCallback(() => {
        competencyForReviewDispatch({ type: 'CLOSE_MODAL' })
    }, [competencyForReviewDispatch]) */

    const handleCloseIndicatorModal = useCallback(() => {
        closeIndicatorModal()
    }, [closeIndicatorModal])

    /* const handleRemarksUpdate = useCallback((updatedRemarks, indicator) => {
        const {competency_id: competencyId, id: indicatorId } = indicator


        const updatedIndicator = competencyForReviewState.additionalInfo[competencyId].map((indicator) => {
            if (indicator.id === indicatorId) {
                return { ...indicator, remarks: updatedRemarks }
            }
            return indicator
        })

        competencyForReviewDispatch({
            type: 'UPDATE_ADDITIONAL_INFO',
            payload: { competencyId, updatedIndicator },
        })
    }, [competencyForReviewState, competencyForReviewDispatch]) */

    const handleRemarksUpdate = useCallback((updatedRemarks, indicator) => {

        const {competency_id: competencyId, id: indicatorId } = indicator

        const updatedIndicator = indicatorAdditionalInfo[competencyId].map((indicator) => indicator.id === indicatorId ? { ...indicator, remarks: updatedRemarks } : indicator)

        updateIndicatorAdditionalInfo(competencyId, updatedIndicator)
    }, [updateIndicatorAdditionalInfo])

    /* const handleRemarksDelete = async (indicator) => {
        const {competency_id: competencyId, id: indicatorId } = indicator

        const updatedIndicator = competencyForReviewState.additionalInfo[competencyId].map((indicator) => {
            if (indicator.id === indicatorId) {
                return { ...indicator, remarks: '' }
            }
            return indicator
        })

        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content')
            const response = await fetch(`/review-cga/competencies-for-review/indicator/${indicatorId}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken,
              },
              body: JSON.stringify({ 
                remarks: '',
                action: 'delete'
             }),
            })
            if (!response.ok) {
                
            toast({
                title: "Uh oh! Something went wrong.",
                description: "Network response was not ok",
                variant: "destructive"
            })
      
            }else{
              
                toast({
                    title: "Success!",
                    description: "The remarks has been cleared successfully",
                })

                competencyForReviewDispatch({
                    type: 'UPDATE_ADDITIONAL_INFO',
                    payload: { competencyId, updatedIndicator },
                })

            }
        } catch (err) {
            console.log(err)
            toast({
              title: "Uh oh! Something went wrong.",
              description: "There was a problem updating your indicator compliance",
            })
        }
    } */

    const handleRemarksDelete = async (indicator) => {
        deleteRemarks(indicator)
    }

    /* const handleApprove = async(competency) => {
        const {id: competencyId } = competency

        const approver = employees.find(employee => employee.value === user.ipms_id)
        const dateApproved = format(new Date(), 'MMMM dd, yyyy hh:mm:ss a')

        post(`/review-cga/competencies-for-review/approve/${competencyId}`, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: (res) => {

                const { flash } = res.props

                toast({
                    title: flash.title,
                    description: flash.message
                })

                competenciesDispatch({
                    type: 'UPDATE_SELECTED_COMPETENCY',
                    payload: { approver: approver.label, dateApproved },
                })

                filterCompetencies(activeTab)

            },
            onError: (res) => {

                const { flash } = res.props

                toast({
                    title: flash.title,
                    description: flash.message,
                    variant: "destructive"
                })
            }
        })
    } */

    const handleApproveCompetency = async(competency) => {
        const { id: competencyId } = competency

        const approver = employees.find(employee => employee.value === user.ipms_id)
        const dateApproved = format(new Date(), 'MMMM dd, yyyy hh:mm:ss a')

        approveCompetency(competencyId, approver, dateApproved)
    }

    return (
        <>
        <div className="flex flex-col lg:grid lg:grid-cols-[350px,1fr] gap-4 h-full w-full">
            <div className="grid grid-rows-[auto,1fr] gap-4 h-full">
                <div className="flex justify-between gap-2 items-center"
                >
                    <div>
                        <h4 className="text-normal font-semibold">Submitted Competencies</h4>
                        <span className="text-xs font-medium">
                            Showing {endIndex > 0 ? startIndex : 0}-{endIndex} of {total} items
                        </span>
                    </div>
                    
                    <Button variant="outline" size="sm" className="gap-2">
                        <SlidersHorizontal className="h-4 w-4" />
                        <span className="hidden md:block">Filter</span>
                    </Button>
                </div>
                <Tabs value={activeTab} onValueChange={handleTabChange} className="flex-grow grid grid-rows-[auto,1fr] h-full">
                    <TabsList className="w-full justify-start gap-4">
                        <TabsTrigger value="pending" className="flex gap-2">Pending</TabsTrigger>
                        <TabsTrigger value="approved" className="flex gap-2">Approved</TabsTrigger>
                    </TabsList>
                    {['pending', 'approved'].map((status) => (
                        <TabsContent key={status} value={status}>
                            <CompetenciesList 
                                state={competenciesState}
                                competencies={competenciesState.filteredCompetencies}
                                loading={competenciesState.loading}
                                selectedCompetency={competenciesState.selectedCompetency}
                                onClick={handleCompetencyClick}
                                handlePaginationClick={handlePaginationClick}
                            />
                        </TabsContent>
                    ))}
                </Tabs>
            </div>
            {competenciesState.selectedCompetency ? (
            <div className="grid grid-rows-[auto,1fr] gap-2 h-full border rounded-lg p-4">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h4 className="text-normal font-semibold">Review Competency of {competenciesState.selectedCompetency.staff}</h4>
                        <span className="text-sm font-medium">Submitted on {competenciesState.selectedCompetency.date_submitted}</span>
                    </div>
                    {!competenciesState.selectedCompetency.status ? (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button>Approve Submission</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure you want to approve this submission?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                    This action cannot be undone. Once approved, reviewing of this submission will no longer be available.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel className="border-0">Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleApprove(competenciesState.selectedCompetency)}>Continue</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    ) : (
                        <div className="flex flex-col text-right">
                            <h4 className="text-normal font-semibold">Approved by {competenciesState.selectedCompetency?.approver}</h4>
                            <span className="text-sm font-medium">Approved on {competenciesState.selectedCompetency.date_acted}</span>
                        </div>
                    )}
                </div>
                <span className="text-xs">Note: Highlighted rows indicate competencies that require review due to changes in compliance made by the staff.</span>
                <div>
                {!competencyDetailsState.loading ? (
                    Object.keys(competencyDetailsState.competencies).length > 0 ? (
                        Object.keys(competencyDetailsState.competencies).map((type, i) => (
                            <div key={`${type}-${i}`} className="mb-2">
                                <div className="text-sm text-center font-semibold mb-2 sticky top-0 z-20 bg-gray-100 p-2">
                                    {type}
                                </div>
                                <div className="flex flex-col gap-1">
                                    {competencyDetailsState.competencies[type].map((competency, j) => (
                                        <div key={`${type}-${competency.competency_id}-${j}`}>
                                            <Link
                                                key={`link-${type}-${competency.competency_id}-${j}`}
                                                className={`flex justify-between items-center flex-1 rounded-md ${textSize} transition-colors 
                                                            disabled:pointer-events-none disabled:opacity-50 hover:bg-muted h-9 p-2 gap-2 hover:cursor-pointer font-medium
                                                ${competency.isUpdated === 1 && "bg-red-200 hover:bg-red-200"}
                                                ${competencyForReviewState.expandedRows[competency.competency_id] && "bg-muted font-semibold"}             
                                                `}
                                                onClick={() => toggleRow(competency)}
                                                title={competency.competency}
                                                preserveState
                                                preserveScroll
                                            >
                                                <span className="break-words">{competency.competency} ({competency.proficiency})</span>
                                                <span className="flex gap-4">
                                                    <span>{competency.percentage}%</span>
                                                    <ChevronDown className="h-4 w-4" />
                                                </span>
                                            </Link>
                                            {competencyForReviewState.expandedRows[competency.competency_id] && (
                                                <>
                                                {competencyForReviewState.loadingInfo[competency.id]?.isLoading ? (
                                                   <div className="flex items-center justify-center text-xs">
                                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                        <span>Loading additional information...</span>
                                                    </div> 
                                                ) : (
                                                <div key={competency.competency_id} className="flex flex-col mt-2">
                                                    <span className="text-xs">Note: Highlighted rows indicate indicators that require review due to changes in compliance made by the staff.</span>
                                                    <div className="border rounded-lg my-2">
                                                        <Table className="text-xs">
                                                            <TableHeader>
                                                                <TableRow>
                                                                    <TableHead className="w-[50%]">Indicator</TableHead>
                                                                    <TableHead className="text-center w-[10%]">Evidences</TableHead>
                                                                    <TableHead className="text-center w-[10%]">Compliance</TableHead>
                                                                    <TableHead>Remarks</TableHead>
                                                                </TableRow>
                                                            </TableHeader>
                                                            <TableBody>
                                                            {competencyForReviewState.additionalInfo[competency.competency_id]?.map((indicator, index) => (
                                                                <TableRow key={`indicator-${indicator.id}`} className={indicator.isUpdated === 1 && `bg-red-200 hover:bg-red-200 font-semibold`}>
                                                                    <TableCell className="pl-4">Level {indicator.proficiency}: {indicator.indicator}</TableCell>
                                                                    <TableCell className="font-bold text-center">
                                                                        <Link 
                                                                            onClick={() => openModal('evidences', indicator)} 
                                                                            preserveState
                                                                            preserveScroll
                                                                        >Click to view</Link>
                                                                    </TableCell>
                                                                    <TableCell className="text-center">
                                                                    {!competenciesState.selectedCompetency.status ? (<Switch 
                                                                        key={`switch-${indicator.id}-${index}`}
                                                                        checked={indicator.compliance === 1}
                                                                        onCheckedChange={(isChecked) => handleToggleChange(competency, indicator.id, isChecked)}
                                                                        value={indicator.compliance === 1}
                                                                    />) : (
                                                                        indicator.compliance === 1 ? 'Complied' : 'Not Complied'
                                                                    )}
                                                                    </TableCell>
                                                                    <TableCell className="flex justify-between items-center">
                                                                    {indicator.remarks ? (
                                                                        <div className="flex gap-4 justify-between items-center w-full">
                                                                            <span className="leading-normal">{indicator.remarks}</span>
                                                                            {!competenciesState.selectedCompetency.status && (
                                                                                <div className="flex justify-end">
                                                                                    <AlertDialog>
                                                                                        <TooltipProvider>
                                                                                            <div className="flex">
                                                                                                <Tooltip>
                                                                                                    <TooltipTrigger asChild>
                                                                                                        <Button
                                                                                                            variant="icon"
                                                                                                            size="sm"
                                                                                                            onClick={() => openModal('remarks', indicator)}
                                                                                                            className="p-1"
                                                                                                        >
                                                                                                            <Pencil className="w-4 h-4" />
                                                                                                        </Button>
                                                                                                    </TooltipTrigger>
                                                                                                    <TooltipContent>
                                                                                                        <p>Edit remarks</p>
                                                                                                    </TooltipContent>
                                                                                                </Tooltip>

                                                                                                <Tooltip>
                                                                                                    <TooltipTrigger asChild>
                                                                                                        <AlertDialogTrigger asChild>
                                                                                                            <Button
                                                                                                                variant="icon"
                                                                                                                size="sm"
                                                                                                                className="p-1"
                                                                                                            >
                                                                                                                <Trash2 className="w-4 h-4" />
                                                                                                            </Button>
                                                                                                        </AlertDialogTrigger>
                                                                                                    </TooltipTrigger>
                                                                                                    <TooltipContent>
                                                                                                        <p>Clear remarks</p>
                                                                                                    </TooltipContent>
                                                                                                </Tooltip>
                                                                                            </div>
                                                                                        </TooltipProvider>
                                                                                        <AlertDialogContent>
                                                                                            <AlertDialogHeader>
                                                                                                <AlertDialogTitle>Are you sure you want to clear remarks?</AlertDialogTitle>
                                                                                                <AlertDialogDescription>
                                                                                                    This action cannot be undone. This will permanently clear the remarks.
                                                                                                </AlertDialogDescription>
                                                                                            </AlertDialogHeader>
                                                                                            <AlertDialogFooter>
                                                                                                <AlertDialogCancel className="border-0">Cancel</AlertDialogCancel>
                                                                                                <AlertDialogAction onClick={() => handleRemarksDelete(indicator)}>Confirm</AlertDialogAction>
                                                                                            </AlertDialogFooter>
                                                                                        </AlertDialogContent>
                                                                                    </AlertDialog>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    ) : (
                                                                        !competenciesState.selectedCompetency.status && (
                                                                            <div className="flex justify-end w-full items-center">
                                                                                <TooltipProvider>
                                                                                    <Tooltip>
                                                                                        <TooltipTrigger asChild>
                                                                                            <Button variant="icon" size="sm" onClick={() => openModal('remarks', indicator)} className="p-1">
                                                                                                <MessageCirclePlus className="w-4 h-4" />
                                                                                            </Button>
                                                                                        </TooltipTrigger>
                                                                                        <TooltipContent>
                                                                                            <p>Add remarks</p>
                                                                                        </TooltipContent>
                                                                                    </Tooltip>
                                                                                </TooltipProvider>
                                                                            </div>
                                                                        )
                                                                    )}
                                                                </TableCell>
                                                                </TableRow>
                                                            )) || (
                                                                <TableRow>
                                                                    <TableCell colSpan={3} className="text-center">No indicators available.</TableCell>
                                                                </TableRow>
                                                            )}
                                                            </TableBody>
                                                        </Table>
                                                    </div>
                                                </div>
                                                )}
                                                </>
                                            )}  
                                        </div>                                      
                                    ))}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="flex items-center justify-center w-full h-full flex-1 text-sm font-semibold text-muted-foreground">
                            <span>No retrieved competencies</span>
                        </div>
                    )
                ) : (
                    <div className="flex justify-center items-center h-full text-sm flex-1">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        <span>Loading competencies...</span>
                    </div>
                )}
                </div>
            </div>
            ) : (
                <div className="flex items-center justify-center w-full h-full flex-1 text-sm font-semibold text-muted-foreground">
                    <span>Choose from submissions to review competencies</span>
                </div>
            )}
        </div>
        <RemarksForm 
          indicator={competencyForReviewState.selectedIndicator}
          open={competencyForReviewState.type === 'remarks'} 
          onClose={closeModal} 
          onSuccess={handleRemarksUpdate}
        />
        <EvidencesList 
          indicator={competencyForReviewState.selectedIndicator}
          open={competencyForReviewState.type === 'evidences'} 
          onClose={closeModal} 
          employees={employees}
        />
        </>
      )
}

export default Competencies