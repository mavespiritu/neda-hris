import { 
    Card, 
    CardContent, 
    CardDescription, 
    CardFooter, 
    CardHeader, 
    CardTitle 
} from "@/components/ui/card"

const Welcome = () => {
  return (
    <Card>
        <CardHeader>
            <CardTitle className="leading-tight text-lg">Welcome to the DEPDev RO1 Job Portal</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
            <p className="mb-8">Thanks for exploring career opportunities!</p>
            <p className="mb-8">This is your personal candidate home page. From here, you can track the progress of your application, see next steps in the process and keep your contact details and account settings up to date. </p>
            <h1 className="text-lg font-semibold">About Us</h1>
            <div className="flex justify-center">
                <img src="/images/logo.png" alt="NEDA Logo" className="h-[300px] max-h-[50%] w-auto p-4 object-contain" />
            </div>
            <h1 className="text-normal font-semibold mb-4">Vision</h1>
            <p className="mb-8">DEPDev RO1: The region's trusted, people-first, and future-ready strategic development compass guided by the Divine Providence. </p>
            <h1 className="text-normal font-semibold mb-4">Mission</h1>
            <p className="mb-8">We serve as Region 1's strategic development compass, advancing continuing, integrated, and coordinated evidence-based planning, investment programming and budgeting, monitoring and evaluation, research and advocacy, and administrative services delivered through pioneering technology in an environment of creativity, harmony, and inclusion.</p>
            <h1 className="text-normal font-semibold mb-4">Quality Policy</h1>
            <p className="mb-4"><span className="font-bold">iNICE</span> - <span className="font-bold">iN</span>novativeness, <span className="font-bold">I</span>ntegrity, <span className="font-bold">C</span>ompassion, <span className="font-bold">E</span>xcellence</p>
            <div className="flex flex-col gap-4 mb-4">
                <p>
                    <span className="font-bold underline">Innovativeness</span> - DEPDev RO1 fosters new ideas, technologies, and methods to improve DEPDev's expanded mandate.
                </p>
                <p>
                    <span className="font-bold underline">Integrity</span> - DEPDev RO1 upholds the highest ethical standards in the formulation and review of plans and policies, ensuring honesty, impartiality, and trustworthiness in all actions and recommendations.
                </p>
                <p>
                    <span className="font-bold underline">Compassion</span> - DEPDev RO1 demonstrates genuine care for people and communities by formulating responsive and proactive policies, plans, programs and actions that uplift lives, especially the underserved, while honoring the dignity of every individual.
                </p>
                <p>
                    <span className="font-bold underline">Excellence</span> - DEPDev RO1 employs evidence-based planning methods, robust data analysis, and continuous improvement to raise the quality and effectiveness of government development outcomes.
                </p>
            </div>
            <p className="mb-4">For more information, visit our{' '}
            <a 
                href="https://dro1.depdev.gov.ph" 
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
)
}

export default Welcome