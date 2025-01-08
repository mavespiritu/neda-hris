import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import useSettingsStore from '@/stores/useSettingsStore'
import { useState, useEffect } from "react"
import { format } from 'date-fns'
import CgaUpdatingForm from './CgaUpdatingForm'
import { Calendar as CalendarIcon } from "lucide-react"

const Competencies = () => {

  const {
    setToast,
    competenciesState: { 
      enableUpdatingState,
      enableUpdatingState: {
        startDate: cgaEnableUpdatingStartDate,
        endDate: cgaEnableUpdatingEndDate,
        isFormOpen: isCgaUpdatingFormOpen
      }
    },
    openCgaEnableUpdatingForm,
    closeCgaEnableUpdatingForm,
    loadCgaEnableUpdatingDates
  } = useSettingsStore()

  const formattedStartDate = cgaEnableUpdatingStartDate
        ? format(new Date(cgaEnableUpdatingStartDate), 'MMMM dd, yyyy')
        : null
  const formattedEndDate = cgaEnableUpdatingEndDate
        ? format(new Date(cgaEnableUpdatingEndDate), 'MMMM dd, yyyy')
        : null

  useEffect(() => {
    loadCgaEnableUpdatingDates()
  }, [cgaEnableUpdatingStartDate, cgaEnableUpdatingEndDate])

  return (
    <Card>
      <CardHeader className="space-y-0 pb-4">
        <CardTitle className="text-lg">Competencies</CardTitle>
        <CardDescription className="text-sm">You can change settings here for competencies setup</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-start items-center gap-4 border-t px-4 py-8">
          <div className="flex flex-col basis-1/2">
            <span className="text-sm font-semibold">Enable Updating</span>
            <span className="text-xs">Adjust the dates to enable updating of CGA</span>
          </div>
          <Button onClick={openCgaEnableUpdatingForm} variant="outline" className="flex items-center">
            <CalendarIcon className="mr-2 h-4 w-4" />
            <span>{formattedStartDate && formattedEndDate
                ? `${formattedStartDate} - ${formattedEndDate}`
                : 'No set dates'}</span>
          </Button>
        </div>
      </CardContent>

      <CgaUpdatingForm />
    </Card>
  )
}

export default Competencies