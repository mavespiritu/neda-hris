import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import Evidences from "@/pages/ReviewCga/Evidences"
import Competencies from "@/pages/ReviewCga/Competencies"

const Menu = () => {

    const { toast } = useToast()

    const [activeTab, setActiveTab] = useState(() => {
        return localStorage.getItem('HRIS_ReviewCGA_activeTab') || 'competencies'
    })

    const [employees, setEmployees] = useState([])

    const fetchActiveEmployees = async () => {
        try {
            const response = await fetch(`/employees/filtered-employees?emp_type_id=Permanent`)
            if (!response.ok) {
                toast({
                    title: "Uh oh! Something went wrong.",
                    description: "Network response was not ok",
                    variant: "destructive"
                })
            }
            const data = await response.json()
          
            setEmployees(data)

        } catch (err) {
            toast({
                title: "Uh oh! Something went wrong.",
                description: "There was a problem with your request",
                variant: "destructive"
            })
        }
    }


    useEffect(() => {
        localStorage.setItem('HRIS_ReviewCGA_activeTab', activeTab)
    }, [activeTab])

    useEffect(() => {
        fetchActiveEmployees()
    }, [])

    return (
        <div className="grid grid-rows-[1fr] h-full flex-grow overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-grow grid grid-rows-[auto,1fr] h-full">
                <TabsList className="w-full justify-start gap-4">
                    <TabsTrigger value="competencies" className="flex gap-2">Competencies</TabsTrigger>
                    <TabsTrigger value="evidences" className="flex gap-2">Evidences </TabsTrigger>
                </TabsList>
                <TabsContent value="competencies">
                    <Card className="w-full h-full flex-grow grid grid-rows-[1fr]">
                        <CardContent className="grow-0 py-4">
                        {activeTab === 'competencies' && <Competencies employees={employees}/>}
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="evidences">
                    <Card className="w-full h-full flex-grow grid grid-rows-[1fr]">
                        <CardContent className="grow-0 py-4">
                        {activeTab === 'evidences' && <Evidences employees={employees}/>}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}

export default Menu
