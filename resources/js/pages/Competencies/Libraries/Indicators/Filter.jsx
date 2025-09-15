import { useEffect, useRef, useState } from "react"
import { useForm } from "@inertiajs/react"
import axios from "axios"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import SingleComboBox from "@/components/SingleComboBox"

const proficiencies = [
  { value: 4, label: "4" },
  { value: 3, label: "3" }, 
  { value: 2, label: "2" },
  { value: 1, label: "1" },
]

const Filter = ({ onClose, open, onApply, initialValues }) => {

  const emptyInitialValues = { competency: "", proficiency: "" }
  const firstOpenRef = useRef(true) // track first open

  const { data, setData } = useForm({
    competency: initialValues?.competency || "",
    comp_type: initialValues?.comp_type || "",
  })

  const [competencies, setCompetencies] = useState([])
  const [competenciesLoading, setCompetenciesLoading] = useState(false)

  const fetchCompetencies = async () => {
    try {
      setCompetenciesLoading(true)
      const res = await axios.get(route("competencies.list")) 
      const items = res.data.data.map((c) => ({
        value: c.id,
        label: c.competency,
      }))
      setCompetencies(items)
    } catch (error) {
      console.error(error)
    } finally {
      setCompetenciesLoading(false)
    }
  }

  useEffect(() => {
    if (open) fetchCompetencies()
  }, [open])

  useEffect(() => {
    if (open && firstOpenRef.current) {
      setData(initialValues || emptyInitialValues)
      firstOpenRef.current = false
    }

    // Reset firstOpenRef when dialog closes
    if (!open) {
      firstOpenRef.current = true
    }
  }, [open, initialValues, setData])

  const handleSubmit = (e) => {
    e.preventDefault()
    onApply(data)
    onClose(false)
  }

  const handleClear = () => {
    setData(emptyInitialValues)
    onApply(emptyInitialValues)
    onClose(false)
  }

  const hasFilters = Object.keys(emptyInitialValues).some(
    (key) => data[key] && data[key] !== ""
  )

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Apply Filters</DialogTitle>
          <DialogDescription className="text-justify">
            Fill-up all required fields to filter results.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label>Competency</Label>
            <SingleComboBox
              items={competencies}
              onChange={(e) => setData("competency", e)}
              placeholder="Select competency"
              name="competency"
              id="competency"
              value={data.competency}
              loading={competenciesLoading}
            />
          </div>
          <div className="space-y-1">
            <Label>Proficiency</Label>
            <SingleComboBox
              items={proficiencies}
              onChange={(e) => setData("proficiency", e)}
              placeholder="Select proficiency"
              name="proficiency"
              id="proficiency"
              value={data.proficiency}
            />
          </div>

          <div className="flex justify-end gap-2">
            <DialogClose asChild>
              
              {hasFilters ? (
                <Button type="button" variant="ghost" onClick={handleClear}>
                  Clear Filters
                </Button>
              ) : (
                <Button type="button" variant="ghost" onClick={() => onClose(false)}>
                  Close
                </Button>
              )}

            </DialogClose>
            <Button type="submit">Apply Filters</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default Filter
