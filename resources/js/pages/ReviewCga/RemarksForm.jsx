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

const RemarksForm = ({ indicator, open, onClose, onSuccess }) => {

    const { toast } = useToast()

    const initialValues = {
        remarks: indicator?.remarks || ''
    }

    const { data, setData, post, processing, errors, clearErrors, reset, progress } = useForm(initialValues)

    useEffect(() => {
        if (open) {
            setData("remarks", indicator?.remarks || "")
            clearErrors()
        }
    }, [open, indicator])

    const handleSubmit = (e) => {
        e.preventDefault()

        post(`/review-cga/competencies-for-review/indicator/${indicator?.id}`, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: (res) => {
                
                const { flash } = res.props

                toast({
                    title: flash.title,
                    description: flash.message
                })

                reset()
                clearErrors()
                onClose()
                onSuccess(data.remarks, indicator)
            },
            onError: (res) => {
                
            }
        })
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add Remarks</DialogTitle>
                    <DialogDescription>
                    Add narrative as to why the indicator was complied or not. 
                    </DialogDescription>
                </DialogHeader>
                <div className="text-xs flex flex-col gap-2">
                    <div className="flex flex-col gap-1">
                        <span className="text-muted-foreground w-[40%]">Indicator (Level {indicator?.proficiency}):</span>
                        <span>{indicator?.indicator}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-muted-foreground w-[40%]">Compliance:</span>
                        <span>{indicator?.compliance === 1 ? 'Complied' : 'Not Complied'}</span>
                    </div>
                </div>
                <form onSubmit={handleSubmit}>
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="description">Remarks</Label>
                                <TextArea 
                                    name="remarks" 
                                    onChange={(e => setData('remarks', e.target.value))}
                                    invalidMessage={errors.remarks}
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

export default RemarksForm