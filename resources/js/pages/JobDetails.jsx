import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Briefcase, MapPin, Search, Building2, PhilippinePeso, Wallet, ChevronLeft, ChevronRight, Calendar, Scroll, Filter, X } from 'lucide-react'
import { Link } from '@inertiajs/react'

const JobDetails = () => {
  return (
    <div className="min-h-screen flex flex-col px-64 bg-gray-50">
      <div className="flex justify-between items-center">
        <div>
            <div className="flex items-center gap-4 text-sm mb-6 pt-8">
                <span className="font-bold">Previous Job Search</span>
                <span className="border-r-2 h-4 border-gray-300"></span>
                <Link href="/jobs" className="font-bold">New Job Search</Link>
            </div>
            <h2 className="text-4xl font-bold mb-4">Supervising Economic Development Specialist</h2>
            <div className="flex items-center gap-4 text-sm mb-6">
                <span className="font-bold">PERMANENT</span>
                <span className="border-r-2 h-4 border-gray-300"></span>
                <span className="font-bold">PLANTILLA ITEM NO.: ODGB-SREDS-167-1998</span>
                <span className="border-r-2 h-4 border-gray-300"></span>
                <span className="font-bold">SALARY GRADE 19-1</span>
            </div>
            <div className="flex items-center text-lg gap-4 mb-8">
                <Button className="px-8 py-6 font-bold text-lg">APPLY NOW</Button>
                <p className="font-medium">Deadline of submission is <span className="font-bold underline">January 25, 2025</span></p>
            </div>
        </div>
        <img src="/images/logo.png" alt="NEDA Logo" className="h-[300px] w-auto mr-16 p-4" />
      </div>
        <div className="flex gap-4 items-start">
            <Card className="w-[65%] p-4 mb-8">
                <CardHeader>
                    <CardTitle className="leading-tight">Qualification Standards</CardTitle>
                </CardHeader>
                <CardContent className="border-t pt-4">
                    <div className="flex flex-col gap-8">
                        <div className="flex flex-col gap-4">
                            <div className="flex gap-16">
                                <span className="w-1/4 font-medium">Position</span>
                                <span className="flex-1 font-bold">Supervising Economic Development Specialist</span>
                            </div>
                            <div className="flex gap-16">
                                <span className="w-1/4 font-medium">Plantilla Item Number</span>
                                <span className="flex-1">ODGB-SREDS-167-1998</span>
                            </div>
                            <div className="flex gap-16">
                                <span className="w-1/4 font-medium">Salary Grade</span>
                                <span className="flex-1">19-1</span>
                            </div>
                            <div className="flex gap-16">
                                <span className="w-1/4 font-medium">Monthly Salary</span>
                                <span className="flex-1">P43,720.00</span>
                            </div>
                            <div className="flex gap-16">
                                <span className="w-1/4 font-medium">Eligibility</span>
                                <span className="flex-1">Career Service (Professional) Second Level Eligibility</span>
                            </div>
                            <div className="flex gap-16">
                                <span className="w-1/4 font-medium">Division/Unit</span>
                                <span className="flex-1">Policy Formulation and Planning Division (PFPD)</span>
                            </div>
                            <div className="flex gap-16">
                                <span className="w-1/4 font-medium">Education</span>
                                <span className="flex-1">Bachelor's degree in Economics, Public Policy, Public Administration, Development Administration, Sociology, Anthropology, Rural Development, Development Management, Environmental Planning, City and Regional Planning or its equivalent, Management Engineering, Industrial Engineering, Civil Engineering, Geodetic Engineering, Environmental Science, and other related courses</span>
                            </div>
                            <div className="flex gap-16">
                                <span className="w-1/4 font-medium">Experience</span>
                                <span className="flex-1">Two years of relevant experience in Economics, Development and Physical Planning, Disaster Risk Reduction and Management, Infrastructure or Social Sector Planning, Social Welfare, Teaching and Education, Research and Policy Analysis and Formulation</span>
                            </div>
                            <div className="flex gap-16">
                                <span className="w-1/4 font-medium">Training</span>
                                <span className="flex-1">At least eight hours of relevant training in Policy Review, Analysis and Formulation, Time-series Analysis and Forecasting, Sectoral, Urban, Land Use or Physical Planning, Infrastructure Sector Development, Social Sector and Development, Disaster Risk Reduction and Management, Data Science, and other related topics</span>
                            </div>
                            <div className="flex gap-16">
                                <span className="w-1/4 font-medium">NEDA Examination</span>
                                <span className="flex-1">NEDA Pre-Employment Exam Passer (Technical)</span>
                            </div>
                        </div>
                        <h1 className="text-2xl font-semibold tracking-tight leading-tight border-b pb-4">Competency Requirements</h1>
                        <div className="flex flex-col gap-4">
                            <div className="flex gap-16">
                                <span className="w-1/4 font-medium">Organizational</span>
                                <div className="flex-1">
                                    <div className="flex flex-col gap-2">
                                        <p>Socio-Economic Development Planning Advocacy (Level 2)</p>
                                        <p>Delivering Excellent Results (Level 2)</p>
                                        <p>Collaborating and Promotion Inclusion (Level 2)</p>
                                        <p>Engaging Stakeholders (Level 2)</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-16">
                                <span className="w-1/4 font-medium">Technical/Functional</span>
                                <div className="flex-1">
                                    <div className="flex flex-col gap-2">
                                        <p className="flex items-center">
                                            <span className="h-1.5 w-1.5 bg-black rounded-full mr-2"></span>
                                            Business Writing (Level 2)
                                        </p>
                                        <p>Technical Writing (Level 2)</p>
                                        <p>Computer Skills (Level 3)</p>
                                        <p>Forecasting and Modeling (Level 2)</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
            <div className="flex-1 flex flex-col gap-4">
                <Card className="p-4">
                    <CardHeader>
                        <CardTitle className="leading-tight">Application Requirements</CardTitle>
                    </CardHeader>
                    <CardContent className="border-t pt-4">
                        <div className="flex flex-col gap-2">
                            <p>1. Fully accomplished Personal Data Sheet (PDS) with recent passport-sized picture (CS Form No. 212, Revised 2017) which can be downloaded at www.csc.gov.ph</p>
                            <p>2. Performance rating in the last two rating periods (if applicable)</p>
                            <p>3. Photocopy of certificate of eligibility/rating/license</p>
                            <p>4. Photocopy of Transcript of Records and/or Diploma (if applicable)</p>
                            <p>5. Photocopy of Certificate of Employment or Service Records</p>
                            <p>6. Photocopy of Certificate of Trainings or seminars attended</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="p-4">
                    <CardHeader>
                        <CardTitle className="leading-tight">Reminders</CardTitle>
                    </CardHeader>
                    <CardContent className="border-t pt-4">
                        <div className="flex flex-col gap-2">
                            <p>1. Fully accomplished Personal Data Sheet (PDS) with recent passport-sized picture (CS Form No. 212, Revised 2017) which can be downloaded at www.csc.gov.ph</p>
                            <p>2. Performance rating in the last two rating periods (if applicable)</p>
                            <p>3. Photocopy of certificate of eligibility/rating/license</p>
                            <p>4. Photocopy of Transcript of Records and/or Diploma (if applicable)</p>
                            <p>5. Photocopy of Certificate of Employment or Service Records</p>
                            <p>6. Photocopy of Certificate of Trainings or seminars attended</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
  )
}

export default JobDetails