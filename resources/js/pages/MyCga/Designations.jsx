import Competencies from "@/pages/MyCga/Competencies"
import SelectCareer from "./SelectCareer"
import { useState } from "react"

const Designations = ({ emp_id, selectedDesignation }) => {

  const [designation, setDesignation] = useState(null)

  return (
    <div className="h-full grid grid-rows-[1fr]">
        {selectedDesignation ? (
            <Competencies emp_id={emp_id} position_id={selectedDesignation} custom={true} />
        ) : (
            <div className="font-semibold text-muted-foreground text-sm flex justify-center items-center">
              Please select a designation to view competencies.
            </div>
        )}
    </div>
  )
}

export default Designations
