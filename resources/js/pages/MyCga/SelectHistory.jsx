import { Button } from "@/components/ui/button"
import SingleComboBox from "@/components/SingleComboBox"
import CareerPathForm from "@/pages/MyCga/CareerPathForm"
import { useState, useEffect } from "react"

const SelectHistory = ({emp_id, histories, fetchHistories, selectedHistory, setSelectedHistory}) => {

  return (
    <div className="flex justify-between items-end gap-4">
        <SingleComboBox 
            items={histories} 
            onChange={(value => setSelectedHistory(value))}
            placeholder="Select history"
            name="history"
            id="history"
            width="w-[450px]"
            value={selectedHistory}
        />
    </div>
  )
}

export default SelectHistory