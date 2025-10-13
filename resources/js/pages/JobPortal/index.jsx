import PageTitle from "@/components/PageTitle"
import useCrudTable from "@/hooks/useCrudTable"
import { usePage, router, Link } from '@inertiajs/react'
import { useState, useEffect, useMemo } from "react"
import { useHasRole } from "@/hooks/useAuth"
import { Loader2, Search, Filter, ChevronRight, MapPin, Banknote, FileCog, Building, CircleX } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card"
import { store } from "./store"
import { formatDate } from "@/lib/utils.jsx"
import JobTypeBadge from "./JobTypeBadge"
import JobDescription from "./JobDescription"
import PaginationControls from '@/components/PaginationControls'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

const JobPortal = () => {

    const { data: { jobs, latest_application } } = usePage().props

    const {
        data,
        current_page,
        last_page: pageCount,
        total,
        per_page: perPage,
    } = jobs

    const pageIndex = current_page - 1

    const [search, setSearch] = useState("")
    const [showFilter, setShowFilter] = useState(false)
    const [filters, setFilters] = useState({
        appointment_status: "",
        sg: "",
        division: ""
    })

    const setPageIndex = (newPageIndex) => {
        router.get(
            route("jobs.index"),
            { 
                page: newPageIndex + 1,
                search,
                filter: filters, 
            },
            { preserveScroll: true, preserveState: true }
        )
    }

    const handleSearch = () => {
        router.get(
            route("jobs.index"), 
            { search, filter: filters },
            { preserveState: true, preserveScroll: true }
        )
    }

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }))
    }

    const handleClearFilters = () => {
        const cleared = { appointment_status: "", sg: "", division: "" }
        setFilters(cleared)
        router.get(
            route("jobs.index"),
            { search, filter: cleared },
            { preserveState: true, preserveScroll: true }
        )
    }

    const divisions = useMemo(() => [
        { value: 'DRD', label: 'Development Research, Communication, and Advocacy Division', },
        { value: 'FAD', label: 'Finance and Administrative Division'},
        { value: 'ORD', label: 'Office of the Regional Director'},
        { value: 'PMED', label: 'Monitoring and Evaluation Division'},
        { value: 'PDIPBD', label: 'Project Development, Investment Programming and Budgeting Division'},
        { value: 'PFPD', label: 'Policy Formulation and Planning Division'},
    ], [])

    const appointmentStatuses = useMemo(() => [
      { label: 'Permanent', value: 'Permanent'},
      { label: 'Casual', value: 'Casual'},
      { label: 'Contractual', value: 'Contractual'},
      { label: 'Contract of Service', value: 'Contract of Service'},
      { label: 'Job Order', value: 'Job Order'},
      { label: 'Temporary', value: 'Temporary'},
    ], [])

    return (
        <div className="flex flex-col h-full gap-4">
            <PageTitle
                pageTitle="Careers"
                description="Explore current job openings and find the right opportunity for you"
            />
            <div className="overflow-x-auto">
                <div className="relative">
            
                </div>
            </div>

            <div className="flex gap-4 mb-2">
                <div className="relative flex-grow">
                <Input
                    placeholder="Job title or item number"
                    className="pr-8" // make room for the clear icon
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
                {search && (
                    <button
                    type="button"
                    onClick={() => {
                        setSearch("");
                        router.get(
                        route("jobs.index"),
                        { search: "", filter: filters },
                        { preserveState: true, preserveScroll: true }
                        );
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                    <CircleX className="h-4 w-4" />
                    </button>
                )}
                </div>
                <Button
                    variant="outline"
                    onClick={() => setShowFilter(!showFilter)}
                >
                {showFilter ? (
                    <>
                    <CircleX className="h-4 w-4" />
                    <span className="hidden md:block ml-1">Close Filters</span>
                    </>
                ) : (
                    <>
                    <Filter className="h-4 w-4" />
                    <span className="hidden md:block ml-1">Filter Results</span>
                    </>
                )}
                </Button>
                <Button onClick={handleSearch} ><Search className="h-4 w-4" /> Search Jobs</Button>
            </div>

            {/* Filter Section */}
            {showFilter && (
                <Card className="p-4 mb-4 animate-fadeIn">
                    <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                        <Label>Appointment Status</Label>
                        <Select
                            value={filters.appointment_status}
                            onValueChange={(value) => handleFilterChange("appointment_status", value)}
                        >
                            <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                            {appointmentStatuses.map((a) => (
                                <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                        </div>

                        <div>
                        <Label>Salary Grade</Label>
                        <Input
                            type="number"
                            value={filters.sg}
                            onChange={(e) => handleFilterChange("sg", e.target.value)}
                        />
                        </div>

                        <div>
                        <Label>Division / Office</Label>
                        <Select
                            value={filters.division}
                            onValueChange={(value) => handleFilterChange("division", value)}
                        >
                            <SelectTrigger>
                            <SelectValue placeholder="Select division" />
                            </SelectTrigger>
                            <SelectContent>
                            {divisions.map((d) => (
                                <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                        </div>

                        <div className="flex justify-end md:col-span-3 gap-2 mt-2">
                            {/* ✅ updated Clear button */}
                            <Button variant="outline" onClick={handleClearFilters}>Clear</Button>
                            <Button onClick={handleSearch}>Apply Filters</Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="gap-6 flex-grow">
                <div className="space-y-2 flex flex-col min-h-[70vh]">
                    <h3 className="text-xl font-bold">
                        Available Jobs ({parseFloat(total).toLocaleString('en-US', {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0
                        })})
                    </h3>
                    <div className="flex-1 flex flex-col gap-4">
                        {data.length > 0 ? (
                        data.map((job) => (
                            <Sheet key={job.id}>
                                <SheetTrigger className="w-full text-left">
                                    <div
                                        key={job.id}
                                        className={`p-4 border rounded-lg shadow-sm hover:shadow-md transition cursor-pointer bg-white hover:bg-muted`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex flex-col">
                                                <h3 className="text-lg font-bold text-blue-500">{job.position_description ?? ""}</h3>
                                                <h3 className="text-sm font-semibold mb-4">{job.item_no ?? ""}</h3>
                                                <div className="space-y-2 mb-4">
                                                    <div className="flex items-center gap-4">
                                                        <Building className="w-4 h-4" />
                                                        <JobTypeBadge type={job.appointment_status} />
                                                    </div>
                                                    {job.appointment_status === "Permanent" && (
                                                        <div className="flex items-center gap-4">
                                                            <FileCog className="w-4 h-4" />
                                                            <span className="text-sm font-medium">Plantilla Item No. {job.item_no}</span>
                                                        </div>
                                                    )}
                                                    <div className="flex items-center gap-4">
                                                        <MapPin className="w-4 h-4" />
                                                        <span className="text-sm font-medium">{job.division_name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <Banknote className="w-4 h-4" />
                                                        <span className="text-sm font-medium">
                                                            Salary Grade {job.sg} / 
                                                            P{parseFloat(job.monthly_salary).toLocaleString('en-US', {
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2
                                                            })}</span>
                                                    </div>
                                                </div>
                                                <p className="text-sm">Deadline of submission: <span className="text-red-500 font-semibold">{formatDate(job.date_closed)}</span></p>
                                            </div>
                                            <ChevronRight className="w-4 h-4 mt-1 text-gray-400" />
                                        </div>
                                    </div>
                                </SheetTrigger>
                                <JobDescription action="apply" job={job} latestApp={latest_application} />
                            </Sheet>
                        ))
                        ) : (
                        <div className="flex items-center justify-center text-sm text-gray-500 h-full">
                            No job posting available
                        </div>
                        )}
                    </div>
                    {pageCount > 1 && (
                        <div className="mt-auto pt-4">
                            <PaginationControls
                            pageIndex={pageIndex}
                            pageCount={pageCount}
                            setPageIndex={setPageIndex}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default JobPortal