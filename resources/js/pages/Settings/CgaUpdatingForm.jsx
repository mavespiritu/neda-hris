import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose
  } from "@/components/ui/dialog"

import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from 'react'
import { router, useForm } from '@inertiajs/react'
import TextArea from "@/components/TextArea"
import TextInput from "@/components/TextInput"
import { DateRangePicker } from "@/components/DateRangePicker"
import FileUpload from "@/components/FileUpload"
import { useToast } from "@/hooks/use-toast"
import dayjs from 'dayjs'
import { Loader2 } from "lucide-react"
import useSettingsStore from '@/stores/useSettingsStore'

const CgaUpdatingForm = () => {

    const { toast } = useToast()

    const {
        setToast,
        competenciesState: { 
          enableUpdatingState,
          enableUpdatingState: {
            startDate,
            endDate,
            isFormOpen
          }
        },
        openCgaEnableUpdatingForm,
        closeCgaEnableUpdatingForm,
        loadCgaEnableUpdatingDates,
        updateCgaEnableUpdatingDates
      } = useSettingsStore()

    const initialValues = {
        startDate,
        endDate
    }

    const { data, setData, post, processing, errors, clearErrors, reset, progress } = useForm(initialValues)

    useEffect(() => {
        setData({
            startDate: startDate || null,
            endDate: endDate || null
        })
    }, [startDate, endDate])

    const handleDateRangeChange = (startDate, endDate) => {
        setData({
          ...data,
          startDate,
          endDate,
        })
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        post(`/settings/cga-enable-updating`, {
            preserveState: true,
            onSuccess: () => {
                toast({
                    title: "Success!",
                    description: "The CGA enable updating dates have been updated successfully",
                })
                reset()
                clearErrors()
                closeCgaEnableUpdatingForm()
                updateCgaEnableUpdatingDates(data.startDate, data.endDate)
            }
        })
    }

    return (
        <Dialog open={isFormOpen} onOpenChange={closeCgaEnableUpdatingForm}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Enable Updating of CGA</DialogTitle>
                    <DialogDescription>
                    Adjust dates to enable updating of CGA
                    </DialogDescription>
                </DialogHeader>
                <div>
                <form onSubmit={handleSubmit}>
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="startDate">Available dates for CGA updating</Label>
                            <DateRangePicker 
                            startDate={data.startDate} 
                            endDate={data.endDate} 
                            invalidStartDateMessage={errors.startDate}
                            invalidEndDateMessage={errors.endDate}
                            onDateChange={handleDateRangeChange}
                            />
                            {(errors?.startDate) && <span className="text-red-500 text-xs">{errors.startDate}</span>}
                            {(errors?.endDate) && <span className="text-red-500 text-xs">{errors.endDate}</span>}
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
                                ) : 'Save Changes'}
                            </Button>
                        </div>
                    </div>
                </form>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default CgaUpdatingForm