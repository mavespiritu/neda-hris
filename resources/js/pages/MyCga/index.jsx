import PageTitle from "@/components/PageTitle"
import { usePage } from '@inertiajs/react'
import Menu from "@/pages/MyCga/Menu"
import { useHasRole } from '@/hooks/useAuth'

const MyCga = () => {

    const canViewPage = useHasRole('HRIS_Staff')

    if (!canViewPage) {
        return <p className="font-semibold flex justify-center items-center h-full">You do not have permission to view this page.</p>
    }

    const { emp_id, position_id } = usePage().props

    const breadcrumbItems = [
        { label: 'Home', href: '/' },
        { label: 'Competencies' },
        { label: 'My CGA', href: '/my-cga' },
    ]

    return (
        <div className="min-h-screen">
            <PageTitle pageTitle="My CGA" breadcrumbItems={breadcrumbItems} />
            <Menu emp_id={emp_id} position_id={position_id}/>
        </div>
    )
}

export default MyCga
