
import PageTitle from "@/components/PageTitle"
import SingleComboBox from "@/components/SingleComboBox"
import { useState, useEffect, useCallback, useMemo } from "react"
import { Label } from "@/components/ui/label"
import Menu from "@/pages/MyCga/Menu"
import { useTextSize } from "@/providers/TextSizeProvider"
import { useToast } from "@/hooks/use-toast"
import { useHasPermission } from '@/hooks/useAuth'

const StaffCga = () => {

    const canViewPage = useHasPermission('HRIS_staff-cga.view-cga')

    if (!canViewPage) {
        return <p className="font-semibold flex justify-center items-center h-full">You do not have permission to view this page.</p>
    }

    const textSize = useTextSize()
    const { toast } = useToast()

    const breadcrumbItems = [
        { label: 'Home', href: '/' },
        { label: 'Competencies' },
        { label: 'Staff CGA', href: '/staff-cga' },
    ]

    const [selectedStaff, setSelectedStaff] = useState(null)
    const [selectedPosition, setSelectedPosition] = useState(null)
    const [employees, setEmployees] = useState([])

    const [activeStaff, setActiveStaff] = useState(() => {
        return localStorage.getItem('HRIS_activeStaff') || null
    })

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

    const fetchPosition = async () => {
        try {
            const response = await fetch(`/employees/current-position/${activeStaff}`)
            if (!response.ok) {
                toast({
                    title: "Uh oh! Something went wrong.",
                    description: "Network response was not ok",
                    variant: "destructive"
                })
            }
            const data = await response.json()

            console.log(data)
          
            setSelectedPosition(data)

        } catch (err) {
            toast({
                title: "Uh oh! Something went wrong.",
                description: "There was a problem with your request",
                variant: "destructive"
            })
        }
    }

    const handleChange = useCallback((value) => {
        setSelectedStaff(value)
        fetchPosition(value)
       localStorage.setItem('HRIS_activeStaff', value)
    }, [])

    useEffect(() => {
        fetchEmployees()
        if (activeStaff) {
            localStorage.setItem('HRIS_activeStaff', activeStaff)
            setSelectedStaff(activeStaff)
            fetchPosition(activeStaff)
        }
    }, [activeStaff])

    return (
        <div className="h-screen grid grid-rows-[auto,1fr] flex-1">
            <PageTitle pageTitle="Staff CGA" breadcrumbItems={breadcrumbItems} />
            <div className="grid grid-rows-[auto,1fr] gap-4 flex-1">
                <div className="w-full lg:w-1/4">
                    <Label className={textSize}>Select Staff:</Label>
                    <SingleComboBox 
                        items={employees} 
                        onChange={(handleChange)}
                        placeholder="Select staff"
                        name="staff"
                        id="staff"
                        width="w-[300px]"
                        value={activeStaff}
                    />
                </div>
                {selectedStaff && <Menu emp_id={selectedStaff} position_id={selectedPosition} />}
            </div>
        </div>
    )
}

export default StaffCga