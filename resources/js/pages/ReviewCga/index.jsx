
import Breadcrumbs from "@/components/Breadcrumbs"
import {
    Card,
    CardContent,
  } from "@/components/ui/card"

import PageTitle from "@/components/PageTitle"
import Evidences from "@/pages/ReviewCga/Evidences"
import Menu from "@/pages/ReviewCga/Menu"
import { useHasPermission } from '@/hooks/useAuth'

const ReviewCga = () => {

    const canViewPage = useHasPermission('HRIS_my-cga.review-competency')

    if (!canViewPage) {
        return <p className="font-semibold flex justify-center items-center h-full">You do not have permission to view this page.</p>
    }

    const breadcrumbItems = [
        { label: 'Home', href: '/' },
        { label: 'Competencies' },
        { label: 'Review CGA', href: '/review-cga' },
    ]

    return (
        <div className="grid grid-rows-[auto,1fr] h-screen flex-1 overflow-hidden">
            <PageTitle pageTitle="Review CGA" breadcrumbItems={breadcrumbItems} />
            <Menu />
        </div>
    )
}

export default ReviewCga

