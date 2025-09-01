import { useState, useEffect } from 'react'
import { usePage } from '@inertiajs/react'
import { store } from './store'
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import IndicatorsLoading from "@/components/skeletons/IndicatorsLoading"
import { useToast } from "@/hooks/use-toast"

import { 
    Check,
    X
} from 'lucide-react'

const SubmittedCompetency = ({
    emp_id,
    item_no
}) => {
    const { toast } = useToast()
    
    const {
        selectedSubmittedCompetencyData,
        selectedCompetency,
        fetchSelectedSubmittedCompetency,
        selectedSubmittedCompetencies
    } = store()

    useEffect(() => {
        if (selectedSubmittedCompetencies?.id) {
            fetchSelectedSubmittedCompetency({
                id: selectedSubmittedCompetencies.id,
            })
        }
    }, [selectedCompetency.id])

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
                        <div className="border rounded-lg divide-y divide-gray-200">
                            {selectedSubmittedCompetencyData.data[proficiency].map((indicator) => (
                                <div 
                                    key={`${proficiency}-${indicator.indicator_id}`}
                                    className="inline-flex justify-between items-center gap-4 w-full px-4 py-2"
                                >
                                    <div className="inline-flex items-center gap-4 w-full py-2">
                                        {indicator.compliance ? (
                                            <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                                        ) : (
                                            <X className="h-4 w-4 text-red-500 flex-shrink-0" />
                                        )}
                                        <span className="text-xs break-normal text-wrap text-justify">
                                            {indicator.indicator}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))
            ) : <IndicatorsLoading /> }
            
        </div>
    )
}

export default SubmittedCompetency