import PageTitle from "@/components/PageTitle"
import { usePage } from '@inertiajs/react'
import { useState, useEffect } from 'react'
import Menu from "@/pages/MyCga/Menu"
import { useHasRole } from '@/hooks/useAuth'
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
import { Button } from "@/components/ui/button"
import { useForm, Link } from '@inertiajs/react'
import { Loader2, Send } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { 
    sendEmailForCgaSubmission,
} from '@/pages/MyCga/api'

const MyCga = () => {

    const canViewPage = useHasRole('HRIS_Staff')

    if (!canViewPage) {
        return <p className="font-semibold flex justify-center items-center h-full">You do not have permission to view this page.</p>
    }

    const { toast } = useToast()

    const { emp_id, position_id } = usePage().props

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

    const breadcrumbItems = [
        { label: 'Home', href: '/' },
        { label: 'Competencies' },
        { label: 'My CGA', href: '/my-cga' },
    ]

    const { data, setData, post, processing } =  useForm({
        emp_id: emp_id,
    })

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

    const handleSaveUpdates = async (e) => {
        e.preventDefault()

        post(`/my-cga/history`, {
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
        <div className="min-h-screen flex flex-col gap-4">
            <PageTitle pageTitle="My CGA" breadcrumbItems={breadcrumbItems} />
            <div className="flex justify-between">
            <span className="text-xs font-semibold">Note: <br/> If you submit this for review, you are subjecting the updates in competencies and proposed trainings for review of your supervisor.</span>
            <AlertDialog open={isSaveUpdateOpen} onOpenChange={setIsSaveUpdateOpen}>
                <AlertDialogTrigger asChild>
                    <Button size="sm" className="flex gap-2 w-fit">
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
            <Menu emp_id={emp_id} position_id={position_id}/>
        </div>
    )
}

export default MyCga
