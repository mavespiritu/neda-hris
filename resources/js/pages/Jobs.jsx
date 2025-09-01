import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Briefcase, MapPin, Search, Building2, PhilippinePeso, Wallet, ChevronLeft, ChevronRight, Calendar, Scroll, Filter, X } from 'lucide-react'

const Jobs = () => {
  return (
    <div className="min-h-screen flex flex-col py-8 px-64 bg-gray-50">
      <h2 className="text-3xl font-bold mb-8">Search Jobs at NEDA RO1</h2>
      <div className="flex gap-4 mb-4">
        <Input placeholder="Job title or keyword" className="flex-grow" />
        <Button variant="outline">
          <Filter className="mr-2 h-4 w-4" />
          <span className="hidden md:block">Filter Results</span>
        </Button>
        <Button><Search className="mr-2 h-4 w-4" /> Search</Button>
      </div>
      <div className="flex flex-wrap items-center gap-2 mb-8">
        <Badge variant="outline" className="h-6 flex">
          <span>Permanent</span>
          <X className="ml-2 h-4 w-4" />
        </Badge>
        <Badge variant="outline" className="h-6 flex">
          <span>Policy Formulation and Planning Division</span>
          <X className="ml-2 h-4 w-4" />
        </Badge>
        <Badge variant="outline" className="h-6 flex">
          <span>Salary Grade 16</span>
          <X className="ml-2 h-4 w-4" />
        </Badge>
        <Badge variant="outline" className="h-6 flex">
          <span>Supervising Economic and Development Specialist</span>
          <X className="ml-2 h-4 w-4" />
        </Badge>
        <Badge variant="outline" className="h-6 flex">
          <span>Policy Formulation and Planning Division</span>
          <X className="ml-2 h-4 w-4" />
        </Badge>
        <Badge variant="outline" className="h-6 flex">
          <span>Policy Formulation and Planning Division</span>
          <X className="ml-2 h-4 w-4" />
        </Badge>
        <Badge variant="outline" className="h-6 flex">
          <span>Policy Formulation and Planning Division</span>
          <X className="ml-2 h-4 w-4" />
        </Badge>
      </div>
      <div>
        <div className="flex items-center justify-between gap-8 mb-4">
          <h2 className="text-2xl font-bold">All Jobs (7)</h2>
          <div>
            <span className="text-sm font-semibold">SORT BY: MOST RECENT | MONTHLY RATE</span>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6, 7].map((job) => (
              <Card key={job}>
                <CardHeader className="border-t-4 rounded">
                    <CardTitle className="leading-tight">Supervising Economic Development Specialist</CardTitle>
                    <CardDescription>Policy Formulation and Planning Division</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="flex items-center text-sm text-gray-500 mb-2">
                    <Scroll className="mr-2 h-4 w-4" /> Plantilla Item No: <span className="ml-2 font-semibold">ODGB-SREDS-167-1998</span>
                    </p>
                    <p className="flex items-center text-sm text-gray-500 mb-2">
                    <Briefcase className="mr-2 h-4 w-4" /> Appointment Status: <span className="ml-2 font-semibold">Permanent</span>
                    </p>
                    <p className="flex items-center text-sm text-gray-500 mb-2">
                    <Wallet className="mr-2 h-4 w-4" /> Salary Grade: <span className="ml-2 font-semibold">16</span>
                    </p>
                    <p className="flex items-center text-sm text-gray-500 mb-2">
                    <PhilippinePeso className="mr-2 h-4 w-4" /> Monthly Rate: <span className="ml-2 font-semibold">P43,720.00</span>
                    </p>
                    <p className="flex items-center text-sm text-gray-500 mb-2">
                    <Calendar className="mr-2 h-4 w-4" /> Deadline of Submission: <span className="ml-2 font-semibold">January 20, 2025</span>
                    </p>
                    <p className="flex items-center text-sm text-gray-500 italic">Posted 1 day ago</p>
                </CardContent>
                <CardFooter>
                    <Button className="w-full">View Job Details</Button>
                </CardFooter>
              </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Jobs