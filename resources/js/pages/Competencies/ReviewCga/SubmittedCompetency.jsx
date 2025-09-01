import { useState, useEffect } from 'react'
import { usePage } from '@inertiajs/react'
import { store } from './store'
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import IndicatorsLoading from "@/components/skeletons/IndicatorsLoading"
import { useToast } from "@/hooks/use-toast"
import { MessageCirclePlus, Pencil, Trash2 } from 'lucide-react'
import RemarksForm from "./RemarksForm"
import EvidencesForm from "./EvidencesForm"
import { 
    Check,
    X
} from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
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

const SubmittedCompetency = ({
    emp_id,
    item_no
}) => {
    const { toast } = useToast()

    const [selectedIndicator, setSelectedIndicator] = useState(null)
    
    const {
        selectedSubmission,
        selectedSubmittedCompetencyData,
        fetchSelectedSubmittedCompetency,
        selectedSubmittedCompetencies,
        updateCompliance,
        updateSubmittedCompetencyData,
        updateRemarks,
        openIndicatorForm,
        closeIndicatorForm,
        indicatorForm: {
            modalType
        }
    } = store()

    useEffect(() => {
        if (selectedSubmittedCompetencies?.id) {
            fetchSelectedSubmittedCompetency({
                id: selectedSubmittedCompetencies.id,
            })
        }
    }, [selectedSubmittedCompetencies.id])

    const handleToggle = (indicator, isChecked) => {
        
        const {
            indicator_id,
        } = indicator

        const updatedIndicator = {
            ...indicator,
            compliance: isChecked ? 1 : 0
        }

        const allIndicators = Object.values(selectedSubmittedCompetencyData.data || {}).flat()

        const updatedAllIndicators = allIndicators.map((item) =>
            item.indicator_id === indicator_id
                ? { ...item, compliance: isChecked ? 1 : 0 }
                : item
        )

        const compliantCount = updatedAllIndicators.filter(item => item.compliance === 1).length

        const newCompetencyPercentage = updatedAllIndicators.length > 0 ? parseFloat(((compliantCount / updatedAllIndicators.length) * 100).toFixed(2)) : 0

        updateCompliance(updatedIndicator, newCompetencyPercentage, toast)
    }

    const handleUpdateRemarks = (indicator, updatedRemarks) => {

        const updatedIndicator = {
            ...indicator,
            remarks: updatedRemarks
        }

        updateSubmittedCompetencyData(updatedIndicator)
    }

    const handleDeleteRemarks = (indicator) => {

        const updatedIndicator = {
            ...indicator,
            remarks: null
        }

        setSelectedIndicator(null)
        updateRemarks(updatedIndicator, toast)

    }

    return (
        <div className="flex flex-col gap-2">
            { !selectedSubmittedCompetencyData.isLoading ? (
                selectedSubmittedCompetencyData.data && 
                Object.keys(selectedSubmittedCompetencyData.data)
                .sort((a, b) => b - a) // sort proficiency descending
                .map((proficiency) => (
                    <div key={proficiency}>
                        <div className="text-xs font-semibold uppercase tracking-wide mb-1 mt-2 text-muted-foreground flex justify-between gap-2">
                            <span>Proficiency Level {proficiency}</span>
                        </div>
                        <div className="border rounded-lg">
                          <Table className="text-xs">
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-center w-[10%]">Compliance</TableHead>
                                    <TableHead className="w-[40%]">Indicator</TableHead>
                                    <TableHead className="text-center w-[10%]">No. of Evidences</TableHead>
                                    <TableHead>Remarks</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                              {selectedSubmittedCompetencyData.data[proficiency].map((indicator, index) => (
                                  <TableRow 
                                    key={`${proficiency}-${indicator.indicator_id}-${index}`}
                                    className={indicator.isUpdated === 1 && `bg-red-200 hover:bg-red-200`} 
                                  >
                                      <TableCell className="text-center">
                                        {['Approved', 'Endorsed', 'Disapproved'].includes(selectedSubmission.status) ? (
                                            <div className="flex justify-center items-center h-full">
                                            {indicator.compliance ? (
                                                <Check className="h-4 w-4 text-green-500" />
                                            ) : (
                                                <X className="h-4 w-4 text-red-500" />
                                            )}
                                            </div>
                                        ) : (
                                            <Switch
                                            checked={indicator.compliance === 1}
                                            onCheckedChange={(isChecked) => handleToggle(indicator, isChecked)}
                                            />
                                        )}
                                      </TableCell>
                                      <TableCell className="">
                                          <div
                                            dangerouslySetInnerHTML={{ __html: indicator.indicator }}
                                            className={`text-wrap ${indicator.isUpdated === 1 ? 'font-semibold' : ''}`}
                                          />
                                      </TableCell>
                                        <TableCell className="text-center cursor-pointer font-semibold">
                                        <span
                                            onClick={indicator.evidence_count ? () => {
                                                setSelectedIndicator(indicator)
                                                openIndicatorForm(indicator, 'evidences')
                                            } : undefined}
                                            className={indicator.evidence_count ? 'hover:underline' : 'cursor-default text-gray-400'}
                                        >
                                            {indicator.evidence_count ? indicator.evidence_count : ''}
                                        </span>
                                    </TableCell>
                                      <TableCell className="flex justify-between items-center">
                                        {indicator.remarks ? (
                                            <div className="flex gap-4 justify-between items-center w-full">
                                            <span
                                                className={`leading-normal ${indicator.isUpdated === 1 ? 'font-semibold' : ''}`}
                                            >
                                                {indicator.remarks}
                                            </span>

                                            { !['Approved', 'Endorsed', 'Disapproved'].includes(selectedSubmission.status) && (
                                                <div className="flex justify-end">
                                                <AlertDialog>
                                                    <TooltipProvider>
                                                    <div className="flex">
                                                        <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                            variant="icon"
                                                            size="sm"
                                                            onClick={() => {
                                                                setSelectedIndicator(indicator)
                                                                openIndicatorForm(indicator, 'remarks')
                                                            }}
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
                                                        <AlertDialogAction onClick={() => handleDeleteRemarks(indicator)}>Confirm</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                                </div>
                                            )}
                                            </div>
                                        ) : (
                                            <div className="flex justify-end w-full items-center">
                                            {!['Approved', 'Endorsed', 'Disapproved'].includes(selectedSubmission.status) && (
                                                <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                    <Button
                                                        variant="icon"
                                                        size="sm"
                                                        onClick={() => {
                                                        setSelectedIndicator(indicator)
                                                        openIndicatorForm(indicator, 'remarks')
                                                        }}
                                                        className="p-1"
                                                    >
                                                        <MessageCirclePlus className="w-4 h-4" />
                                                    </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                    <p>Add remarks</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                                </TooltipProvider>
                                            )}
                                            </div>
                                        )}
                                        </TableCell>
                                  </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                    </div>
                ))
            ) : <IndicatorsLoading /> }
            {modalType === 'remarks' && (
                <RemarksForm 
                    indicator={selectedIndicator}
                    open={true} 
                    onClose={() => {
                    closeIndicatorForm()
                    setSelectedIndicator(null)
                    }} 
                    onSuccess={handleUpdateRemarks}
                />
            )}

            {modalType === 'evidences' && (
                <EvidencesForm 
                    indicator={selectedIndicator}
                    open={true} 
                    onClose={() => {
                    closeIndicatorForm()
                    setSelectedIndicator(null)
                    }} 
                />
            )}
        </div>
    )
}

export default SubmittedCompetency