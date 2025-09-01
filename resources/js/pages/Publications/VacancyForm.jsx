import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle,
    DialogDescription, 
    DialogClose,
    DialogFooter 
} from "@/components/ui/dialog"
import { useState, useEffect } from 'react'
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import SingleComboBox from "@/components/SingleComboBox"
import axios from 'axios'
import { useForm } from '@inertiajs/react'
import { useToast } from "@/hooks/use-toast"
import { store } from './store'
import { Loader2 } from "lucide-react"
import { Inertia } from '@inertiajs/inertia'

const VacancyForm = ({id}) => {

    const { toast } = useToast()

    const { 
        isVacancyFormOpen, 
        closeVacancyForm,
    } = store()

    const [vacancies, setVacancies] = useState([])

    const { 
        post, 
        reset, 
        data, 
        setData,
        errors,
        clearErrors,
        processing 
    } = useForm({
        vacancy_id: "",
    })

    const fetchVacancies = async () => {
        try {

            const response = await axios.get(route('publications.vacancies', id, {status: 'Approved'}))

            setVacancies(response.data)

        } catch (error) {

            toast({
                title: 'Error',
                description: 'Failed to fetch vacancies.',
                variant: 'destructive',
            })

        }
    }

    useEffect(() => {
        if(isVacancyFormOpen){
            fetchVacancies()
        }
    }, [isVacancyFormOpen])

    const handleSubmit = (e) => {
        e.preventDefault()
        post(route('publications.vacancies.store', id), {
            preserveScroll: true,
            onSuccess: () => {
            toast({
                title: "Success!",
                description: "Vacancy has been submitted successfully.",
            })
            reset()
            closeVacancyForm()
        },
        })
    }

    return (
        <Dialog 
            open={isVacancyFormOpen}
            onOpenChange={(open) => {
                if (!open) {
                    reset()
                    clearErrors()
                    closeVacancyForm()
                }
            }}
        >
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Include Vacancy Form</DialogTitle>
                    <DialogDescription>Accomplish this form to include vacancy for publication.</DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex flex-col gap-2">
                        <Label>Vacancy</Label>
                        <SingleComboBox 
                            items={vacancies} 
                            onChange={(value) => {
                                setData("vacancy_id", value)
                            }}
                            invalidMessage={errors.vacancy_id}
                            placeholder="Select vacancy"
                            name="vacancy"
                            id="vacancy_id"
                            value={data.vacancy_id}
                            width="w-[460px]"
                            className="w-full"
                        />
                        {errors?.vacancy_id && <span className="text-red-500 text-xs">{errors.vacancy_id}</span>}
                    </div>

                    <DialogFooter className="mt-4">
                        <DialogClose asChild>
                            <Button type="button" variant="ghost">
                              Cancel
                            </Button>
                        </DialogClose>
                        <Button 
                            type="submit" 
                            disabled={processing}
                        >
                            {processing ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    <span>Please wait</span>
                                </>
                            ) : 'Submit'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

export default VacancyForm