import React,{ useState, useEffect } from 'react'
import { useToast } from "@/hooks/use-toast"
import { Loader2, Check, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"

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

const Comparison = ({ comparison, isComparisonLoading, employees, selectedStaffs }) => {

    const { toast } = useToast()

    const [expandedRows, setExpandedRows] = useState({})
    const [additionalInfo, setAdditionalInfo] = useState({})
    const [loadingInfo, setLoadingInfo] = useState({})

    const uniqueStaffs = Array.from(
        new Set(comparison.flatMap(comp => comp.staffs.map(d => d.emp_id)))
    )

    const toggleRow = async (competencyId) => {
        setExpandedRows(prev => ({
            ...prev,
            [competencyId]: !prev[competencyId]
        }))

        if (!expandedRows[competencyId] && !additionalInfo[competencyId]) {
            await fetchAdditionalInfo(competencyId)
        }
    }

    const fetchAdditionalInfo = async (competencyId) => {
        setLoadingInfo(prev => ({ ...prev, [competencyId]: true }))
        try {
            const response = await fetch(`/compare-cga/compare/competency/${competencyId}?staffs=${selectedStaffs}`)
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
                    emp_id: item.emp_id,
                    compliance: item.compliance,
                })
                
                return acc
            }, {})
    
            // Convert to an array and sort
            const sortedGroupedData = Object.entries(groupedData)
                .flatMap(([indicator, proficiencies]) =>
                    Object.entries(proficiencies).map(([prof, staffs]) => ({
                        indicator,
                        prof: parseInt(prof, 10),
                        staffs,
                    }))
                )
                .sort((a, b) => b.prof - a.prof || a.indicator.localeCompare(b.indicator)) // Sort by proficiency (desc), then indicator (asc)
                .reduce((acc, { indicator, prof, staffs }) => {
                    if (!acc[indicator]) acc[indicator] = {}
                    acc[indicator][prof] = staffs
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

    return (
        <>
            {!isComparisonLoading ? (
                comparison.length > 0 ? (
                    <Table>
                        <TableCaption>A comparison of competency gap analysis trend of selected staff.</TableCaption>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="text-sm w-[40%]">Competency</TableHead>
                                {uniqueStaffs.map(staff => {
                                    const employee = employees.find(emp => emp.value === staff);
                                    return (
                                        <TableHead key={staff} className="text-center text-sm">{employee.label}</TableHead>
                                    );
                                })}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {comparison.map((competency, index) => (
                                <React.Fragment key={index}>
                                    <TableRow className="hover:cursor-pointer" onClick={() => toggleRow(competency.id)}>
                                        <TableCell className="text-sm font-medium">{competency.competency}</TableCell>
                                        {uniqueStaffs.map(staff => {
                                            const staffEntry = competency.staffs.find(d => d.emp_id === staff);
                                            return (
                                                <TableCell key={staff} className="text-center text-sm font-medium">
                                                    {staffEntry?.percentage ? `${staffEntry.percentage}%` : '-'}
                                                </TableCell>
                                            );
                                        })}
                                        <TableCell className="w-[5%]">
                                            <ChevronDown className="h-4 w-4" />
                                        </TableCell>
                                    </TableRow>
                                    {expandedRows[competency.id] && (
                                        <>
                                            {loadingInfo[competency.id] ? (
                                                <TableRow>
                                                    <TableCell colSpan={uniqueStaffs.length + 2}>
                                                        <div className="flex items-center justify-center">
                                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                            <span>Loading additional information...</span>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ) : additionalInfo[competency.id] ? (
                                                Object.entries(additionalInfo[competency.id]).map(([indicator, proficiencies], i) => (
                                                    Object.entries(proficiencies).map(([proficiency, staffs], j) => (
                                                        <TableRow key={`${i}-${j}`} className="hover:font-medium">
                                                            <TableCell className="text-xs p-1">
                                                                Level {proficiency}: {indicator}
                                                            </TableCell>
                                                            {uniqueStaffs.map(staff => {
                                                                const staffEntry = staffs.find(s => s.emp_id === staff);
                                                                return (
                                                                    <TableCell key={staff} className="text-center text-xs p-1">
                                                                        {staffEntry ? staffEntry.compliance === 1 ? 1 : '-' : '-'}
                                                                    </TableCell>
                                                                );
                                                            })}
                                                        </TableRow>
                                                    ))
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={uniqueStaffs.length + 2} className="text-sm">
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
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <div className="flex justify-center items-center text-sm h-full flex-1 font-semibold text-muted-foreground">
                        <span>No available data. Please choose employees with approved competencies to compare.</span>
                    </div>
                )
            ) : (
                <div className="flex justify-center items-center h-full text-sm flex-1">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span>Loading data...</span>
                </div>
            )}

        </>
    )
}

export default Comparison