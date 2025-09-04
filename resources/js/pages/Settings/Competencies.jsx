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
import { useState, useEffect, useMemo } from "react"
import { useForm } from "@inertiajs/react"
import { format } from 'date-fns'
import CgaUpdatingForm from './CgaUpdatingForm'
import PaginationControls from '@/components/PaginationControls'
import { Calendar as CalendarIcon, Pencil, Trash } from "lucide-react"
import { useTable } from '@/hooks/useTable'
import { cn } from '@/lib/utils' 
import { flexRender } from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction
} from "@/components/ui/alert-dialog"
import { Loader2 } from 'lucide-react'
import Schedules from './Competencies/Schedules'


const Competencies = () => {
  const {
    setToast,
    competenciesState: {
      enableUpdatingState,
      enableUpdatingState: {
        startDate: cgaEnableUpdatingStartDate,
        endDate: cgaEnableUpdatingEndDate,
        isFormOpen: isCgaUpdatingFormOpen
      },
      schedulesState: {
        data: schedules,
        isFormOpen: isCgaScheduleFormOpen
      }
    },
    openCgaEnableUpdatingForm,
    closeCgaEnableUpdatingForm,
    loadCgaEnableUpdatingDates,
    fetchCgaSubmissionSchedules
  } = useSettingsStore()

  const {
    data,
    current_page,
    last_page: pageCount,
    total,
    per_page: perPage,
  } = schedules || {}

  const currentPageSafe = current_page ?? 1
  const perPageSafe = perPage ?? 20

  const [hoveredRowId, setHoveredRowId] = useState(null)
  const [showScheduleDialog, setShowScheduleDialog] = useState(false)
  const [editSchedule, setEditSchedule] = useState(null)

  const { 
    table, 
    pageIndex, 
    setPageIndex, 
    selectedRows 
  } = useTable({
    data: data || [],
    columns: useMemo(() => [
      {
        header: "Year",
        accessorKey: "year",
      },
      {
        header: "Schedule",
        cell: ({ row }) => {
          const { submission_dates } = row.original
          const [fromDate, toDate] = submission_dates?.split(' - ') ?? []
          const formattedFrom = fromDate ? format(new Date(fromDate), 'MMMM d, yyyy') : ''
          const formattedTo = toDate ? format(new Date(toDate), 'MMMM d, yyyy') : ''
          return `${formattedFrom} - ${formattedTo}`
        },
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const isHovered = row.id === hoveredRowId
          const { status } = row.original

          if (status) return null

          return (
            <div className="flex gap-2 justify-end items-center w-full">
              <div className={`flex transition-opacity duration-150 ${isHovered ? "opacity-100" : "opacity-0"}`}>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEditSchedule(row.original)}
                  className="h-8 w-8 p-0"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 p-0"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the schedule.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="border-0">
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive text-white hover:bg-destructive/90"
                        onClick={() => deleteCgaSchedule({ id: row.original.id })}
                        disabled={form.processing}
                      >
                        {form.processing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            <span>Deleting</span>
                          </>
                        ) : 'Yes, delete it'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          )
        }
      }
    ], [hoveredRowId]),
  })

  const { data: formData, setData, reset, processing, ...form } = useForm({
    year: '',
    submission_dates: '',
  })

  const deleteCgaSchedule = async ({ id }) => {
    try {
      // Replace with Inertia delete or axios
      await axios.delete(`/settings/cga-schedule/${id}`)
      setToast({ type: 'success', message: 'Schedule deleted successfully.' })
      fetchCgaSubmissionSchedules()
    } catch (error) {
      setToast({ type: 'error', message: 'Failed to delete schedule.' })
    }
  }

  const handleEditSchedule = (schedule) => {
    const [from, to] = schedule.submission_dates?.split(' - ') ?? []
    setData({
      year: schedule.year,
      from_date: from,
      to_date: to
    })
    setEditSchedule(schedule)
    setShowScheduleDialog(true)
  }

  const formattedStartDate = cgaEnableUpdatingStartDate
    ? format(new Date(cgaEnableUpdatingStartDate), 'MMMM dd, yyyy')
    : null
  const formattedEndDate = cgaEnableUpdatingEndDate
    ? format(new Date(cgaEnableUpdatingEndDate), 'MMMM dd, yyyy')
    : null

  useEffect(() => {
    loadCgaEnableUpdatingDates()
  }, [cgaEnableUpdatingStartDate, cgaEnableUpdatingEndDate])

  useEffect(() => {
    fetchCgaSubmissionSchedules()
  }, [])

  return (
    <Card>
      <CardHeader className="space-y-0 pb-4">
        <CardTitle className="text-lg">Competencies</CardTitle>
        <CardDescription className="text-sm">You can change settings here for competencies setup</CardDescription>
      </CardHeader>
      <CardContent className="border-t">
        <div className="flex justify-start items-center gap-4 px-4 py-8">
          <div className="flex flex-col basis-1/2">
            <span className="text-sm font-semibold">Submission Window</span>
            <span className="text-xs text-muted-foreground">Adjust the dates to enable submission of CGA</span>
          </div>
          <Button onClick={openCgaEnableUpdatingForm} variant="outline" className="flex items-center">
            <CalendarIcon className="mr-2 h-4 w-4" />
            <span>{formattedStartDate && formattedEndDate
              ? `${formattedStartDate} - ${formattedEndDate}`
              : 'No set dates'}</span>
          </Button>
        </div>
        <div className="flex justify-between items-start gap-4 px-4 py-8">
          <div className="flex flex-col basis-1/2">
            <span className="text-sm font-semibold">Submission Schedules</span>
            <span className="text-xs text-muted-foreground">Add or edit annual CGA submission periods.</span>
          </div>
          <div className="flex flex-col gap-2 flex-1 w-1/2 overflow-auto">
            <Schedules />
          </div>
        </div>
      </CardContent>
      <CgaUpdatingForm />
    </Card>
  )
}

export default Competencies
