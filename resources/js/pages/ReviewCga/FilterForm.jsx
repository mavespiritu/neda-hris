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

const FilterForm = ({ open, onClose, employees }) => {

    const textSize = useTextSize()

    const {
        competenciesState: { 
            filters,
        },
        setFilters,
        clearFilters
    } = useCompetencyReviewStore()

    const [staff, setStaff] = useState(filters?.staff || null)

    useEffect(() => {
        if (open) {
        }
    }, [open])

    const handleSubmit = (e) => {
        e.preventDefault()
        setFilters({ staff })
        onClose()
    }

    const handleClearFilters = (e) => {
        e.preventDefault()
        setStaff(null)
        clearFilters()
        onClose()
    }

    const handleChange = (value) => {
        setStaff(value)
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Filter Competencies</DialogTitle>
                    <DialogDescription>
                    Apply filters to submitted competencies 
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col gap-2">
                                <Label className={textSize}>Select Staff:</Label>
                                <SingleComboBox 
                                    items={employees} 
                                    onChange={(handleChange)}
                                    placeholder="Select staff"
                                    name="staff"
                                    id="staff"
                                    width="w-[300px]"
                                    value={staff}
                                />
                            </div>

                            <div className="flex justify-end gap-2">
                                <DialogClose asChild>
                                    <Button type="button" variant="ghost" onClick={handleClearFilters}>
                                    Clear Filters
                                    </Button>
                                </DialogClose>
                                <Button type="submit">
                                    Submit
                                </Button>
                            </div>
                        </div>
                    </form>
            </DialogContent>
        </Dialog>
    )
}

export default FilterForm