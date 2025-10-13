import PageTitle from "@/components/PageTitle"
import { useState, useEffect } from "react"
import { useHasRole } from "@/hooks/useAuth"
import { Head, usePage, useForm } from "@inertiajs/react"
import Clock from "./Clock"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatDateWithTime, formatTime12 } from "@/lib/utils.jsx"
import { CalendarDays } from "lucide-react"
import { AlertCircleIcon, CircleAlert } from "lucide-react"

const breadcrumbItems = [
  { label: "Home", href: "/" },
  { label: "Flexiplace" },
  { label: "DTR", href: "/fwa" },
]

const logTypeLabels = {
  amIn: "AM IN",
  amOut: "AM OUT",
  pmIn: "PM IN",
  pmOut: "PM OUT",
}

const Fwa = () => {
  const { data } = usePage().props
  const { amIn: serverAmIn, amOut: serverAmOut, pmIn: serverPmIn, pmOut: serverPmOut, isFlexiplaceToday } = data

  const canViewPage = useHasRole(["HRIS_Staff"])

  if (!canViewPage) {
    return (
      <p className="font-semibold flex justify-center items-center h-full">
        You do not have permission to view this page.
      </p>
    )
  }

  const [currentDate, setCurrentDate] = useState(new Date())
  const [amIn, setAmIn] = useState(serverAmIn ? new Date(serverAmIn) : null)
  const [amOut, setAmOut] = useState(serverAmOut ? new Date(serverAmOut) : null)
  const [pmIn, setPmIn] = useState(serverPmIn ? new Date(serverPmIn) : null)
  const [pmOut, setPmOut] = useState(serverPmOut ? new Date(serverPmOut) : null)

  const { data: formData, setData, post, processing } = useForm({
    logType: "amIn",
  })

  // ✅ Automatically determine logType whenever logs change
  useEffect(() => {
    if (!amIn) {
      setData("logType", "amIn")
    } else if (!amOut) {
      setData("logType", "amOut")
    } else if (!pmIn) {
      setData("logType", "pmIn")
    } else if (!pmOut) {
      setData("logType", "pmOut")
    } else {
      setData("logType", "amIn") // next cycle
    }
  }, [amIn, amOut, pmIn, pmOut])

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const handleConfirm = () => {
    const now = new Date()

    post(route("fwa.store"), {
      onSuccess: () => {
        if (formData.logType === "amIn") setAmIn(now)
        if (formData.logType === "amOut") setAmOut(now)
        if (formData.logType === "pmIn") setPmIn(now)
        if (formData.logType === "pmOut") setPmOut(now)
      },
    })
  }

  return (
    <div className="h-full flex flex-col">
      <Head title="Flexiplace DTR" />
      <PageTitle
        pageTitle="Flexiplace DTR"
        description="Record your time entries here if you are under flexiplace arrangement"
        breadcrumbItems={breadcrumbItems}
      />

      {!isFlexiplaceToday && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 flex flex-col gap-2 border-l-4 border-red-400 mt-6">
          <div className="flex items-start gap-2">
              <CircleAlert className="w-4 h-4 mt-0.5" />
              <p className="font-semibold">
                  Unable to record time entry today
              </p>
          </div>
          <p className="pl-6">
            You cannot use this kiosk for Flexiplace today. Possible reasons:
            <div className="flex flex-col gap-1 mt-2">
              {!data.schedule && (
                <span>
                  • No Flexiplace schedule found. Check your schedule{" "}
                  <a
                    href={route("fwa.schedule.index")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-blue-600 hover:text-blue-800"
                  >
                    here
                  </a>.
                </span>
              )}

              {!data.approvedRto && (
                <span>
                  • No approved RTO found for today. View or request RTO{" "}
                  <a
                    href={route("rto.index")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-blue-600 hover:text-blue-800"
                  >
                    here
                  </a>.
                </span>
              )}
              </div>
          </p>
        </div>
      )}

      <div className="flex-grow flex items-center justify-center">
        <div className="flex flex-col lg:flex-row items-center gap-8">
          <div className="hidden lg:block">
            <Clock />
          </div>
          <div className="flex flex-col gap-8 items-center">
            <div className="text-center">
              <p className="text-lg text-left font-medium">Today is:</p>
              <p className="text-2xl font-semibold flex items-center gap-2">
                <CalendarDays className="inline" />
                {formatDateWithTime(currentDate)}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 w-full">
              <Card className="rounded-2xl shadow-md">
                <CardHeader className="p-2 text-center bg-muted-foreground text-white rounded-t-2xl">
                  <CardTitle className="text-sm font-medium">AM IN</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center py-6">
                  <span className="text-2xl font-semibold">
                    {formatTime12(amIn)}
                  </span>
                </CardContent>
              </Card>

              <Card className="rounded-2xl shadow-md">
                <CardHeader className="p-2 text-center bg-muted-foreground text-white rounded-t-2xl">
                  <CardTitle className="text-sm font-medium">AM OUT</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center py-6">
                  <span className="text-2xl font-semibold">
                    {formatTime12(amOut)}
                  </span>
                </CardContent>
              </Card>

              <Card className="rounded-2xl shadow-md">
                <CardHeader className="p-2 text-center bg-muted-foreground text-white rounded-t-2xl">
                  <CardTitle className="text-sm font-medium">PM IN</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center py-6">
                  <span className="text-2xl font-semibold">
                    {formatTime12(pmIn)}
                  </span>
                </CardContent>
              </Card>

              <Card className="rounded-2xl shadow-md">
                <CardHeader className="p-2 text-center bg-muted-foreground text-white rounded-t-2xl">
                  <CardTitle className="text-sm font-medium">PM OUT</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center py-6">
                  <span className="text-2xl font-semibold">
                    {formatTime12(pmOut)}
                  </span>
                </CardContent>
              </Card>
            </div>
            {((!amIn || !amOut || !pmIn || !pmOut) && isFlexiplaceToday) && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button">
                  Record Time Entry
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirm time record</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to record your time entry for{" "}
                    <b>{logTypeLabels[formData.logType]}</b>? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="border-0">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-primary text-white"
                    onClick={handleConfirm}
                    disabled={processing}
                  >
                    Yes, record it
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Fwa
