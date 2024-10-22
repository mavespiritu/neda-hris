import SingleComboBox from "@/components/SingleComboBox"
import { useState, useEffect } from "react"

const SelectDesignation = ({setSelectedDesignation}) => {

    const [designations, setDesignations] = useState([])

    const fetchDesignations = async () => {
        try {
            const response = await fetch(`/my-cga/designations`);
            if (!response.ok) {
                toast({
                    title: "Uh oh! Something went wrong.",
                    description: "Network response was not ok",
                })
            }
            const data = await response.json()
          
            setDesignations(data)

        } catch (err) {
            toast({
                title: "Uh oh! Something went wrong.",
                description: "There was a problem with your request",
            })
        }
    }

    useEffect(() => {
        fetchDesignations()
    }, [])

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