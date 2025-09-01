import PageTitle from "@/components/PageTitle"
import { useState } from 'react'
import { useHasRole } from '@/hooks/useAuth'
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Link } from '@inertiajs/react'
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
  } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
  } from "@/components/ui/collapsible"

const Dashboard = () => {

  /* const canViewPage = useHasRole(['HRIS_HR', 'HRIS_Administrator'])

  if (!canViewPage) {
    return <p className="font-semibold flex justify-center items-center h-full">You do not have permission to view this page.</p>
  } */

  const breadcrumbItems = [
    { label: 'Dashboard', href: '/' },
  ]


  return (
    <div className="flex flex-col gap-4 px-36 pt-8">
      <PageTitle pageTitle="Dashboard" description="Welcome to the NEDA RO1 Human Resource Information System (HRIS)" />
      <Tabs defaultValue="account" className="w-full">
      <TabsList className="grid w-full grid-cols-12">
        <TabsTrigger value="home" className="inline-block">Home</TabsTrigger>
        <TabsTrigger value="password" className="inline-block">My Profile</TabsTrigger>
      </TabsList>
      <TabsContent value="home">
        <div className="flex gap-8">
            <div className="flex-[7] md:w-full">
                <Card>
                    <CardHeader>
                        <CardTitle className="leading-tight text-lg">My Applications</CardTitle>
                    </CardHeader>
                    <CardContent className="h-full">
                        <div className="flex gap-6 border-b pb-2 text-sm">
                            <span>Active (0)</span>    
                            <span>Inactive (6)</span>    
                        </div>
                        <div className="flex flex-col justify-center items-center">
                            <img src="/images/no_applications.svg" alt="No Applications" className="h-[200px] max-h-[50%] w-auto p-4 object-contain" />
                            <span className="font-medium">You have no applications.</span>
                        </div>
                    </CardContent>
                    <CardFooter>
                        
                    </CardFooter>
                </Card>
            </div>
            <div className="flex-[3] hidden md:block">
                <Card>
                    <CardHeader>
                        <CardTitle className="leading-tight text-lg">Welcome to NEDA RO1 HRIS!</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="mb-8">Thanks for exploring NEDA RO1 career opportunities!</p>
                        <p className="mb-8">This is your personal candidate home page. From here, you can track the progress of your application, see next steps in the process and keep your contact details and account settings up to date. </p>
                        <h1 className="text-lg font-semibold">About Us</h1>
                        <div className="flex justify-center">
                            <img src="/images/logo.png" alt="NEDA Logo" className="h-[300px] max-h-[50%] w-auto p-4 object-contain" />
                        </div>
                        <h1 className="text-normal font-semibold mb-4">Vision</h1>
                        <p className="mb-8">We are recognized as the leading gender-responsive development catalyst in Region 1 with the grace of the Divine Providence. </p>
                        <h1 className="text-normal font-semibold mb-4">Mission</h1>
                        <p className="mb-8">We commit to provide gender-responsive services to produce the Region 1 development plans and all its implementing policies, investment programs and activities, and to oversee and track its implementation and report the results to all stakeholders in contribution to regional and national development. </p>
                        <h1 className="text-normal font-semibold mb-4">Quality Policy</h1>
                        <p className="mb-4">We, commit to orchestrate regional development through effective services and innovative quality products to meet planned organizational objectives and respond to the dynamic needs of our stakeholders. </p>
                        <p className="mb-4">To uphold this, we bind ourselves to:</p>
                        <div className="flex flex-col gap-4 mb-4">
                            <p className="flex items-center">
                                <span className="h-2 w-2 bg-black rounded-full mr-4 p-1"></span>
                                Continually improve products and services to ensure a high level of satisfaction for our customers;
                            </p>
                            <p className="flex items-center">
                                <span className="h-2 w-2 bg-black rounded-full mr-4 p-1"></span>
                                Adhere to statutory and regulatory requirements in the performance of our functions;
                            </p>
                            <p className="flex items-center">
                                <span className="h-2 w-2 bg-black rounded-full mr-4 p-1"></span>
                                Continually improve the effectiveness of our quality management system aligned with international standards;
                            </p>
                            <p className="flex items-center">
                                <span className="h-2 w-2 bg-black rounded-full mr-4 p-1"></span>
                                Maintain a dynamic organization with highly motivated and competent men and women committed to good governance.
                            </p>
                        </div>
                        <p className="mb-4">For more information, visit our{' '}
                        <a 
                            href="https://ilocos.neda.gov.ph" 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-blue-600 underline hover:text-blue-800"
                        >
                            official website
                        </a>    
                        .</p>
                    </CardContent>
                    <CardFooter>
                        
                    </CardFooter>
                </Card>
            </div>
        </div>
      </TabsContent>
      <TabsContent value="password">
        <Card>
          <CardHeader>
            <CardTitle>Password</CardTitle>
            <CardDescription>
              Change your password here. After saving, you'll be logged out.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="space-y-1">
              <Label htmlFor="current">Current password</Label>
              <Input id="current" type="password" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="new">New password</Label>
              <Input id="new" type="password" />
            </div>
          </CardContent>
          <CardFooter>
            <Button>Save password</Button>
          </CardFooter>
        </Card>
      </TabsContent>
    </Tabs>
    </div>
  )
}

export default Dashboard