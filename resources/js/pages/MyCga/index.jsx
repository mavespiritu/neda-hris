import { useState, useEffect } from 'react'
import { Head } from '@inertiajs/react'
import Breadcrumbs from "@/components/Breadcrumbs"
import CurrentPosition from "@/pages/MyCga/CurrentPosition"
import Designations from "@/pages/MyCga/Designations"
import CareerPath from "@/pages/MyCga/CareerPath"
import AllCompetencies from "@/pages/MyCga/AllCompetencies"
import SelectCareer from "@/pages/MyCga/SelectCareer"
import SelectDesignation from "@/pages/MyCga/SelectDesignation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
  } from "@/Components/ui/card"
import PageTitle from "@/components/PageTitle"

const MyCga = ({emp_id, position_id}) => {
    
    const breadcrumbItems = [
        { label: 'Home', href: '/' },
        { label: 'Competencies' },
        { label: 'My CGA', href: '/my-cga' },
    ]

    const [activeTab, setActiveTab] = useState(() => {
        return localStorage.getItem('activeTab') || 'current-position'
    })

    const [selectedCareer, setSelectedCareer] = useState(null)
    const [selectedDesignation, setSelectedDesignation] = useState(null)
    const [careers, setCareers] = useState([])

    const fetchCareers = async () => {
        try {
            const response = await fetch(`/my-cga/careers`)
            if (!response.ok) {
                toast({
                    title: "Uh oh! Something went wrong.",
                    description: "Network response was not ok",
                })
            }
            const data = await response.json()
          
            setCareers(data)

        } catch (err) {
            toast({
                title: "Uh oh! Something went wrong.",
                description: "There was a problem with your request",
            })
        }
    }
    
    useEffect(() => {
        localStorage.setItem('activeTab', activeTab)
        setSelectedCareer(null)
        setSelectedDesignation(null)
    }, [activeTab])

    return (
        <div className="grid grid-rows-[auto,1fr] h-full flex-grow overflow-hidden">
            <PageTitle pageTitle="My CGA" breadcrumbItems={breadcrumbItems} />
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-grow grid grid-rows-[auto,1fr] h-full">
                <TabsList className="w-full justify-start gap-4">
                    <TabsTrigger value="current-position">Current Position</TabsTrigger>
                    <TabsTrigger value="designations">Designations</TabsTrigger>
                    <TabsTrigger value="career-path">Career Path</TabsTrigger>
                    <TabsTrigger value="all-competencies">All Competencies</TabsTrigger>
                </TabsList>
                <TabsContent value="current-position">
                    <Card className="w-full h-full grid grid-rows-[1fr]">
                        <CardContent className="flex-grow py-4">
                        { activeTab === 'current-position' && <CurrentPosition emp_id={emp_id} position_id={position_id} /> }
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="designations">
                    <Card className="w-full h-full flex-grow grid grid-rows-[auto,1fr]">
                        <CardHeader className="border-b p-2">
                            <SelectDesignation setSelectedDesignation={setSelectedDesignation} className=" w-auto" />
                        </CardHeader>
                        <CardContent className="flex-grow py-4">
                        { activeTab === 'designations' && <Designations selectedDesignation={selectedDesignation} emp_id={emp_id} /> }
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="career-path">
                    <Card className="w-full h-full flex-grow grid grid-rows-[auto,1fr]">
                        <CardHeader className="border-b p-2">
                            <SelectCareer selectedCareer={selectedCareer} setSelectedCareer={setSelectedCareer} careers={careers} fetchCareers={fetchCareers} className=" w-auto" />
                        </CardHeader>
                        <CardContent className="grow-0 py-4">
                        { activeTab === 'career-path' && <CareerPath selectedCareer={selectedCareer} setSelectedCareer={setSelectedCareer} fetchCareers={fetchCareers} emp_id={emp_id} /> }
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="all-competencies">
                    <Card className="w-full h-full grid grid-rows-[1fr]">
                        <CardContent className="flex-grow py-4">
                        { activeTab === 'all-competencies' && <AllCompetencies emp_id={emp_id} /> }
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}

export default MyCga
