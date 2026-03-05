import PageTitle from "@/components/PageTitle"
import { useEffect } from "react"
import { Link, usePage, useForm } from "@inertiajs/react"
import { ChevronLeft, ChevronDown, Pencil, Trash2, Printer } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu"

import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { useLocalStorage } from "@/hooks/useLocalStorage"

import ResponsiveTabs from "@/components/ResponsiveTabs"

import TravelRequest from "./TravelRequest"
import VehicleRequest from "./VehicleRequest"
import TripTicket from "./TripTicket"

const View = () => {
  const { toast } = useToast()
  const form = useForm()

  const {
    auth: { user },
    travelOrder,
    vehicles,
    serviceExpenses,
    reasons,
    can,
  } = usePage().props

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Travel Requests", href: route("travel-requests.index") },
    {
      label: `Travel Request No. ${travelOrder.reference_no}`,
      href: route("travel-requests.show", travelOrder.id),
    },
  ]

  const isRequestingVehicle = !!travelOrder?.isRequestingVehicle
  const isVehicleAuthorized =
    String(travelOrder?.vehicle_request_status || "").trim() === "Vehicle Authorized"

  const tabs = [
    { key: "trip", label: "Trip Information", hash: "trip-information" },
    {
      key: "vehicle",
      label: "Vehicle Request",
      hash: "vehicle-request",
      hidden: !isRequestingVehicle,
    },
    {
      key: "ticket",
      label: "Trip Ticket",
      hash: "trip-ticket",
      hidden: !(isRequestingVehicle && isVehicleAuthorized),
    },
  ]

  const [currentTab, setCurrentTab] = useLocalStorage(
    "TRAVEL_REQUEST_VIEW_TAB",
    "trip"
  )

  useEffect(() => {
    const visible = tabs.filter((t) => !t.hidden).map((t) => t.key)
    if (!visible.includes(currentTab)) {
      setCurrentTab("trip")
    }
  }, [isRequestingVehicle, isVehicleAuthorized])

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-2">
        <Link href={route("travel-requests.index")} className="hidden md:block">
          <Button variant="ghost" size="sm" className="flex items-center">
            <ChevronLeft className="h-8 w-8" />
            <span className="sr-only sm:not-sr-only">Back to Travel Requests</span>
          </Button>
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="flex items-center">
              <span className="sr-only sm:not-sr-only">More Actions</span>
              <ChevronDown className="h-8 w-8" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>This Travel Request</DropdownMenuLabel>

            <DropdownMenuGroup>
              {can?.edit && (
                <DropdownMenuItem asChild>
                  <Link
                    href={route("travel-requests.edit", travelOrder.id)}
                    className="flex justify-between w-full"
                  >
                    <span>Edit</span>
                    <Pencil className="h-4 w-4" />
                  </Link>
                </DropdownMenuItem>
              )}

              {can?.view && (
                <DropdownMenuItem
                  onSelect={() => {
                    window.open(
                      route("travel-requests.generate", travelOrder.id),
                      "_blank",
                      "noopener,noreferrer"
                    )
                  }}
                  className="flex justify-between"
                >
                  <span>Print</span>
                  <Printer className="h-4 w-4" />
                </DropdownMenuItem>
              )}

              {can?.edit && can?.delete && <DropdownMenuSeparator />}

              {can?.delete && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <div
                      className="flex justify-between items-center px-2 py-1.5 text-sm text-destructive cursor-pointer hover:bg-destructive/10 rounded-sm"
                      role="menuitem"
                    >
                      <span>Delete</span>
                      <Trash2 className="h-4 w-4" />
                    </div>
                  </AlertDialogTrigger>

                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the travel order.
                      </AlertDialogDescription>
                    </AlertDialogHeader>

                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive text-white hover:bg-destructive/90"
                        onClick={() => console.log({ id: travelOrder.id, form, toast })}
                      >
                        Yes, delete it
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <PageTitle
        pageTitle={`Travel Request No. ${travelOrder.reference_no}`}
        description="View travel request information here."
        breadcrumbItems={breadcrumbItems}
      />

      <div className="flex-1">
        <ScrollArea className="h-full">
          <div className="border rounded-lg p-4 h-full">
            <div className="flex flex-col md:flex-row gap-6 h-full">
              {/* ✅ Tabs */}
              <div className="w-full md:w-[20%]">
                <ResponsiveTabs
                  tabs={tabs}
                  value={currentTab}
                  onChange={setCurrentTab}
                  syncHash
                  fallbackKey="trip"
                  tabClassName="text-sm"
                  activeTabClassName="text-sm"
                />
              </div>

              {/* Content */}
              <div className="flex-1 border rounded-md p-4 bg-background">
                {currentTab === "trip" && (
                  <TravelRequest travelOrder={travelOrder} can={can} user={user} />
                )}

                {currentTab === "vehicle" && isRequestingVehicle && (
                  <VehicleRequest
                    travelOrder={travelOrder}
                    can={can}
                    user={user}
                    vehicles={vehicles}
                    serviceExpenses={serviceExpenses}
                    reasons={reasons}
                  />
                )}

                {currentTab === "ticket" && isRequestingVehicle && isVehicleAuthorized && (
                  <TripTicket
                    travelOrderId={travelOrder.id}
                  />
                )}
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}

export default View
