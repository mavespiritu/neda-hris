
import PageTitle from "@/components/PageTitle"
import MultipleComboBox from "@/components/MultipleComboBox"
import { useState, useEffect, useCallback } from "react"
import { Label } from "@/components/ui/label"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card"
import Comparison from "@/pages/CompareCga/Comparison"
import { useToast } from "@/hooks/use-toast"
import { useHasPermission } from '@/hooks/useAuth'

const CompareCga = () => {

    const canViewPage = useHasPermission('HRIS_my-cga.compare-competencies')

    if (!canViewPage) {
        return <p className="font-semibold flex justify-center items-center h-full">You do not have permission to view this page.</p>
    }

    const breadcrumbItems = [
        { label: 'Home', href: '/' },
        { label: 'Competencies' },
        { label: 'Compare CGA', href: '/compare-cga' },
    ]

    const { toast } = useToast()

    const [selectedStaffs, setSelectedStaffs] = useState([])
    const [employees, setEmployees] = useState([])
    const [comparison, setComparison] = useState([])
    const [isComparisonLoading, setIsComparisonLoading] = useState(true)

    const fetchEmployees = async () => {
        try {
            const response = await fetch(`/employees/filtered-employees?emp_type_id=Permanent`)
            if (!response.ok) {
                toast({
                    title: "Uh oh! Something went wrong.",
                    description: "Network response was not ok",
                })
            }
            const data = await response.json()
          
            setEmployees(data)

        } catch (err) {
            toast({
                title: "Uh oh! Something went wrong.",
                description: "There was a problem with your request",
            })
        }
    }

    const fetchComparison = async () => {   
        try {
            const response = await fetch(`/compare-cga/compare?staffs=${encodeURIComponent(selectedStaffs.join(','))}`)
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
                        id: item.id,
                        staffs: []
                    }
                }
    
                // Add the date and percentage for this competency
                acc[item.competency].staffs.push({
                    emp_id: item.emp_id,
                    percentage: item.percentage,
                })
    
                return acc
            }, {})
            
    
            // Convert the object back to an array for easier handling
            const formattedData = Object.values(groupedData).sort((a, b) =>
                a.competency.localeCompare(b.competency)
            )
    
            setComparison(formattedData)
    
        } catch (err) {
            toast({
                title: "Uh oh! Something went wrong.",
                description: "There was a problem with your request",
            })
            console.log(err)
        } finally {
            setIsComparisonLoading(false)
        }
    }

    const handleStaffsChange = useCallback((value) => {
       setSelectedStaffs(value)
    }, [])

    useEffect(() => {
        fetchEmployees()
    }, [])

    useEffect(() => {
        fetchComparison()
    }, [selectedStaffs])

    return (
        <div className="h-screen grid grid-rows-[auto,1fr] flex-1">
            <PageTitle pageTitle="Compare CGA" breadcrumbItems={breadcrumbItems} />
            <Card className="w-full h-full grid grid-rows-[auto,1fr]">
                <CardHeader className="border-b p-2">
                    <div className="w-full lg:w-1/4">
                        <MultipleComboBox 
                            items={employees} 
                            onChange={handleStaffsChange}
                            placeholder="Select employee"
                            name="employee"
                            id="employee"
                            width="w-[400px]"
                            value={selectedStaffs}
                        />
                    </div>
                </CardHeader>
                <CardContent className="flex-grow p-4">
                    {comparison && <Comparison comparison={comparison} isComparisonLoading={isComparisonLoading} employees={employees} selectedStaffs={selectedStaffs} />}
                </CardContent>
            </Card>
        </div>
    )
}

export default CompareCga