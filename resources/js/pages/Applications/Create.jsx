import PageTitle from "@/components/PageTitle"
import { Link } from '@inertiajs/react'
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

const Create = () => {

    const breadcrumbItems = [
        { label: 'Home', href: '/' },
        { label: 'Recruitment', href: '#' },
        { label: 'Applications', href: route('applications.index') },
        { label: 'Add New', href: route('applications.create') },
    ]

    return (
        <div className="flex flex-col gap-2">
            <div className="flex justify-between">
                <Link
                    href="/applications"
                    className="hidden md:block"
                >
                    <Button
                        variant="ghost"
                        className="flex items-center rounded-md disabled:opacity-50"
                        size="sm"
                    >
                        <ChevronLeft className="h-8 w-8" />
                        <span className="sr-only sm:not-sr-only">Back to Applications</span>
                    </Button>
                </Link>
            </div>
            <PageTitle pageTitle="Add New Application" description="Accomplish the form to add new application." breadcrumbItems={breadcrumbItems} />

            <Form />
        </div>
    )
}

export default Create