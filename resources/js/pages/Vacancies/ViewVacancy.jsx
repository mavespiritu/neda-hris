import { Head } from '@inertiajs/react'
import { useState, useEffect, useMemo } from 'react'
import { useHasRole } from '@/hooks/useAuth'
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Link } from '@inertiajs/react'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import PageTitle from "@/components/PageTitle"
import { ScrollArea } from "@/components/ui/scroll-area"
import VacancyInfo from "./VacancyInfo/index"
import Requirements from "./Requirements/index"
import BeiQuestions from "./BeiQuestions/index"
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip"
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table"
import { useTable } from '@/hooks/useTable'
import { useDebounce } from 'use-debounce'
import { parse, format, isValid } from 'date-fns'
import { 
    Search, 
    ThumbsUp, 
    Plus, 
    ThumbsDown, 
    Trash2, 
    Pencil, 
    ChevronLeft, 
    Printer, 
    Settings, 
    ChevronDown,
    Eye,
    EyeOff 
} from 'lucide-react'
import { store } from './store'
import { cn } from "@/lib/utils"
import { usePage, useForm } from '@inertiajs/react'


const ViewVacancy = () => {

  const { toast } = useToast()

    const { vacancy } = usePage().props

    const {
        deleteVacancy,
    } = store()

    const form = useForm()

    const breadcrumbItems = [
        { label: 'Home', href: '/' },
        { label: 'Recruitment', href: '#' },
        { label: 'Vacancies', href: route('vacancies.index') },
        {
            label: `Vacancy Info: [RF#: ${vacancy.reference_no}] ${vacancy.position}${vacancy.item_no ? ` (${vacancy.item_no})` : ''}`,
            href: route('vacancies.show', vacancy.id)
        }
    ]

    /* const canView = useCanViewResource(vacancy, {
        allowedRoles: ['HRIS_HR', 'HRIS_DC'],
        divisionKey: 'division'
    })

    if (!canView) {
        return <div className="text-red-500">You are not allowed to view this vacancy.</div>
    } */

    const menuItems = [
      "Vacancy Info",
      "Requirements",
      "Applicants",
      "BEI Questions",
      "Assessment",
    ]

    const [currentTab, setCurrentTab] = useState('Vacancy Info')
    const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="h-[calc(100vh-115px)] flex flex-col gap-2">

      <div className="flex justify-between">
        <Link
            href={route('vacancies.index')}
            className="hidden md:block"
        >
            <Button
                variant="ghost"
                className="flex items-center rounded-md disabled:opacity-50"
                size="sm"
            >
                <ChevronLeft className="h-8 w-8" />
                <span className="sr-only sm:not-sr-only">Back to Vacancies</span>
            </Button>
        </Link>
        <div className="flex gap-2">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button 
                        variant="outline"
                        size="sm"
                        className="flex items-center" 
                    >
                        <span className="sr-only sm:not-sr-only">More Actions</span>
                        <ChevronDown className="h-8 w-8" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>This Vacancy</DropdownMenuLabel>
                    <DropdownMenuGroup>
                        <DropdownMenuItem 
                            className="flex justify-between"
                        >
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
                                This action cannot be undone. This will permanently delete the vacancy.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                className="bg-destructive text-white hover:bg-destructive/90"
                                onClick={() => {
                                    deleteVacancy({
                                    id: vacancy.id,
                                    form,
                                    toast,
                                    })
                                }}
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
      </div>

      <PageTitle pageTitle={`Vacancy Info: [RF#: ${vacancy.reference_no}] ${vacancy.position}${vacancy.item_no ? ` (${vacancy.item_no})` : ''}`} description="Manage the vacancy info here." breadcrumbItems={breadcrumbItems}/>

      <div className="flex flex-1 flex-col md:flex-row gap-4 overflow-hidden">

        <div className="w-full md:w-[20%] py-4">
          <div className="space-y-2 text-sm font-medium">
            {/* Mobile Dropdown */}
            <div className="md:hidden mb-4">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-4 py-2 border rounded-md text-left bg-white shadow-sm"
              >
                {currentTab || "Select Menu"}
              </button>
              {isOpen && (
                <div className="mt-2 border rounded-md bg-white shadow-sm">
                  {menuItems.map((item) => (
                    <button
                      key={item}
                      onClick={() => {
                        setCurrentTab(item)
                        setIsOpen(false)
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {/* Desktop Sidebar Nav */}
            <nav className="hidden md:flex flex-col gap-2">
              {menuItems.map((item) => (
                <button
                  key={item}
                  onClick={() => setCurrentTab(item)}
                  className={`text-left px-4 py-2 rounded-md transition ${
                    currentTab === item
                      ? "bg-gray-200 font-semibold"
                      : "hover:bg-gray-100"
                  }`}
                >
                  {item}
                </button>
              ))}
            </nav>
          </div>
        </div>

        <div className="w-full md:w-[80%] h-full">
          <ScrollArea className="h-full border rounded-lg p-4">
            {currentTab === 'Vacancy Info' && <VacancyInfo />}
            {currentTab === 'Requirements' && <Requirements />}
            {currentTab === 'BEI Questions' && <BeiQuestions />}
          </ScrollArea>
        </div>

      </div>

    </div>
  )
}

export default ViewVacancy