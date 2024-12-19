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
import TextInput from "@/components/TextInput"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

import { 
    getTrainings,
    getCompetencies,
} from '@/pages/MyCga/api'

const ProposedTrainingForm = ({ emp_id, position_id, selectedTraining, selectedSubmission, open, onClose, onSuccess }) => {
    
    const { toast } = useToast()

    const [trainings, setTrainings] = useState([])
    const [competencies, setCompetencies] = useState([])
    const [isManualTraining, setIsManualTraining] = useState(true)

    const initialValues = {
        competency_id: selectedTraining?.competency_id || null,
        training_id: selectedTraining?.training_id || null,
        training_title: selectedTraining?.training_title || "",
        emp_id,
        position_id,
        review_id: selectedSubmission?.id || null
    }

    const { data, setData, post, put, processing, errors, clearErrors, reset } = useForm(initialValues)

    const fetchTrainings = async () => {
        try {
            const response = await getTrainings()

            if (response.status === 200) {
                setTrainings(response.data)
            } else {
                toast({
                    title: "Uh oh! Something went wrong.",
                    description: "There was a problem with your request.",
                    variant: "destructive"
                })
            }
        } catch (err) {
            
            toast({
                title: "Uh oh! Something went wrong.",
                description: "There was a problem with your request",
            })
        }
    }

    const fetchCompetencies = async () => {
        try {
            const response = await getCompetencies({emp_id, position_id, gapOnly: true})

            if (response.status === 200) {
                setCompetencies(response.data?.competencySelections)
            } else {
                toast({
                    title: "Uh oh! Something went wrong.",
                    description: "There was a problem with your request.",
                    variant: "destructive"
                })
            }
        } catch (err) {

            toast({
                title: "Uh oh! Something went wrong.",
                description: "There was a problem with your request",
            })
        }
    }

    useEffect(() => {
        if (open) {
            fetchCompetencies() 
            fetchTrainings()
            setIsManualTraining(!selectedTraining?.training_id)
        }
        setData(initialValues)
    }, [open])

    useEffect(() => {
        setData((prevData) => ({
            ...prevData,
            competency_id: selectedTraining?.competency_id || null,
            training_id: selectedTraining?.training_id || null,
            training_title: selectedTraining?.training_title || "",
            review_id: selectedSubmission?.id || null
        }))
    }, [selectedTraining])

    console.log(data)

    const handleSubmit = (e) => {
        e.preventDefault()

        if (!data.training_id && !data.training_title) {
            toast({
              title: "Validation Error",
              description: "You must either select a training or provide the title of the training.",
              variant: "destructive",
            })
            return
        }

        const isUpdate = selectedTraining != null
        const url = isUpdate ? `/my-cga/proposed-trainings/${selectedTraining?.id}`
            : `/my-cga/proposed-trainings`

        const method = isUpdate ? put : post

        method(url, {
            preserveState: true,
            onSuccess: () => {
                toast({
                    title: "Success!",
                    description: isUpdate
                    ? "The training has been updated successfully"
                    : "The training has been created successfully",
                })
                reset()
                clearErrors()
                onClose()
                onSuccess()
            },
            onError: () => {
    
            }
        })
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{selectedTraining ? `Edit` : `Add`} training requirement</DialogTitle>
                    <DialogDescription>
                    Add training to address competency gap
                    </DialogDescription>
                </DialogHeader>
                <div>
                    <form onSubmit={handleSubmit}>
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="competency_id">Competency</Label>
                                <SingleComboBox 
                                    items={competencies} 
                                    onChange={(value) => setData("competency_id", value)}
                                    invalidMessage={errors.competency_id}
                                    placeholder="Select competency"
                                    name="competency"
                                    id="competency"
                                    value={data.competency_id}
                                    width="w-[460px]"
                                    className="w-full"
                                />
                                {errors?.competency_id && <span className="text-red-500 text-xs">{errors.competency_id}</span>}
                            </div>
                            
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="training_id">Training</Label>
                                <SingleComboBox
                                    items={trainings}
                                    onChange={(value) => {
                                        setData("training_id", value)
                                        setIsManualTraining(!value)
                                    }}
                                    invalidMessage={errors.training_id}
                                    placeholder="Select training"
                                    name="training"
                                    id="training"
                                    value={data.training_id}
                                    width="w-[460px]"
                                    className="w-full"
                                />
                            </div>

                            {isManualTraining && (
                            <>
                                <div className="flex items-center justify-center">
                                    <div className="flex-grow border-t border-gray-300"></div>
                                    <span className="px-4 text-center text-sm font-medium">or</span>
                                    <div className="flex-grow border-t border-gray-300"></div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="training_title">if proposed training not on the list, type it here manually</Label>
                                    <TextInput
                                    name="training_title"
                                    onChange={(e) => setData("training_title", e.target.value)}
                                    invalidMessage={errors.training_title}
                                    placeholder="Type the title of training"
                                    id="training_title"
                                    value={data.training_title}
                                    />
                                </div>
                            </>
                            )}

                            <div className="flex justify-end gap-2">
                                <DialogClose asChild>
                                    <Button type="button" variant="ghost">
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

export default ProposedTrainingForm