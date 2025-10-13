import { useState } from "react"
import { usePage, Link, useForm } from "@inertiajs/react"
import { ChevronLeft, ChevronDown, Pencil, Trash2 } from "lucide-react"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuGroup } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import PageTitle from "@/components/PageTitle"
import { ScrollArea } from "@/components/ui/scroll-area"
import VacancyInfo from "./VacancyInfo/index"
import Requirements from "./Requirements/index"
import Applicants from "./Applicants/index"
import BeiQuestions from "./BeiQuestions/index"
import { store } from "./store"
import { useToast } from "@/hooks/use-toast"

const ViewVacancy = () => {
  const { vacancy } = usePage().props
  const { deleteVacancy } = store()
  const { toast } = useToast()
  const form = useForm()

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Recruitment", href: "#" },
    { label: "Vacancies", href: route("vacancies.index") },
    {
      label: `${vacancy.reference_no}: ${vacancy.position_description}${
        vacancy.appointment_status === "Permanent" && vacancy.item_no
          ? ` (${vacancy.item_no})`
          : ""
      }`,
      href: route("vacancies.show", vacancy.id),
    },
  ]

  const menuItems = [
    { key: "Details", label: "Vacancy Details" },
    { key: "Requirements", label: "Requirements" },
    { key: "Applicants", label: "Applicants" },
    { key: "BEI Questions", label: "BEI Questions" },
    { key: "Assessment", label: "Assessment" },
  ]

  const [currentTab, setCurrentTab] = useState("Details")

  return (
    <div className="h-full flex flex-col gap-2">

      {/* Header Section */}
      <div className="flex justify-between items-center">
        <Link href={route("vacancies.index")} className="hidden md:block">
          <Button variant="ghost" size="sm" className="flex items-center">
            <ChevronLeft className="h-8 w-8" />
            <span className="sr-only sm:not-sr-only">Back to Vacancies</span>
          </Button>
        </Link>

        {/* More Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="flex items-center">
              <span className="sr-only sm:not-sr-only">More Actions</span>
              <ChevronDown className="h-8 w-8" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>This Vacancy</DropdownMenuLabel>
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <Link
                  href={route("vacancies.edit", vacancy.id)}
                  className="flex justify-between w-full"
                >
                  <span>Edit</span>
                  <Pencil className="h-4 w-4" />
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
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
                      This action cannot be undone. This will permanently delete
                      the vacancy.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-white hover:bg-destructive/90"
                      onClick={() =>
                        deleteVacancy({ id: vacancy.id, form, toast })
                      }
                    >
                      Yes, delete it
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Page Title */}
      <PageTitle
        pageTitle={`${vacancy.reference_no}: ${vacancy.position_description}${
          vacancy.appointment_status === "Permanent" && vacancy.item_no
            ? ` (${vacancy.item_no})`
            : ""
        }`}
        description="Manage the vacancy processes here."
        breadcrumbItems={breadcrumbItems}
      />

      {/* Horizontal Tab Menu */}
      <div className="border-b border-gray-200 mb-4">
        <div className="flex overflow-x-auto">
          {menuItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setCurrentTab(item.key)}
              className={`px-4 py-3 text-sm font-medium transition whitespace-nowrap ${
                currentTab === item.key
                  ? "text-blue-600 font-semibold border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-blue-600 border-b-2 border-transparent"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1">
        <ScrollArea className="h-full border rounded-lg p-4">
          {currentTab === "Details" && <VacancyInfo />}
          {currentTab === "Requirements" && <Requirements />}
          {currentTab === "Applicants" && <Applicants />}
          {currentTab === "BEI Questions" && <BeiQuestions />}
        </ScrollArea>
      </div>
    </div>
  )
}

export default ViewVacancy
