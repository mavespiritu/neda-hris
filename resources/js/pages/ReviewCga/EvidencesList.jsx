import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogClose
  } from "@/components/ui/dialog"

import { Loader2 } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useTextSize } from "@/providers/TextSizeProvider"

import { Button } from "@/components/ui/button"
import EvidenceDescription from "@/pages/MyCga/EvidenceDescription"
import AttachmentList from "@/pages/MyCga/AttachmentList"
import { useState, useEffect, useReducer, useCallback } from 'react'
import { formatDate } from "@/lib/utils.jsx"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"

const initialState = {
    evidences: [],
    files: [],
    loading: false,
    error: null,
    currentPage: 1
}

function evidenceReducer(state, action) {
    
    switch (action.type) {
        case "FETCH_START":
            return { ...state, loading: true, error: null }
        case "FETCH_SUCCESS":
            return { ...state, loading: false, evidences: action.payload.evidences, files: action.payload.files }
        case "FETCH_ERROR":
            return { ...state, loading: false, error: action.payload }
        case "CLEAR_ERROR":
            return { ...state, error: null }
        case "SET_CURRENT_PAGE":
            return { ...state, currentPage: action.payload }
        default:
            return state
    }
}

const getRemarks = (evidence, type) => {
    const remarkTypes = {
        hr: evidence.hr_remarks,
        dc: evidence.dc_remarks,
        disapproved: evidence.disapproved_remarks,
    }
    
    const remark = remarkTypes[type];

    return remark && (
        <div className="flex flex-col gap-2 text-xs">
            <div className="flex flex-col gap-1">
                <span className="text-muted-foreground">{type === 'disapproved' ? 'Remarks' : `${type} Remarks`}:</span>
                <span className="font-medium">{remark}</span>
            </div>
        </div>
    )
}

const EvidencesList = ({ indicator, open, onClose, employees }) => {

    const textSize = useTextSize()

    const { toast } = useToast()

    const [state, dispatch] = useReducer(evidenceReducer, initialState)

    const fetchEvidences = async () => {
        dispatch({ type: "FETCH_START" })

        try {
            const response = await fetch(`/my-cga/indicator/${indicator?.emp_id}?page=${state.currentPage}&indicator_id=${indicator.indicator_id}`)
            if (!response.ok) {
                toast({
                    title: "Uh oh! Something went wrong.",
                    description: "There was a problem with your request",
                    variant: "destructive",
                })
            }
            const data = await response.json()
            dispatch({ type: "FETCH_SUCCESS", payload: data || [] })
        } catch (err) {
            dispatch({ type: "FETCH_ERROR", payload: "Error fetching evidences" })
            toast({
                title: "Error",
                description: "There was an error fetching the evidences.",
                variant: "destructive"
            })
        }
    }

    const handlePaginationClick = useCallback(
        (link, e) => {
          e.preventDefault()
    
          if (link.url) {
            const url = new URL(link.url)
            const params = new URLSearchParams(url.search)
            const page = params.get('page')
            
            if (page) {
                dispatch({ type: "SET_CURRENT_PAGE", payload: parseInt(page, 10) })
            }
          }
        },
        []
    )

    useEffect(() => {
        if (open) {
            fetchEvidences()
        } else {
            dispatch({ type: "FETCH_START" }) 
        }
    }, [open, state.currentPage, indicator])

    const itemsPerPage = 10
    const total = state.evidences?.total || 0
    const startIndex = (state.currentPage - 1) * itemsPerPage + 1
    const endIndex = Math.min(startIndex + itemsPerPage - 1, total)

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>List of Evidences</DialogTitle>
                    <DialogDescription>
                    Check here the listed evidences of the selected indicator. 
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="h-[600px] p-2 pr-4 border rounded-lg">
                    {state.loading ? (
                        <div className="flex justify-center items-center h-full text-xs flex-1">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Loading evidences...
                        </div>
                    ) : state.evidences?.data?.length > 0 ? (
                        state.evidences?.data?.map((evidence) => {
                            const { status, approver, approvalDate, remarks } = (() => {
                                let status = 'Pending'
                                let approver = ''
                                let approvalDate = ''
                                let remarks = ''

                                if (evidence.hr_confirmation === 1 && evidence.dc_confirmation === 1) {
                                    status = 'HR and DC Approved'
                                    approver = `${employees.find(emp => emp.value === evidence.hr_confirmed_by)?.label} and ${employees.find(emp => emp.value === evidence.dc_confirmed_by)?.label}`
                                    approvalDate = ` on ${formatDate(evidence.hr_date)} and ${formatDate(evidence.dc_date)} respectively`
                                    remarks = getRemarks(evidence, 'hr') || getRemarks(evidence, 'dc')
                                } else if (evidence.hr_confirmation === 1) {
                                    status = 'HR Approved'
                                    approver = employees.find(emp => emp.value === evidence.hr_confirmed_by)?.label
                                    approvalDate = ` on ${formatDate(evidence.hr_date)}`
                                    remarks = getRemarks(evidence, 'hr')
                                } else if (evidence.dc_confirmation === 1) {
                                    status = 'DC Approved'
                                    approver = employees.find(emp => emp.value === evidence.dc_confirmed_by)?.label
                                    approvalDate = ` on ${formatDate(evidence.dc_date)}`
                                    remarks = getRemarks(evidence, 'dc')
                                } else if (evidence.disapproved === 1) {
                                    status = 'Disapproved'
                                    approver = employees.find(emp => emp.value === evidence.disapproved_by)?.label
                                    approvalDate = ` on ${formatDate(evidence.disapproved_date)}`
                                    remarks = getRemarks(evidence, 'disapproved')
                                }

                                return { status, approver, approvalDate, remarks }
                            })()

                            return (
                                <div key={evidence.id} className="flex flex-col w-full items-start rounded-lg border p-4 text-left text-sm transition-all hover:bg-accent mb-4">
                                    <div className="flex w-full flex-col gap-1">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className={`font-semibold ${textSize}`}>{evidence.title}</div>
                                            <div className="flex gap-2">
                                                <Badge className="text-center rounded-lg" variant={status === 'Disapproved' && 'destructive'}>{status}</Badge>
                                            </div>
                                        </div>
                                        <div className="flex justify-between">
                                            <div className="text-xs font-medium">
                                                {evidence.start_date && `${formatDate(evidence.start_date)} - ${formatDate(evidence.end_date)}`}
                                            </div>
                                            <div className="flex flex-col text-xs justify-end text-right">
                                                <span className="text-muted-foreground font-medium">Type of Evidence:</span>
                                                <span className="font-medium">{evidence.reference}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <EvidenceDescription text={evidence.description} />
                                    <div className="flex flex-col gap-2">
                                        {state.files[evidence.id] && (
                                            <span className="text-xs text-muted-foreground font-medium">Supporting Documents:</span>
                                        )}
                                        {state.files[evidence.id] && <AttachmentList files={state.files[evidence.id]} evidence={evidence} />}
                                        {['HR Approved', 'DC Approved', 'HR and DC Approved'].includes(status) && (
                                            <span className="text-xs">
                                                Approved by <strong>{approver}</strong>{approvalDate}
                                            </span>
                                        )}
                                        {status === 'Disapproved' && (
                                            <span className="text-xs">
                                                Disapproved by <strong>{approver}</strong>{approvalDate}
                                            </span>
                                        )}
                                        {['HR Approved', 'DC Approved', 'HR and DC Approved', 'Disapproved'].includes(status) && remarks}
                                    </div>
                                </div>
                            )
                        })
                    ) : (
                        <div className="flex flex-col flex-1 items-center justify-center h-full">
                            <span className="text-center w-full text-sm font-semibold">No evidences yet</span>
                            <span className="text-center w-full text-xs">Once the staff add an evidence, it will appear here</span>
                        </div>
                    )}
                </ScrollArea>
                <div className="flex gap-2 items-center justify-between">
                    {state.evidences?.data && state.evidences?.data?.length > 0 && (
                        <div className="flex items-center space-x-2">
                        {state.evidences.links.map((link) => (
                            link.url ? (
                            <Button
                                key={link.label}
                                variant={link.active ? "default" : "outline"}
                                size="sm"
                                onClick={(e) => handlePaginationClick(link, e)}
                                dangerouslySetInnerHTML={{ __html: link.label }}
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
                        Showing {endIndex > 0 ? startIndex : 0}-{endIndex} of {total} items
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default EvidencesList