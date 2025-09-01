import PageTitle from "@/components/PageTitle"
import Welcome from "./Welcome"
import { useState } from 'react'
import { useHasRole } from '@/hooks/useAuth'
import { useToast } from "@/hooks/use-toast"
import { 
    Card, 
    CardContent, 
    CardDescription, 
    CardFooter, 
    CardHeader, 
    CardTitle 
} from "@/components/ui/card"

const Home = () => {
  return (
    <div className="flex gap-4">
        <div className="flex-[7] md:w-full">
            <Card>
                <CardHeader className="space-y-0">
                    <CardTitle className="leading-tight text-lg">My Applications</CardTitle>
                    <CardDescription>Check the status of your applications below.</CardDescription>
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
        <div className="flex-[3] hidden lg:block">
            <Welcome />
        </div>
    </div>
  )
}

export default Home