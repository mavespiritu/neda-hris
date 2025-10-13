import { Button } from "@/components/ui/button"
import { Head } from "@inertiajs/react"
import { Input } from "@/components/ui/input"
import { useState, useEffect, useMemo } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Briefcase,
  Search,
  Wallet,
  PhilippinePeso,
  Calendar,
  Scroll,
  Filter,
  CircleX,
  FileCog,
  Banknote,
  Phone,
  Mail,
  Building
} from "lucide-react"
import { TypewriterEffect } from "@/components/TypewriterEffect"
import { usePage, router, Link } from '@inertiajs/react'
import { formatDate } from "@/lib/utils.jsx"
import JobTypeBadge from "@/pages/JobPortal/JobTypeBadge"
import JobDescription from "@/pages/JobPortal/JobDescription"
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
import ReportIssueButton from "@/components/ReportIssueButton"

const words = [
    { text: "Be", className: "dark:text-white" },
    { text: "a", className: "dark:text-white" },
    { text: "development", className: "dark:text-white" },
    { text: "catalyst.", className: "dark:text-white" },
]

const Home = () => {
  
  const { data: { jobs } } = usePage().props

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
              route("home"),
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
              route("home"), 
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
              route("home"),
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
    <div className="flex flex-col min-h-screen">
      <Head title="DEPDev RO1 HRIS" />

      {/* Hero Section */}
    <section
        className="relative bg-gray-100 bg-cover bg-center bg-no-repeat"
        style={{
            backgroundImage: "url('/images/rpfp.png')",
            backgroundPosition: "center center",
            backgroundSize: "60%",
            backgroundRepeat: "no-repeat",
        }}
        >
        {/* Light gray overlay */}
        <div className="absolute inset-0 bg-gray-100/40 backdrop-blur-[4px]" />

        {/* Fade to white at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent pointer-events-none" />

        <div className="relative max-w-7xl mx-auto h-[360px] px-6 md:px-12 lg:px-20 flex justify-center items-center">
            <div className="flex flex-col items-center gap-2 text-center">
              <TypewriterEffect words={words} />
              <span className="text-lg font-medium mb-8 text-gray-700">
                  Discover opportunities to contribute to sustainable development and economic progress.
              </span>
              <div className="relative flex mx-auto rounded-xl overflow-hidden shadow-lg bg-white/90 backdrop-blur-sm ring-1 ring-gray-200">
                {/* Input + Clear Button */}
                <div className="relative flex-1">
                  <Input
                    placeholder="Job Title or Plantilla Item No."
                    className="rounded-none w-[300px] md:w-[500px] lg:w-[600px] h-14 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
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
                          route("home"),
                          { search: "", filter: filters },
                          { preserveState: true, preserveScroll: true }
                        );
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <CircleX className="h-5 w-5" />
                    </button>
                  )}
                </div>

                {/* Search Button */}
                <Button
                  className="bg-blue-700 hover:bg-blue-600 rounded-none h-14 shadow-none hover:shadow-md transition-all px-6 text-base"
                  onClick={handleSearch}
                >
                  <Search className="mr-2 h-4 w-4" /> Search Jobs
                </Button>
              </div>
            </div>
        </div>
        </section>


      {/* Latest Jobs */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 lg:px-20 py-12 flex-1 w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold">Available Jobs ({parseFloat(total).toLocaleString('en-US', {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0
                        })})</h2>
          <Button
              variant="outline"
              size="lg"
              onClick={() => setShowFilter(!showFilter)}
          >
          {showFilter ? (
              <>
              <CircleX className="h-4 w-4" />
              <span className="hidden md:block ml-1 text-base">Close Filter</span>
              </>
          ) : (
              <>
              <Filter className="h-4 w-4" />
              <span className="hidden md:block ml-1 text-base">Filter Jobs</span>
              </>
          )}
          </Button>
        </div>
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

        <div className="flex justify-between items-center mb-2 text-sm">
          <span>
            Showing{" "}
            <strong>
              {data.length > 0 ? (current_page - 1) * perPage + 1 : 0}
            </strong>{" "}
            -{" "}
            <strong>
              {(current_page - 1) * perPage + data.length}
            </strong>{" "}
            of{" "}
            <strong>{total.toLocaleString()}</strong> available jobs
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
          {data.length > 0 ? (
            data.map((job) => (
              <Card key={job.id} className="flex flex-col">
                <CardHeader className="border-t-4 border-blue-500 rounded">
                  <CardTitle className="leading-tight text-xl flex flex-col gap-2">
                    <JobTypeBadge type={job.appointment_status} />
                    {job.position_description}
                  </CardTitle>
                  <CardDescription>
                    {job.division_name}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col gap-2">
                  {job.appointment_status === "Permanent" && (
                      <div className="flex items-center gap-4">
                          <FileCog className="w-4 h-4" />
                          <span className="text-sm font-medium">Plantilla Item No. {job.item_no}</span>
                      </div>
                  )}
                  <div className="flex items-center gap-4">
                      <Banknote className="w-4 h-4" />
                      <span className="text-sm font-medium">
                          Salary Grade {job.sg} / 
                          P{parseFloat(job.monthly_salary).toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                          })}</span>
                  </div>
                  <div className="flex items-start gap-4">
                      <Calendar className="w-4 h-4" />
                      <div className="flex flex-col">
                        <p className="text-sm font-medium">Deadline of submission:</p>
                        <span className="text-red-500 text-sm font-semibold">{formatDate(job.date_closed)}</span>
                      </div>
                  </div>
                  
                </CardContent>
                <CardFooter>
                  <Sheet>
                    <SheetTrigger className="w-full text-left"
                    >
                      <Button size="lg" className="w-full bg-blue-700 hover:bg-blue-600">View Job Details</Button>
                    </SheetTrigger>
                    <JobDescription action="apply" job={job} latestApp={null} />
                  </Sheet>
                </CardFooter>
              </Card>
            ))
          ) : (
            <div className="col-span-full flex items-center justify-center text-sm font-semibold h-40">
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
      </section>

      {/* Footer */}
      <footer className="bg-[#003366] text-white mt-auto">
        <div
          className="max-w-7xl mx-auto px-6 md:px-12 lg:px-20 py-10 grid gap-8 text-sm text-white/80 
                    grid-cols-1 sm:grid-cols-2 lg:grid-cols-[30%_30%_20%_20%]"
        >
          {/* Column 1 */}
          <div className="flex flex-col items-center text-center sm:text-left text-white/70">
            <img src="/images/republika.png" alt="Philippine Logo" className="w-32 sm:w-40 lg:w-48 h-auto mb-4 opacity-90" />
            <h3 className="font-semibold text-lg mb-2 leading-tight text-white">
              Republic of the Philippines
            </h3>
            <p className="text-muted/50 text-center">All content is in the public domain unless otherwise stated.</p>
          </div>

          {/* Column 2 */}
          <div className="text-white/80">
            <h3 className="font-semibold text-lg mb-3 text-white">Contact Us</h3>
            <div className="flex flex-col gap-4">
              <div className="space-y-1">
                <div className="flex items-center justify-center sm:justify-start">
                  <img src="/images/logo.png" alt="DEPDev Logo" className="w-12 sm:w-14 h-auto object-contain opacity-90" />
                  <img src="/images/rdc1.png" alt="BP Logo" className="w-12 sm:w-14 h-auto object-contain opacity-90" />
                  <img src="/images/bp_logo.png" alt="BP Logo" className="w-12 sm:w-14 h-auto object-contain opacity-90" />
                </div>
                <p className="text-base leading-tight font-semibold text-white">
                  Department of Economy, Planning, and Development
                </p>
                <p className="font-semibold">Regional Office 1</p>
              </div>

              <div className="space-y-1">
                <div>
                  <Building className="w-4 h-4 inline-block mr-2 text-blue-200" />
                  Guerrero Road, City of San Fernando, La Union
                </div>
                <div>
                  <Phone className="w-4 h-4 inline-block mr-2 text-blue-200" />
                  (072) 888-5501, 888-2679, 888-2680
                </div>
                <div>
                  <Mail className="w-4 h-4 inline-block mr-2 text-blue-200" />
                  dro1@depdev.gov.ph
                </div>
              </div>
            </div>
          </div>

          {/* Column 3 */}
          <div className="text-white/80">
            <h3 className="font-semibold text-lg mb-3 text-white">Quick Links</h3>
            <ul className="space-y-1">
              <li>
                <a href="https://www.gov.ph" target="_blank" rel="noopener noreferrer" className="hover:text-white underline">
                  GOV.PH
                </a>
              </li>
              <li>
                <a href="https://data.gov.ph" target="_blank" rel="noopener noreferrer" className="hover:text-white underline">
                  Open Data Portal
                </a>
              </li>
              <li>
                <a href="https://www.foi.gov.ph" target="_blank" rel="noopener noreferrer" className="hover:text-white underline">
                  Freedom of Information
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4 */}
          <div className="text-white/80">
            <h3 className="font-semibold text-lg mb-3 text-white">Follow Us</h3>
            <ul className="space-y-1">
              <li>
                <a href="https://www.facebook.com/DEPDevRegion1" target="_blank" rel="noopener noreferrer" className="hover:text-white underline">
                  DEPDev Regional Office 1
                </a>
              </li>
              <li>
                <a href="https://www.facebook.com/RDCilocos" target="_blank" rel="noopener noreferrer" className="hover:text-white underline">
                  Regional Development Council 1
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="bg-[#002244] text-center text-xs py-3 border-t border-blue-800 text-white/60">
          © {new Date().getFullYear()} DEPDev Regional Office I. All rights reserved. | v1.0.0
        </div>
      </footer>
      <ReportIssueButton />
    </div>
  )
}

export default Home
