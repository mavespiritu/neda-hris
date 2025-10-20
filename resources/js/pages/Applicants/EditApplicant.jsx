import PageTitle from "@/components/PageTitle"
import { Link, usePage } from '@inertiajs/react'
import { Button } from "@/components/ui/button"
import { 
    Search, 
    ThumbsUp, 
    Plus, 
    ThumbsDown, 
    Trash2, 
    Pencil, 
    ChevronsLeft,
    ChevronLeft,
 } from 'lucide-react'
import Form from "./Form"

const EditApplicant = () => {

    const { applicant } = usePage().props

    const breadcrumbItems = [
        { label: 'Home', href: '/' },
        { label: 'Recruitment', href: '#' },
        { label: 'Applicants', href: route('applicants.index') },
        { label: 'Edit Applicant', href: route('applicants.edit', {id: applicant.id}) },
    ]

    return (
        <div className="flex flex-col gap-2">
            <div className="flex justify-between">
                <Link
                    href="/applicants"
                    className="hidden md:block"
                >
                    <Button
                        variant="ghost"
                        className="flex items-center rounded-md disabled:opacity-50"
                        size="sm"
                    >
                        <ChevronLeft className="h-8 w-8" />
                        <span className="sr-only sm:not-sr-only">Back to Applicants</span>
                    </Button>
                </Link>
            </div>
            <PageTitle pageTitle="Add New Applicant" description="Accomplish the form to add new applicant." breadcrumbItems={breadcrumbItems} />

            <Form applicant={applicant} />
        </div>
    )
}

export default EditApplicant