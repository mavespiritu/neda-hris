import { Button } from "@/components/ui/button"
import AuthenticatedLayout from "../layouts/AuthenticatedLayout"
import { Head, Link } from '@inertiajs/react'
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Briefcase, MapPin, Search, Building2, PhilippinePeso, Wallet, ChevronLeft, ChevronRight, Calendar, Scroll, Filter } from 'lucide-react'
import { TypewriterEffect } from "@/components/TypewriterEffect"

const Home = () => {

    const words = [
        {
          text: "Be",
          className: "dark:text-white",
        },
        {
          text: "a",
          className: "dark:text-white",
        },
        {
          text: "development",
          className: "dark:text-white",
        },
        {
          text: "catalyst.",
          className: "dark:text-white",
        },
      ]

    return (
        <div>
            <Head title="NEDA RO1 HRIS" />
            <section className="h-[320px] px-64 flex bg-[#EFF6FF] justify-center items-center border-b">
                <div className="flex flex-col items-center gap-2">
                    <TypewriterEffect words={words} />
                    <span className="text-lg font-medium mb-8">Discover opportunities to contribute to sustainable development and economic progress.</span>
                    <div className="flex mx-auto">
                        <Input placeholder="Job title or keyword" className="rounded-r-none w-[600px]" />
                        <Button className="rounded-l-none"><Search className="mr-2 h-4 w-4" /> Search Jobs</Button>
                        </div>
                </div>
            </section>
            <section className="px-64 py-8">
                <div className="container mx-auto px-4">
                    <h2 className="text-3xl font-bold mb-8">Latest Jobs</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((job) => (
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
                                <p className="flex items-center text-sm text-gray-500">
                                <Calendar className="mr-2 h-4 w-4" /> Deadline of Submission: <span className="ml-2 font-semibold">January 20, 2025</span>
                                </p>
                            </CardContent>
                            <CardFooter>
                                <Button className="w-full">View Job Details</Button>
                            </CardFooter>
                        </Card>
                    ))}
                    </div>
                </div>
            </section>
        </div>
    )
}

export default Home
