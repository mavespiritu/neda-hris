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
import TextArea from "@/components/TextArea"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

const DisapproveForm = ({ evidence, open, onClose, onSuccess }) => {

    const { toast } = useToast()

    const initialValues = {
        disapproved_remarks: ""
    }

    const { data, setData, post, processing, errors, clearErrors, reset, progress } = useForm(initialValues)

    useEffect(() => {
        if (open) {
            clearErrors()
        }
        reset()
    }, [open])

    const handleSubmit = (e) => {
        e.preventDefault()

        post(`/review-cga/evidences/disapprove/${evidence.id}`, {
            preserveState: true,
            onSuccess: () => {
                toast({
                    title: "Success!",
                    description: "The evidence has been disapproved successfully",
                })
                reset()
                clearErrors()
                onClose()
                onSuccess()
            },
            onError: () => {
                console.log(e)
            }
        })
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Disapprove an evidence</DialogTitle>
                    <DialogDescription>
                    Tell the reason why the evidence must be disapproved
                    </DialogDescription>
                </DialogHeader>
                <div>
                    <form onSubmit={handleSubmit}>
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="description">Remarks</Label>
                                <TextArea 
                                    name="disapproved_remarks" 
                                    onChange={(e => setData('disapproved_remarks', e.target.value))}
                                    invalidMessage={errors.disapproved_remarks}
                                    id="disapproved_remarks"
                                    value={data.disapproved_remarks}
                                />
                                {errors?.disapproved_remarks && <span className="text-red-500 text-xs">{errors.disapproved_remarks}</span>}
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
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default DisapproveForm