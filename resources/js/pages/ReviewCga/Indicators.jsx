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
import useCompetencyReviewStore from '@/stores/useCompetencyReviewStore'
import { Link } from '@inertiajs/react'
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
import { Button } from "@/components/ui/button"
import { MessageCirclePlus, Pencil, Trash2 } from 'lucide-react'
import { Switch } from "@/components/ui/switch"

const Indicators = ({competency, handleComplianceToggleChange, handleRemarksDelete}) => {
  const {
    setToast,
    competenciesState: { 
        competencies, 
        currentPage,
        loading: competenciesLoading, 
        filters,
        selectedCompetency,
        filteredCompetencies 
    },
    selectedCompetencyState,
    indicatorsState,
    indicatorsState: {
        expandedRows,
        additionalInfo: indicatorAdditionalInfo,
        loadingAdditionalInfo: loadingIndicatorAdditionalInfo,
        selectedIndicator,
        activeModalType
    },
    loadCompetencies,
    loadSelectedCompetency,
    loadIndicators,
    setFilteredCompetencies,
    setFilters,
    setSelectedCompetency,
    setCurrentPage,
    updateCompliance,
    openIndicatorModal,
    closeIndicatorModal,
    approveCompetency,
    updateIndicatorAdditionalInfo,
    deleteRemarks,
    expandCompetencyRow
} = useCompetencyReviewStore()

  return (
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
        {indicatorAdditionalInfo[competency.competency_id]?.map((indicator, index) => (
            <TableRow key={`indicator-${indicator.id}`} className={indicator.isUpdated === 1 && `bg-red-200 hover:bg-red-200 font-semibold`}>
                <TableCell className="pl-4">Level {indicator.proficiency}: {indicator.indicator}</TableCell>
                <TableCell className="font-bold text-center cursor-pointer">
                    <span onClick={() => openIndicatorModal('evidences', indicator)}>Click to view</span>
                </TableCell>
                <TableCell className="text-center">
                {!selectedCompetency.status ? (<Switch 
                    key={`switch-${indicator.id}-${index}`}
                    checked={indicator.compliance === 1}
                    onCheckedChange={(isChecked) => handleComplianceToggleChange(competency, indicator.id, isChecked)}
                    value={indicator.compliance === 1}
                />) : (
                    indicator.compliance === 1 ? 'Complied' : 'Not Complied'
                )}
                </TableCell>
                <TableCell className="flex justify-between items-center">
                {indicator.remarks ? (
                    <div className="flex gap-4 justify-between items-center w-full">
                        <span className="leading-normal">{indicator.remarks}</span>
                        {!selectedCompetency.status && (
                            <div className="flex justify-end">
                                <AlertDialog>
                                    <TooltipProvider>
                                        <div className="flex">
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="icon"
                                                        size="sm"
                                                        onClick={() => openIndicatorModal('remarks', indicator)}
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
                    !selectedCompetency.status && (
                        <div className="flex justify-end w-full items-center">
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="icon" size="sm" onClick={() => openIndicatorModal('remarks', indicator)} className="p-1">
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
                <TableCell colSpan={4} className="text-center">No indicators available.</TableCell>
            </TableRow>
        )}
        </TableBody>
    </Table>
  )
}

export default Indicators