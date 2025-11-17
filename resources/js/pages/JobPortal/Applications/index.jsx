import { useEffect, useState } from "react"
import PageTitle from "@/components/PageTitle"
import { usePage, Link, router } from "@inertiajs/react"
import { store } from "../store"
import { formatDate } from "@/lib/utils.jsx"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog"
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs"
import {
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
} from "@/components/ui/table"
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover"
import { MoreHorizontal, CircleAlert, TriangleAlert, CircleCheck } from "lucide-react"
import Welcome from "./Welcome"
import PaginationControls from "@/components/PaginationControls"

const Applications = () => {
  const { flash, data: { applications } } = usePage().props

  console.log(applications)

  const {
    data,
    current_page,
    last_page: pageCount,
    total,
    per_page: perPage,
  } = applications

  const { setSelectedApplication } = store()

  const [showFlash, setShowFlash] = useState(!!flash?.status)

  useEffect(() => {
    if (flash?.status) {
      setShowFlash(true)
      const timer = setTimeout(() => setShowFlash(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [flash])

  const activeApps = data.filter(app => app.status !== "No Longer Considered")
  const inactiveApps = data.filter(app => app.status === "No Longer Considered")

  const setPageIndex = (pageIndex) => {
    router.get(
      route("applications.index"), // adjust route name if needed
      { page: pageIndex + 1 }, // backend expects 1-based page index
      { preserveState: true, replace: true }
    )
  }

  const renderTable = (apps, label) => (
    <Card className="border-none shadow-none">
      <CardContent className="p-0">
        {apps.length > 0 ? (
          <>
          <Table className="mb-8">
            <TableHeader>
              <TableRow className="[&>th]:py-2">
                <TableHead>Reference No.</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date Submitted</TableHead>
                <TableHead className="text-center">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apps.map((app) => (
                <TableRow
                  key={app.id}
                  className="cursor-pointer [&>td]:py-2"
                  onClick={() => setSelectedApplication(app)}
                >
                  <TableCell className="font-medium text-blue-600">
                    {app.appointment_status === "Permanent"
                      ? `${app.reference_no}-${app.item_no}`
                      : `${app.reference_no}-${app.position}`}
                  </TableCell>
                  <TableCell>{app.position}</TableCell>
                  <TableCell className="capitalize">
                    {app.status === "Draft" ? (
                      <div className="flex flex-col">
                        <span className="font-medium">Not Submitted</span>
                        <span className="text-xs text-gray-500">Created on {formatDate(app.date_created)}</span>
                      </div>
                    ) : (
                      <span className="capitalize">{app.latest_status}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {app.date_submitted && formatDate(app.date_submitted)}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center">
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="p-1 rounded-full hover:bg-gray-100">
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </PopoverTrigger>

                        <PopoverContent align="end" className="w-48 p-2">
                          {app.latest_status === "Draft" ? (
                            <>
                              <button
                                onClick={() => router.post(route("jobs.store", { hashedId: app.hashed_id }))} 
                                className="w-full text-left px-3 py-2 rounded-md text-sm hover:bg-gray-100"
                              >
                                Continue Application
                              </button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <button className="w-full text-left px-3 py-2 rounded-md text-sm text-red-600 hover:bg-red-50">
                                    Delete Application
                                  </button>
                                </AlertDialogTrigger>

                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Application?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This action cannot be undone. Your application record will be permanently deleted.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel className="border-none">Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() =>
                                        router.delete(route("applications.destroy", app.id), {
                                          preserveScroll: true,
                                        })
                                      }
                                      className="bg-red-600 hover:bg-red-700 text-white"
                                    >
                                      Yes, delete it
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </>
                          ) : (
                            <span className="block text-sm text-gray-500 px-3 py-2">
                              No actions available
                            </span>
                          )}
                        </PopoverContent>
                      </Popover>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex justify-end">
            <PaginationControls
              pageIndex={current_page - 1}
              pageCount={pageCount}
              setPageIndex={setPageIndex}
            />
          </div>
          </>
        ) : (
          <div className="flex flex-col justify-center items-center p-6">
            <img
              src="/images/no_applications.svg"
              alt="No Applications"
              className="h-[150px] w-auto mb-2"
            />
            <span className="font-medium text-sm">
              No {label.toLowerCase()} applications.
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="flex flex-col h-full gap-4">
      <PageTitle
        pageTitle="My Applications"
        description="Explore current job openings and track your application progress."
      />
      <div className="rounded-md bg-green-50 p-3 text-sm text-green-700 flex flex-col gap-2 border-l-4 border-green-400">
          <div className="flex items-start gap-2">
              <CircleAlert className="w-4 h-4 mt-0.5" />
              <p className="font-semibold">
                  Important Notes
              </p>
          </div>
          <p className="pl-6">
            Before submitting an application, make sure your{" "}
            <span className="font-bold">Profile</span> is updated. Click{" "}
            <span className="text-blue-500 font-semibold">
              <Link href={route("applicant.index")}>here</Link>
            </span>{" "}
            to update.
          </p>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-start gap-4">
        <div className="flex-1 lg:basis-3/4 border rounded-lg p-4">
          <h4 className="font-semibold text-black text-lg mb-4">Applications</h4>
          {showFlash && flash?.status && (
            <div
              className={`rounded-md p-3 text-sm flex flex-col gap-2 border-l-4 mb-4
                ${
                  flash.status === "success"
                    ? "bg-green-50 text-green-700 border-green-400"
                    : "bg-red-50 text-red-700 border-red-400"
                }`}
            >
              <div className="flex items-start gap-2">
                {flash.status === "success" ? (
                  <CircleCheck className="w-4 h-4 mt-0.5" />
                ) : (
                  <TriangleAlert className="w-4 h-4 mt-0.5" />
                )}
                <p
                  className={`font-semibold ${
                    flash.status === "success" ? "text-green-800" : "text-red-800"
                  }`}
                >
                  {flash.title}
                </p>
              </div>
              <p className="pl-6">{flash.message}</p>
            </div>
          )}
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="w-full flex gap-4 justify-start bg-white border-b">
              <TabsTrigger
                value="active"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:text-black"
              >
                Active ({activeApps.length})
              </TabsTrigger>
              <TabsTrigger
                value="inactive"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:text-black"
              >
                Inactive ({inactiveApps.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="p-0">
              {renderTable(activeApps, "Active")}
            </TabsContent>
            <TabsContent value="inactive" className="p-0">
              {renderTable(inactiveApps, "Inactive")}
            </TabsContent>
          </Tabs>
        </div>

        <div className="hidden lg:block lg:basis-1/4">
          <Welcome />
        </div>
      </div>
    </div>
  )
}

export default Applications
