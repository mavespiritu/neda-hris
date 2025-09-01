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
            <CardTitle className="leading-tight text-lg">Welcome to the DEPDev RO1 HRIS!</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="mb-8">Thanks for exploring DEPDev RO1 career opportunities!</p>
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