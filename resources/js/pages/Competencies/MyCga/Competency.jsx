import { useState, useEffect } from 'react'
import { usePage } from '@inertiajs/react'
import { store } from './store'
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import IndicatorsLoading from "@/components/skeletons/IndicatorsLoading"
import { useToast } from "@/hooks/use-toast"

const Competency = ({
    emp_id,
    item_no
}) => {
    const { toast } = useToast()
    
    const {
        selectedCompetencyData,
        selectedCompetency,
        fetchSelectedCompetency,
        updateIndicator,
        setSelectedIndicator,
        selectedIndicator,
    } = store()

    useEffect(() => {
        if (selectedCompetency?.id) {
            fetchSelectedCompetency({
                id: emp_id,
                filters: { 
                    competency_id: selectedCompetency.id,
                    proficiency: selectedCompetency.proficiency,
                    item_no,
                }
            })
        }
    }, [selectedCompetency.id])

    const handleToggleChange = (indicator, isChecked) => {
        updateIndicator({
            ...indicator,      
            compliance: isChecked,
            position_id: item_no,
        }, toast)
    }

    return (
        <div className="flex flex-col gap-2">
            { !selectedCompetencyData.isLoading ? (
                selectedCompetencyData.data && 
                Object.keys(selectedCompetencyData.data)
                .sort((a, b) => b - a) // sort proficiency descending
                .map((proficiency) => (
                    <div key={proficiency}>
                        <div className="text-xs font-semibold uppercase tracking-wide mb-1 mt-2 text-muted-foreground flex justify-between gap-2">
                            <span>Proficiency Level {proficiency}</span>
                            <span># of Evidences</span>
                        </div>
                        <div className="border rounded-lg divide-y divide-gray-200">
                            {selectedCompetencyData.data[proficiency].map((indicator) => (
                                <div 
                                    key={indicator.indicator_id}
                                    className={`inline-flex justify-between items-center gap-4 w-full px-4 py-2 ${selectedIndicator.id === indicator.id && "bg-muted"}`}
                                >
                                    <div className="inline-flex items-center gap-2 w-full py-2">
                                        <Switch 
                                        key={`switch-${indicator.indicator_id}`}
                                        checked={indicator.compliance}
                                        onCheckedChange={(isChecked) => handleToggleChange(indicator, isChecked)}
                                        />
                                        <span 
                                            className={`text-xs hover:underline break-normal cursor-pointer text-wrap text-justify ${selectedIndicator.id === indicator.id && "font-semibold"}`}
                                            onClick={() => {
                                                setSelectedIndicator(indicator)
                                                window.scrollTo({ top: 0, behavior: 'smooth' })
                                            }}
                                        >
                                            {indicator.indicator}
                                        </span>
                                    </div>
                                    <Badge variant="outline" size="sm" className="text-xs rounded w-fit text-muted-foreground px-1.5">
                                        {new Intl.NumberFormat().format(indicator.evidence_count)}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </div>
                ))
            ) : <IndicatorsLoading /> }
            
        </div>
    )
}

export default Competency