import { useState, useEffect } from 'react'
import { Head } from '@inertiajs/react'
import Breadcrumbs from "@/components/Breadcrumbs"
import CurrentPosition from "@/pages/MyCga/CurrentPosition"
import Designations from "@/pages/MyCga/Designations"
import CareerPath from "@/pages/MyCga/CareerPath"
import AllCompetencies from "@/pages/MyCga/AllCompetencies"
import History from "@/pages/MyCga/History"
import SelectCareer from "@/pages/MyCga/SelectCareer"
import SelectDesignation from "@/pages/MyCga/SelectDesignation"
import SelectHistory from "@/pages/MyCga/SelectHistory"
import Trainings from "@/pages/MyCga/Trainings"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card"
import PageTitle from "@/components/PageTitle"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
  import { useForm, Link } from '@inertiajs/react'
  import { Loader2, Send } from "lucide-react"
  import { 
    sendEmailForCgaSubmission,
} from '@/pages/MyCga/api'
import { useHasRole } from '@/hooks/useAuth'

const Menu = ({emp_id, position_id}) => {

    const { toast } = useToast()

    const canSubmitCompetency = useHasRole('HRIS_HR')

    const { data, setData, post, processing } =  useForm({
        emp_id: emp_id,
    })

    const [activeTab, setActiveTab] = useState(() => {
        return localStorage.getItem('HRIS_MyCGA_activeTab') || 'current-position'
    })

    const [selectedCareer, setSelectedCareer] = useState(null)
    const [currentPosition, setCurrentPosition] = useState(null)
    const [selectedDesignation, setSelectedDesignation] = useState(null)
    //const [selectedHistory, setSelectedHistory] = useState(null)
    const [careers, setCareers] = useState([])
    const [designations, setDesignations] = useState([])
    const [histories, setHistories] = useState([])
    const [isSaveUpdateOpen, setIsSaveUpdateOpen] = useState(false)
    const [summary, setSummary] = useState([])
    const [isSummaryLoading, setIsSummaryLoading] = useState(true)

    const fetchCareers = async () => {
        try {
            const response = await fetch(`/my-cga/careers/${emp_id}`)
            if (!response.ok) {
                toast({
                    title: "Uh oh! Something went wrong.",
                    description: "Network response was not ok",
                    variant: "destructive"
                })
            }
            const data = await response.json()
          
            setCareers(data)

        } catch (err) {
            toast({
                title: "Uh oh! Something went wrong.",
                description: "There was a problem with your request",
                variant: "destructive"
            })
        }
    }

    const fetchDesignations = async () => {
        try {
            const response = await fetch(`/my-cga/designations/${emp_id}`)
            if (!response.ok) {
                toast({
                    title: "Uh oh! Something went wrong.",
                    description: "Network response was not ok",
                    variant: "destructive"
                })
            }
            const data = await response.json()
          
            setDesignations(data)

        } catch (err) {
            toast({
                title: "Uh oh! Something went wrong.",
                description: "There was a problem with your request",
                variant: "destructive"
            })
        }
    }

    const fetchHistories = async () => {
        try {
            const response = await fetch(`/my-cga/histories/${emp_id}`)
            if (!response.ok) {
                toast({
                    title: "Uh oh! Something went wrong.",
                    description: "Network response was not ok",
                    variant: "destructive"
                })
            }
            const data = await response.json()
          
            setHistories(data.data)

        } catch (err) {
            toast({
                title: "Uh oh! Something went wrong.",
                description: "There was a problem with your request",
                variant: "destructive"
            })
        }
    }

    const fetchPosition = async () => {
        try {
            const response = await fetch(`/employees/current-position/${emp_id}`)
            if (!response.ok) {
                toast({
                    title: "Uh oh! Something went wrong.",
                    description: "Network response was not ok",
                    variant: "destructive"
                })
            }
            const data = await response.json()
          
            setCurrentPosition(data)

        } catch (err) {
            toast({
                title: "Uh oh! Something went wrong.",
                description: "There was a problem with your request",
                variant: "destructive"
            })
        }
    }

    const fetchSummary = async () => {   
        try {
            const response = await fetch(`/my-cga/history-summary/${emp_id}`)

            if (!response.ok) {
                toast({
                    title: "Uh oh! Something went wrong.",
                    description: "Network response was not ok",
                    variant: "destructive"
                })
                return
            }
            
            const data = await response.json()
            
            // Transform the data to group by competency, then dateCreated within each competency
            const groupedData = data.reduce((acc, item) => {
                // Check if this competency already exists in the accumulator
                if (!acc[item.competency]) {
                    acc[item.competency] = {
                        competency: item.competency,
                        proficiency: item.proficiency,
                        id: item.id,
                        dates: []
                    }
                }
    
                // Add the date and percentage for this competency
                acc[item.competency].dates.push({
                    dateCreated: item.dateCreated,
                    percentage: item.percentage,
                })
    
                return acc
            }, {})
    
            // Convert the object back to an array for easier handling
            const formattedData = Object.values(groupedData).sort((a, b) =>
                a.competency.localeCompare(b.competency)
            )
    
            setSummary(formattedData)
    
        } catch (err) {
            toast({
                title: "Uh oh! Something went wrong.",
                description: "There was a problem with your request",
                variant: "destructive"
            })
            console.log(err)
        } finally {
            setIsSummaryLoading(false)
        }
    }
    
    useEffect(() => {
        localStorage.setItem('HRIS_MyCGA_activeTab', activeTab)
        setSelectedCareer(null)
        setSelectedDesignation(null)
        //setSelectedHistory(null)
    }, [activeTab])

    useEffect(() => {
        fetchDesignations()
        fetchCareers()
        fetchPosition()
        fetchHistories()
        if (activeTab === 'history') {
            fetchSummary()
        }
        setData((prev) => ({
            ...prev,
            emp_id,
        }))
    }, [emp_id, activeTab])

    const handleSaveUpdates = async (e) => {
        e.preventDefault()

        post(`/my-cga/history/`, {
            preserveState: true,
            onSuccess: () => {
                setIsSaveUpdateOpen(false)
                fetchHistories()
                fetchSummary()
                
                toast({
                    title: "Success!",
                    description: "The updates have been saved successfully. You can now view it on history tab."
                })

                sendEmailNotification()
            },
            onError: (err) => {
                console.log(err)
            }
        })
    }

    const sendEmailNotification = async () => {
        try {
            const response = await sendEmailForCgaSubmission({emp_id: emp_id})
    
            if (response.status !== 200) {
                throw new Error("Failed to send email notification.");
            }
    
        } catch (err) {
            console.error(err)
            toast({
                title: "Error",
                description: "Failed to send email notification.",
                variant: "destructive",
            })
        }
    }

    return (
        <div className="grid grid-rows-[1fr] flex-1">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-grow grid grid-rows-[auto,1fr] h-screen">
                <TabsList className="w-full justify-start gap-4">
                    <TabsTrigger value="current-position">Current Position</TabsTrigger>
                    <TabsTrigger value="designations" className="flex gap-2">Designations {designations.length > 0 && <Badge className="rounded-lg">{designations.length}</Badge>}</TabsTrigger>
                    <TabsTrigger value="career-path" className="flex gap-2">Career Path {careers.length > 0 && <Badge className="rounded-lg">{careers.length}</Badge>}</TabsTrigger>
                    <TabsTrigger value="all-competencies">All Competencies</TabsTrigger>
                    <TabsTrigger value="trainings">Proposed Trainings</TabsTrigger>
                    <TabsTrigger value="history" className="flex gap-2">Submissions {histories.length > 0 && <Badge className="rounded-lg">{histories.length}</Badge>}</TabsTrigger>
                </TabsList>
                <TabsContent value="current-position">
                    <Card className={`w-full h-full flex-grow grid ${canSubmitCompetency ? 'grid-rows-[auto,1fr]' : 'grid-rows-[1fr]'}`}>
                        {canSubmitCompetency && (
                            <CardHeader className="border-b p-2">
                                <div className="w-auto flex justify-start gap-2 items-center">
                                <AlertDialog open={isSaveUpdateOpen} onOpenChange={setIsSaveUpdateOpen}>
                                    <AlertDialogTrigger asChild>
                                        <Button size="sm" className="flex gap-2">
                                            <Send className="size-4"/>
                                            Submit for Review 
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Submic Competencies for Review</AlertDialogTitle>
                                            <AlertDialogDescription>
                                            You are submitting updates on your competencies. Once submitted, an email notification will be sent to your supervisor requesting a review of your submitted competency.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel className="border-0">Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleSaveUpdates} disabled={processing}>
                                                {processing ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        <span>Please wait</span>
                                                    </>
                                                ) : 'Proceed'}
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                                </div>
                            </CardHeader>
                        )}
                        <CardContent className="flex-grow p-4">
                        { activeTab === 'current-position' && <CurrentPosition emp_id={emp_id} position_id={currentPosition} /> }
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="designations">
                    <Card className="w-full h-full flex-grow grid grid-rows-[auto,1fr]">
                        <CardHeader className="border-b p-2">
                            <SelectDesignation selectedDesignation={selectedDesignation} setSelectedDesignation={setSelectedDesignation} designations={designations} fetchDesignations={fetchDesignations} className="w-auto" />
                        </CardHeader>
                        <CardContent className="flex-grow p-4">
                        { activeTab === 'designations' && <Designations selectedDesignation={selectedDesignation} emp_id={emp_id} /> }
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="career-path">
                    <Card className="w-full h-full flex-grow grid grid-rows-[auto,1fr]">
                        <CardHeader className="border-b p-2">
                            <SelectCareer emp_id={emp_id} selectedCareer={selectedCareer} setSelectedCareer={setSelectedCareer} careers={careers} fetchCareers={fetchCareers} className="w-auto" />
                        </CardHeader>
                        <CardContent className="grow-0 p-4">
                        { activeTab === 'career-path' && <CareerPath selectedCareer={selectedCareer} setSelectedCareer={setSelectedCareer} fetchCareers={fetchCareers} emp_id={emp_id} /> }
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="all-competencies">
                    <Card className="w-full h-full grid grid-rows-[1fr]">
                        <CardContent className="flex-grow p-4">
                        { activeTab === 'all-competencies' && <AllCompetencies emp_id={emp_id} /> }
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="trainings">
                    <Card className="w-full h-full">
                        <CardContent className="flex-grow p-4 h-full">
                        { activeTab === 'trainings' && <Trainings emp_id={emp_id} position_id={position_id} /> }
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="history">
                    <Card className="w-full h-full">
                        <CardContent className="flex-grow p-4 h-full">
                        { activeTab === 'history' && <History emp_id={emp_id} summary={summary} isSummaryLoading={isSummaryLoading} histories={histories} /> }
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}

export default Menu
