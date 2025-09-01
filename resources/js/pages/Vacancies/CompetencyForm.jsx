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
import useCompetencyReviewStore from '@/stores/useCompetencyReviewStore'
import { useTextSize } from "@/providers/TextSizeProvider"
import SingleComboBox from "@/components/SingleComboBox"
import { store } from './store'
import { 
    getCompetencies,
} from './api'
import { useToast } from "@/hooks/use-toast"
import IntegerInput from "@/components/IntegerInput"

const CompetencyForm = ({ open, onClose, data, setData }) => {

    const {
        activeCompetencyType,
    } = store()

    const { toast } = useToast()

    const types = {
        organizational: 'org',
        leadership: 'mnt',
        functional: 'func'
    }

    const initialValues = {
        id: null,
        competency: '',
        comp_type: types[activeCompetencyType],
        level: 1
    }

    const [competencies, setCompetencies] = useState([])
    const [values, setValues] = useState(initialValues)
    const [errors, setErrors] = useState({})

    const fetchCompetencies = async (payload) => {
        try {
            const response = await getCompetencies(payload)

            setCompetencies(
            response.data.filter(c =>
                !data.competencies[activeCompetencyType].some(dc => dc.id === c.value)
            )
            )

        } catch (err) {
            console.log(err)
            toast({
                title: "Uh oh! Something went wrong.",
                description: "There was a problem with your request",
            })
        }
    }

    useEffect(() => {
        if (open) {
            setValues({
            ...initialValues,
            comp_type: types[activeCompetencyType]
            })
            setErrors({})
            fetchCompetencies({comp_type: types[activeCompetencyType]})
        }
    }, [open])

    const handleSubmit = (e) => {
        e.preventDefault()

        const errors = {}
        const { competency, level } = values

        if (!competency) {
            errors.competency = "The competency is required"
        }

        if (!level) {
            errors.level = "The level is required"
        }

        if (Object.keys(errors).length) {
            setErrors(errors)
            return
        }

        setErrors({})

        setData(prev => ({
            ...prev,
            competencies: {
            ...prev.competencies,
            [activeCompetencyType]: [
                ...prev.competencies[activeCompetencyType],
                values
            ]
            }
        }))

        setValues(initialValues)

        onClose()
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add Competencies</DialogTitle>
                    <DialogDescription>
                    Add competencies under {activeCompetencyType} type.
                    </DialogDescription>
                </DialogHeader>
                <div onSubmit={handleSubmit}>
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                            <Label>Competency</Label>
                            <SingleComboBox 
                                items={competencies} 
                                onChange={(id) => {
                                    const selected = competencies.find(c => c.value === id)
                                    if (selected) {
                                    setValues(prev => ({
                                        ...prev,
                                        id: selected.value,
                                        competency: selected.label,
                                        comp_type: selected.comp_type
                                    }))
                                    }
                                }}
                                invalidMessage={errors.competency}
                                placeholder="Select competency"
                                name="competency"
                                id="competency"
                                value={values.id}
                                width="w-[460px]"
                                className="w-full"
                            />
                            {errors?.competency && <span className="text-red-500 text-xs">{errors.competency}</span>}
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label>Level</Label>
                            <IntegerInput
                                id='level'
                                value={values.level}
                                onChange={(value) =>
                                    setValues(prev => ({ ...prev, level: value }))
                                }
                            />
                            {errors?.level && <span className="text-red-500 text-xs">{errors.level}</span>}
                        </div>

                        <div className="flex justify-end gap-2">
                            <DialogClose asChild>
                                <Button type="button" variant="ghost" >
                                Cancel
                                </Button>
                            </DialogClose>
                            <Button onClick={handleSubmit}>
                                Submit
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default CompetencyForm