import PageTitle from "@/components/PageTitle"
import { Link } from '@inertiajs/react'
import { Button } from "@/components/ui/button"
import { 
    ChevronLeft,
    ChevronRight,
 } from 'lucide-react'
import VacancyForm from "./VacancyForm"
import { usePage } from '@inertiajs/react'

const EditVacancy = () => {

    const { vacancy } = usePage().props

    const breadcrumbItems = [
        { label: 'Home', href: '/' },
        { label: 'RSP', href: '#' },
        { label: 'Vacancies', href: route('vacancies.index') },
        { label: `Edit Vacancy: ${vacancy.item_no}`, href: route('vacancies.edit', vacancy.id) },
    ]

    return (
        <div className="flex flex-col gap-2">
            <div className="flex justify-between">
                <Link
                    href={route('vacancies.index')}
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
                <Link
                    href={route('vacancies.show', vacancy.id)}
                    className="hidden md:block"
                >
                    <Button
                        variant="ghost"
                        className="flex items-center rounded-md disabled:opacity-50"
                        size="sm"
                    >
                        <span className="sr-only sm:not-sr-only">Go to Vacancy Info</span>
                        <ChevronRight className="h-8 w-8" />
                    </Button>
                </Link>
            </div>

            <PageTitle pageTitle="Edit Vacancy" description="Accomplish the form to edit vacancy." breadcrumbItems={breadcrumbItems} />

            <VacancyForm />
        </div>
    )
}

export default EditVacancy