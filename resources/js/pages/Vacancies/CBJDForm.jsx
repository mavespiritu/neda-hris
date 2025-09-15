import { useState, useEffect } from "react"
import axios from "axios"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import SingleComboBox from "@/components/SingleComboBox"

export default function CBJDForm({ open, onClose, onApply }) {

  const [selectedVacancyId, setSelectedVacancyId] = useState(null)
  const [positions, setPositions] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return

    const fetchPositions = async () => {
      try {
        setLoading(true)
        const response = await axios.get(route("vacancies.get-vacancies"))
        setPositions(response.data)
      } catch (error) {
        console.error("Failed to fetch vacant positions:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchPositions()
  }, [open])

  const handleApply = async () => {
    if (!selectedVacancyId) return
    
    try {
        const response = await axios.get(
        route("vacancies.get-vacancy-details", selectedVacancyId)
        )

        onApply(response.data) 
        setSelectedVacancyId(null)
        onClose()
    } catch (error) {
        console.error("Failed to fetch vacancy details:", error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select CBJD to Copy</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label>Vacant Position</Label>
            <SingleComboBox
              items={positions}
              onChange={(value) => setSelectedVacancyId(value)}
              placeholder="Select vacant position"
              name="vacant position"
              id="vacant_position"
              value={selectedVacancyId}
              loading={loading}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleApply}
            >
            Apply
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
