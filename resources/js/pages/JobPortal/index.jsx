import PageTitle from "@/components/PageTitle"
import useCrudTable from "@/hooks/useCrudTable"
import { usePage, router, Link } from '@inertiajs/react'
import { useState, useEffect, useMemo } from "react"
import { useHasRole } from "@/hooks/useAuth"
import { Loader2, Search, Filter, ChevronRight, MapPin, Banknote, FileCog, Building } from "lucide-react"
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

    const setPageIndex = (newPageIndex) => {
        router.get(
        route("jobs.index"),
        { page: newPageIndex + 1 },
        { preserveScroll: true, preserveState: true }
        )
    }

    const {
        setSelectedJob,
        selectedJob
    } = store()

    return (
        <div className="flex flex-col h-full gap-4">
            <PageTitle
                pageTitle="Search Jobs"
                description="Explore current job openings and find the right opportunity for you"
            />
            <div className="overflow-x-auto">
                <div className="relative">
            
                </div>
            </div>

            <div className="flex gap-4 mb-2">
                <Input placeholder="Job title or keyword" className="flex-grow" />
                <Button variant="outline">
                <Filter className="h-4 w-4" />
                <span className="hidden md:block">Filter Results</span>
                </Button>
                <Button><Search className="h-4 w-4" /> Search</Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-grow">
                <div className="lg:col-span-2 space-y-2 flex flex-col min-h-[70vh]">
                    <h3 className="text-lg font-semibold">
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
                                        onClick={() => setSelectedJob(job)}
                                        className={`p-4 border rounded-lg shadow-sm hover:shadow-md transition cursor-pointer bg-white hover:bg-muted`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex flex-col">
                                                <h3 className="text-lg font-semibold text-blue-500">{job.position_description ?? ""}</h3>
                                                <h3 className="text-sm mb-4">{job.division_name ?? ""}</h3>
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
                                                            SG {job.sg} / 
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
                            No jobs found
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
                <div className="lg:col-span-1 border"></div>
            </div>
        </div>
    )
}

export default JobPortal