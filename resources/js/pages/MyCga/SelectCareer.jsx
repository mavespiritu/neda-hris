import { Button } from "@/components/ui/button"
import SingleComboBox from "@/components/SingleComboBox"
import CareerPathForm from "@/pages/MyCga/CareerPathForm"
import { useState, useEffect } from "react"

const SelectCareer = ({emp_id, careers, fetchCareers, selectedCareer, setSelectedCareer}) => {

    const [isOpen, setIsOpen] = useState(false)
    const openModal = () => setIsOpen(true)
    const closeModal = () => setIsOpen(false)

  return (
    <div className="flex justify-between items-end gap-4">
        <SingleComboBox 
            items={careers} 
            onChange={(value => setSelectedCareer(value))}
            placeholder="Select career path"
            name="career"
            id="career"
            width="w-[450px]"
            value={selectedCareer}
        />
        <Button onClick={openModal} className="gap-2 text-sm">
            Add New Career Path
        </Button>
        <CareerPathForm emp_id={emp_id} open={isOpen} onClose={closeModal} setSelectedCareer={setSelectedCareer} fetchCareers={fetchCareers} />
    </div>
  )
}

export default SelectCareer