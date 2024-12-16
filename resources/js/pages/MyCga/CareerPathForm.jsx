import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogClose
} from "@/components/ui/dialog"

import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from 'react'
import { useForm } from '@inertiajs/react'
import SingleComboBox from "@/components/SingleComboBox"
import TextArea from "@/components/TextArea"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import FileUpload from "@/components/FileUpload"

const CareerPathForm = ({ emp_id, open, onClose, setSelectedCareer, fetchCareers }) => {

    const { toast } = useToast()

    const [positions, setPositions] = useState([])

    const initialValues = {
        position_id: null
    }

    const { data, setData, post, processing, errors, clearErrors, reset } = useForm(initialValues)

    const fetchPositions = async () => {
        try {
            const response = await fetch(`/my-cga/career-positions/${emp_id}`);
            if (!response.ok) {
                toast({
                    title: "Uh oh! Something went wrong.",
                    description: "Network response was not ok",
                })
            }
            const data = await response.json()
          
            setPositions(data)

        } catch (err) {
            toast({
                title: "Uh oh! Something went wrong.",
                description: "There was a problem with your request",
            })
        }
    }

  useEffect(() => {
    if (open) {
        fetchPositions()
        clearErrors()
    }
    reset()
  }, [open, emp_id])

    const handleSubmit = (e) => {
        e.preventDefault()

        post(`/my-cga/career-path/${emp_id}`, {
            preserveState: true,
            onSuccess: () => {
                toast({
                    title: "Success!",
                    description: "The career path has been created successfully",
                })
                reset()
                clearErrors()
                onClose()
                fetchCareers()
                setSelectedCareer(data.position_id)
            },
            onError: () => {
            }
        })
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add new career path</DialogTitle>
                    <DialogDescription>
                        Select a position to be added on your career path
                    </DialogDescription>
                </DialogHeader>
                <div>
                    <form onSubmit={handleSubmit}>

                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="award_id">Position</Label>
                                <SingleComboBox 
                                    items={positions} 
                                    onChange={(value => setData('position_id', value))}
                                    invalidMessage={errors.position_id}
                                    placeholder="Select position"
                                    name="position"
                                    id="position"
                                    value={data.position_id}
                                    width="w-[460px]"
                                    className="w-full"
                                />
                                {errors?.position_id && <span className="text-red-500 text-xs">{errors.position_id}</span>}
                            </div>
                            <div className="flex justify-end gap-2">
                                <DialogClose asChild>
                                    <Button type="button" variant="outline">
                                    Cancel
                                    </Button>
                                </DialogClose>
                                <Button type="submit" disabled={processing}>
                                    {processing ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            <span>Please wait</span>
                                        </>
                                    ) : 'Submit'}
                                </Button>
                            </div>
                        </div>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default CareerPathForm