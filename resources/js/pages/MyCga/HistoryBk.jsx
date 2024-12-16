import React,{ useState, useEffect } from 'react'
import { useToast } from "@/hooks/use-toast"
import { Loader2, Trash2, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

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

const History = ({ emp_id, summary, isSummaryLoading, histories }) => {

    const textSize = useTextSize()

    const { toast } = useToast()

    const [expandedRows, setExpandedRows] = useState({})
    const [additionalInfo, setAdditionalInfo] = useState({})
    const [loadingInfo, setLoadingInfo] = useState({})

    const uniqueDates = Array.from(
        new Set(summary.flatMap(comp => comp.dates.map(d => d.dateCreated)))
    )

    const recentDates = histories.slice(0, 3)

    const toggleRow = async (competencyId, proficiency) => {
        setExpandedRows(prev => ({
            ...prev,
            [competencyId]: !prev[competencyId]
        }))

        if (!expandedRows[competencyId] && !additionalInfo[competencyId]) {
            await fetchAdditionalInfo(competencyId, proficiency)
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

    return (
        <div className="grid grid-cols-[auto,1fr] gap-4 h-full">
            <div className="h-full w-[300px]">
                <h4 className="text-normal font-semibold">Submission List</h4>
            </div>
            <div className="h-full flex-grow flex flex-col">
            {!isSummaryLoading ? (
                summary.length > 0 ? (
                    <div className="flex flex-col gap-4 h-full">
                        <h4 className="text-normal font-semibold">Most Recent Submissions</h4>
                        <div className="border rounded-lg">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className={`${textSize} w-[40%]`}>Competency (Level Required)</TableHead>
                                        {recentDates.map(date => (
                                            <TableHead key={date.value} className={`${textSize} text-center`}>
                                                <div className="flex flex-col gap-2 p-2 items-center">
                                                    <span className="flex justify-center w-full">{date.value}</span>
                                                    <Badge className="rounded-lg font-bold" variant={!date.status && `outline`}>{history.status === 'Approved' ? 'Approved' : 'Pending'}</Badge>
                                                </div>
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {summary.map((competency, index) => (
                                        <React.Fragment key={index}>
                                            <TableRow className={`hover:cursor-pointer ${expandedRows[competency.id] && 'bg-muted'}`} onClick={() => toggleRow(competency.id, competency.proficiency)}>
                                                <TableCell className={`${textSize} font-medium`}>{competency.competency} ({competency.proficiency})</TableCell>
                                                {histories.map(history => {
                                                    const dateEntry = competency.dates.find(d => d.dateCreated === history.value)
                                                    return (
                                                        <TableCell key={history.value} className={`${textSize} text-center font-medium`}>
                                                            {dateEntry ? `${dateEntry.percentage}%` : '-'}
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
                                                            <TableCell colSpan={uniqueDates.length + 2}>
                                                                <div className="flex items-center justify-center">
                                                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                                    <span>Loading additional information...</span>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    ) : additionalInfo[competency.id] ? (
                                                        Object.entries(additionalInfo[competency.id]).map(([indicator, proficiencies], i) => (
                                                            Object.entries(proficiencies).map(([proficiency, dates], j) => (
                                                                <TableRow key={`${i}-${j}`} className="hover:font-semibold">
                                                                    <TableCell className="text-xs p-2">
                                                                        Level {proficiency}: {indicator}
                                                                    </TableCell>
                                                                    {uniqueDates.map(date => {
                                                                        const dateEntry = dates.find(d => d.dateCreated === date);
                                                                        return (
                                                                            <TableCell key={date} className="text-center text-xs p-2">
                                                                                {dateEntry ? dateEntry.compliance === 1 ? 'Complied' : 'Not Complied' : 'Not Complied'}
                                                                            </TableCell>
                                                                        );
                                                                    })}
                                                                </TableRow>
                                                            ))
                                                        ))
                                                    ) : (
                                                        <TableRow>
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
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                ) : (
                    <div className="flex justify-center items-center h-full flex-1 font-semibold text-muted-foreground">
                        <span>No available data.</span>
                    </div>
                )
            ) : (
                <div className="flex justify-center items-center h-full text-sm flex-1">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span>Loading history data...</span>
                </div>
            )}
            </div>
        </div>
    )
}

export default History