import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import TextInput from "@/components/TextInput"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { 
    SlidersHorizontal
} from 'lucide-react'
import { store } from './store'
import SingleComboBox from "@/components/SingleComboBox"

const ProposedTrainingFilter = ({ emp_id, onApplyFilters, filters }) => {

    const [selectedCompetency, setSelectedCompetency] = useState(null)
    const [open, setOpen] = useState(false)

    const {
        competencies,
        fetchCompetencies,
        resetCompetencies
    } = store()

    useEffect(() => {
        if (open) {
        fetchCompetencies({ 
            id: emp_id,
        })
        } else {
        resetCompetencies()
        }
    }, [open])

    useEffect(() => {
        if (!filters.competency_id) {
            setSelectedCompetency(null)
        }
    }, [filters])
      
    return (
      <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
              <Button variant="outline" className="ml-auto gap-2">
                  <SlidersHorizontal className="h-4 w-4" />
                  <span className="hidden md:block">Filter</span>
              </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
              <div className="grid gap-4">
                  <div className="space-y-2">
                      <h4 className="leading-none font-medium">Filter Records</h4>
                      <p className="text-muted-foreground text-sm">
                      Choose from available options to filter records in the table.
                      </p>
                  </div>
                  <div className="grid gap-2">
                      <div className="grid grid-cols-1 items-center gap-1">
                      <Label htmlFor="competency">Competency</Label>
                      <SingleComboBox
                          items={competencies.data}
                          name="competency"
                          value={selectedCompetency ?? ''}
                          onChange={(value) => {
                            setSelectedCompetency(value)
                          }}
                          placeholder="Select competency"
                          loading={competencies.isLoading}
                      />
                      </div>
                  </div>
                  <div className="flex justify-end mt-2">
                      <Button
                          variant="default"
                          onClick={() => {
                              onApplyFilters({
                                  competency_id: selectedCompetency ?? null,
                              })
                              setOpen(false)
                          }}
                      >
                          Apply Filters
                      </Button>
                  </div>
              </div>
          </PopoverContent>
      </Popover>
    )
}

export default ProposedTrainingFilter
