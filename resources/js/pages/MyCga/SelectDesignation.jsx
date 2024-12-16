import SingleComboBox from "@/components/SingleComboBox"
import { useState, useEffect } from "react"

const SelectDesignation = ({designations, fetchDesignations, selectedDesignation, setSelectedDesignation}) => {

  return (
    <div className="flex justify-between items-end gap-4">
        <SingleComboBox 
            items={designations} 
            onChange={(value => setSelectedDesignation(value))}
            placeholder="Select designation"
            name="designation"
            id="designation"
            width="w-[450px]"
        />
    </div>
  )
}

export default SelectDesignation