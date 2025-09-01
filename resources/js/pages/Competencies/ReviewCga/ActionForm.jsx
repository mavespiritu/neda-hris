import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogClose
  } from "@/components/ui/dialog"

import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from 'react'
import { useForm } from '@inertiajs/react'
import RichTextEditor from "@/components/RichTextEditor"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { store } from './store'

const ActionForm = ({ submission, open, onClose, onSuccess }) => {

    const { toast } = useToast()

    const {
      sendGapAnalysisEndorsementNotification,
      sendGapAnalysisApprovalNotification,
      sendGapAnalysisDisapprovalNotification
    } = store()

    const initialValues = {
        status: 'Endorsed',
        remarks: ''
    }

    const statuses = [
        { value: "Endorsed", label: "Endorse to Supervisor" },
        { value: "Approved", label: "Approve" },
        { value: "Disapproved", label: "Disapprove" },  
        { value: "Needs Revision", label: "Needs Revision" }, 
    ]

    const { data, setData, post, processing, errors, clearErrors, reset, progress } = useForm(initialValues)

    useEffect(() => {
        if (open) {
            clearErrors()
        }
    }, [open, submission])

    const handleSubmit = (e) => {
        e.preventDefault()

        post(route('cga.review.take-action', submission.id), {
            preserveState: true,
            preserveScroll: true,
            onSuccess: (res) => {
                const { flash } = res.props

                toast({
                    title: flash.title,
                    description: flash.message
                })

                if (data.status === "Endorsed") {
                    sendGapAnalysisEndorsementNotification({ review_id: submission.id })
                } else if (data.status === "Approved") {
                    sendGapAnalysisApprovalNotification({ review_id: submission.id })
                } else if (data.status === "Disapproved") {
                    sendGapAnalysisDisapprovalNotification({ review_id: submission.id })
                }

                reset()
                clearErrors()
                onClose()
                if (onSuccess) {
                    onSuccess(data.status)
                }
            },
            onError: (res) => {
                
            }
        })
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Take Action</DialogTitle>
                    <DialogDescription>
                    Update the status for this submission.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                            <Label>Status</Label>
                            <RadioGroup
                                value={data.status}
                                onValueChange={(value) => setData('status', value)}
                                className="flex flex-col gap-2"
                            >
                                {statuses
                                .filter((status) => {
                                    if (!submission?.status) return true
                                    if (submission.status === 'Endorsed') return status.value !== 'Endorsed'
                                    if (submission.status === 'Approved') return status.value === 'Needs Revision'
                                    if (submission.status === 'Disapproved') return true
                                    return true
                                })
                                .map((status) => (
                                    <div key={status.value} className="flex items-center gap-2">
                                        <RadioGroupItem value={status.value} id={status.value} />
                                        <Label
                                            className={`text-sm ${
                                                status.value === 'Approved'
                                                ? 'text-green-400'
                                                : status.value === 'Disapproved'
                                                ? 'text-red-400'
                                                : ''
                                            }`}
                                            htmlFor={status.value}
                                        >
                                            {status.label}
                                        </Label>
                                    </div>
                                ))}
                            </RadioGroup>
                            {errors?.status && <span className="text-red-500 text-xs">{errors.status}</span>}
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="description">Remarks</Label>
                            <RichTextEditor 
                                name="remarks" 
                                onChange={(value => setData('remarks', value))}
                                isInvalid={errors.remarks}
                                id="remarks"
                                value={data.remarks}
                            />
                            {errors?.remarks && <span className="text-red-500 text-xs">{errors.remarks}</span>}
                        </div>

                        <div className="flex justify-end gap-2">
                            <DialogClose asChild>
                                <Button type="button" variant="ghost">
                                Cancel
                                </Button>
                            </DialogClose>
                            <Button type="submit" disabled={processing}>
                                {processing ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        <span>Please wait</span>
                                    </>
                                ) : 'Submit'}
                            </Button>
                        </div>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}

export default ActionForm