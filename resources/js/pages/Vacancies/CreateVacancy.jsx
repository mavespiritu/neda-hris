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
import VacancyForm from "./VacancyForm"

const CreateVacancy = () => {

    const breadcrumbItems = [
        { label: 'Home', href: '/' },
        { label: 'RSP', href: '#' },
        { label: 'Vacancies', href: route('vacancies.index') },
        { label: 'Add New', href: route('vacancies.create') },
    ]

    return (
        <div className="flex flex-col gap-2">
            <div className="flex justify-between">
                <Link
                    href="/vacancies"
                    className="hidden md:block"
                >
                    <Button
                        variant="ghost"
                        className="flex items-center rounded-md disabled:opacity-50"
                        size="sm"
                    >
                        <ChevronLeft className="h-8 w-8" />
                        <span className="sr-only sm:not-sr-only">Back to Vacancies</span>
                    </Button>
                </Link>
            </div>
            <PageTitle pageTitle="Add New Vacancy" description="Accomplish the form to add new vacancy." breadcrumbItems={breadcrumbItems} />

            <VacancyForm />
        </div>
    )
}

export default CreateVacancy