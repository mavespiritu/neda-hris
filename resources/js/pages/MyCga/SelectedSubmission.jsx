import React,{ useState, useEffect, useCallback } from 'react'
import { useToast } from "@/hooks/use-toast"
import { Loader2, Trash2, ChevronDown, SlidersHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import useCgaHistoryStore from '@/stores/useCgaHistoryStore'
import useCgaTrainingStore from '@/stores/useCgaTrainingStore'

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
import { useTextSize } from "@/providers/TextSizeProvider"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { useForm } from '@inertiajs/react'

const SelectedSubmission = ({emp_id, summary}) => {

  const {
    setToast,
    submissionsState,
    submissionsState: {
        submissions,
        filteredSubmissions,
        loading: submissionsLoading,
        currentPage,
        selectedSubmission,
        filters
    },
    selectedSubmissionState,
    selectedSubmissionState: {
        loading: selectedSubmissionLoading,
        competencies,
        expandedRows: competencyExpandedRows,
        additionalInfo: indicatorAdditionalInfo,
        loadingAdditionalInfo
    },
    setFilteredSubmissions,
    setSelectedSubmission,
    loadSubmissions,
    loadSelectedSubmission,
    openFilterModal,
    setCurrentPage
} = useCgaHistoryStore()

const {
  setToast: setTrainingsToast,
  trainingsState: { 
      trainings,
      currentPage: trainingsCurrentPage,
      selectedTraining,
      isFormModalOpen      
  },
  loadSubmittedTrainings,
  openFormModal,
  closeFormModal,
  setCurrentPage: setTrainingsCurrentPage
} = useCgaTrainingStore()

const textSize = useTextSize()
const { toast } = useToast()

const [expandedRows, setExpandedRows] = useState({})
const [additionalInfo, setAdditionalInfo] = useState({})
const [loadingInfo, setLoadingInfo] = useState({})

const [activeTab, setActiveTab] = useState(() => {
  return localStorage.getItem('HRIS_MyCGA_Submissions_activeTab') || 'competencies'
})

const uniqueDates = Array.from(
  new Set(summary.flatMap(comp => comp.dates.map(d => d.dateCreated)))
)

useEffect(() => {
  if(toast){
      setToast(toast)
  }
}, [toast, setToast])

useEffect(() => {
  localStorage.setItem('HRIS_MyCGA_Submissions_activeTab', activeTab)
}, [activeTab])

useEffect(() => {
  if(selectedSubmission) loadSubmittedTrainings(emp_id, selectedSubmission.id)
}, [emp_id, selectedSubmission, trainingsCurrentPage])

const toggleRow = async (competencyId, proficiency) => {
  setExpandedRows(prev => ({
      ...prev,
      [competencyId]: !prev[competencyId]
  }))

  if (!expandedRows[competencyId] && !additionalInfo[competencyId]) {
      await fetchAdditionalInfo(competencyId, proficiency)
  }
}

const handleExpandRow = (competency) => {

  const competencyId = competency.competency_id

  expandCompetencyRow(competencyId)

  if (!expandedRows[competencyId] && !additionalInfo[competencyId]) {
      loadIndicators(competency)
  }

}

const fetchAdditionalInfo = async (competencyId, proficiency) => {
  setLoadingInfo(prev => ({ ...prev, [competencyId]: true }))
  try {
      const response = await fetch(`/my-cga/history-summary/competency/${emp_id}?competency_id=${competencyId}&proficiency=${proficiency}`)
      if (!response.ok) {
          toast({
              title: "Uh oh! Something went wrong.",
              description: "Network response was not ok",
              variant: "destructive"
          })
      }
      const data = await response.json()
      
      const groupedData = data.reduce((acc, item) => {
          if (!acc[item.indicator]) {
              acc[item.indicator] = {}
          }
          if (!acc[item.indicator][item.proficiency]) {
              acc[item.indicator][item.proficiency] = []
          }
          
          acc[item.indicator][item.proficiency].push({
              dateCreated: item.dateCreated,
              compliance: item.compliance,
          })
          
          return acc
      }, {})

      // Convert to an array and sort
      const sortedGroupedData = Object.entries(groupedData)
          .flatMap(([indicator, proficiencies]) =>
              Object.entries(proficiencies).map(([prof, dates]) => ({
                  indicator,
                  prof: parseInt(prof, 10), // Convert proficiency to a number for proper sorting
                  dates,
              }))
          )
          .sort((a, b) => b.prof - a.prof || a.indicator.localeCompare(b.indicator)) // Sort by proficiency (desc), then indicator (asc)
          .reduce((acc, { indicator, prof, dates }) => {
              if (!acc[indicator]) acc[indicator] = {}
              acc[indicator][prof] = dates
              return acc
          }, {})

      setAdditionalInfo(prev => ({ ...prev, [competencyId]: sortedGroupedData }))
  } catch (error) {
      console.error(error)
      toast({
          title: "Uh oh! Something went wrong.",
          description: "Network response was not ok",
          variant: "destructive"
      })
      setAdditionalInfo(prev => ({ ...prev, [competencyId]: null }))
  } finally {
      setLoadingInfo(prev => ({ ...prev, [competencyId]: false }))
  }
}

const handlePaginationClick = (link, e) => {
  e.preventDefault()
  if (link.url) {
      const url = new URL(link.url)
      const params = new URLSearchParams(url.search)
      const page = params.get('page') 
      
      if (page) {
        setTrainingsCurrentPage(parseInt(page, 10))
      }
  }
}

const { delete: destroy, processing } =  useForm({
  emp_id: emp_id,
})

const handleRemoveSubmissionClick = useCallback(
  async () => {
    destroy(`/my-cga/delete-history/${selectedSubmission.id}`, {
      preserveState: true,
      onSuccess: () => {
        toast({
          title: "Success!",
          description: "The submission has been deleted successfully",
        })
        
        loadSubmissions(emp_id)
        setSelectedSubmission(null)

      },
      onError: (e) => {
        console.error(e)
      },
    })
  },
  [destroy, toast]
)
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between">
        <div className="flex flex-col gap-1">
          <span className="font-semibold">Submission as of {selectedSubmission.dateCreated}</span>
          <Badge className="inline-block rounded-lg self-start font-bold" variant={selectedSubmission.status !== 'Approved' ? 'outline' : ''}>{selectedSubmission.status === 'Approved' ? 'Approved' : 'Pending'}</Badge>
        </div>
        <span>
          {selectedSubmission.status !== 'Approved' && (
          <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">Delete Submission</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                  <AlertDialogHeader>
                      <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                      <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the submission.
                      </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                      <AlertDialogCancel className="border-0">Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleRemoveSubmissionClick} disabled={processing}>
                          {processing ? (
                              <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  <span>Please wait</span>
                              </>
                          ) : 'Proceed'}
                      </AlertDialogAction>
                  </AlertDialogFooter>
              </AlertDialogContent>
          </AlertDialog>)}
        </span>
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-grow grid grid-rows-[auto,1fr]">
        <TabsList className="w-full justify-start gap-4">
          <TabsTrigger value="competencies">Competencies</TabsTrigger>
          <TabsTrigger value="proposed-trainings">Proposed Trainings</TabsTrigger>
        </TabsList>
        <TabsContent value="competencies">
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                  <TableRow>
                      <TableHead className={`${textSize} w-[40%]`}>Competency (Level Required)</TableHead>
                      <TableHead className={`${textSize} text-center`}>Percentage</TableHead>
                  </TableRow>
              </TableHeader>
              <TableBody>
              {summary.map((competency, index) => {
                  const dateEntry = competency.dates.find(
                    (d) => d.dateCreated === selectedSubmission.dateCreated
                  )

                  return (
                    <React.Fragment key={`summary-row-${index}`}>
                      <TableRow
                        className={`hover:cursor-pointer ${
                          expandedRows[competency.id] && 'bg-muted'
                        }`}
                        onClick={() => toggleRow(competency.id, competency.proficiency)}
                      >
                        <TableCell className={`${textSize} font-medium`}>
                          {competency.competency} ({competency.proficiency})
                        </TableCell>
                        <TableCell className={`${textSize} text-center font-medium`}>
                          {dateEntry ? `${dateEntry.percentage}%` : '-'}
                        </TableCell>
                        <TableCell className="w-[5%]">
                          <ChevronDown className="h-4 w-4" />
                        </TableCell>
                      </TableRow>
                      {expandedRows[competency.id] && (
                        <>
                          {loadingInfo[competency.id] ? (
                            <TableRow key={`loading-${competency.id}`}>
                              <TableCell colSpan={uniqueDates.length + 2}>
                                <div className="flex items-center justify-center">
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                  <span>Loading additional information...</span>
                                </div>
                              </TableCell>
                            </TableRow>
                          ) : additionalInfo[competency.id] ? (
                            Object.entries(additionalInfo[competency.id]).map(
                              ([indicator, proficiencies], i) =>
                                Object.entries(proficiencies).map(
                                  ([proficiency, dates], j) => {
                                    const dateEntry = dates.find(
                                      (d) => d.dateCreated === selectedSubmission.dateCreated
                                    )
                          
                                    return (
                                      <TableRow
                                        key={`${competency.id}-${i}-${j}`}
                                        className="hover:font-semibold"
                                      >
                                        <TableCell className="text-xs p-2">
                                          Level {proficiency}: {indicator}
                                        </TableCell>
                                        <TableCell className="text-center text-xs p-2">
                                          {dateEntry
                                            ? dateEntry.compliance === 1
                                              ? 'Complied'
                                              : 'Not Complied'
                                            : 'Complied'}
                                        </TableCell>
                                      </TableRow>
                                    )
                                  }
                                )
                            )
                          ) : (
                            <TableRow key={`additional-info-${competency.id}`}>
                              <TableCell colSpan={uniqueDates.length + 2} className="text-sm">
                                <div className="flex items-center justify-center text-xs">
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                  <span>Loading additional information...</span>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </>
                      )}
                    </React.Fragment>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
        <TabsContent value="proposed-trainings">
          <div className="border rounded-lg my-2">
            <Table className="text-sm">
              <TableHeader>
                  <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead className="w-[20%]">Competency</TableHead>
                      <TableHead>Title of Training</TableHead>
                  </TableRow>
              </TableHeader>
              <TableBody>
              {trainings.data && trainings.data.length > 0 ? (
                trainings.data.map((training, idx) => (
                  <TableRow key={training.id}>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell>{training.competency}</TableCell>
                    <TableCell>{training.title}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-500 py-4">
                    No trainings found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
            </Table>
          </div>
          <div className="flex gap-2 items-center justify-between w-full">
            {trainings?.total > 20 && (
              <div className="flex items-center space-x-2">
                {trainings.links.map((link) =>
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
                )}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default SelectedSubmission