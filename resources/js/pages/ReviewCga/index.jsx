
import Breadcrumbs from "@/components/Breadcrumbs"
import {
    Card,
    CardContent,
  } from "@/components/ui/card"

import PageTitle from "@/components/PageTitle"
import Evidences from "@/pages/ReviewCga/Evidences"

const ReviewCga = () => {

    const breadcrumbItems = [
        { label: 'Home', href: '/' },
        { label: 'Competencies' },
        { label: 'Review CGA', href: '/review-cga' },
    ]

    return (
        <div className="grid grid-rows-[auto,1fr] h-full flex-grow overflow-hidden">
            <PageTitle pageTitle="Review CGA" breadcrumbItems={breadcrumbItems} />
            <Card className="w-full h-full grid grid-rows-[1fr]">
                <CardContent className="flex-grow p-4">
                    <Evidences />
                </CardContent>
            </Card>
        </div>
    )
}

export default ReviewCga