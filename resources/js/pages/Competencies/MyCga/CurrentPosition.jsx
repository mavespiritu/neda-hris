import { useState, useEffect } from 'react'
import { usePage } from '@inertiajs/react'
import { store } from './store'
import Competency from './Competency'
import Indicator from './Indicator'
import CompetenciesLoading from "@/components/skeletons/CompetenciesLoading"
import { Input } from "@/components/ui/input"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

import { Search } from 'lucide-react'

const CurrentPosition = () => {

  const [searchCompetency, setSearchCompetency] = useState("")

  const {
      competencies,
      selectedCompetency,
      selectedIndicator,
      fetchCompetencies,
      selectedStaff,
      setSelectedCompetency,
      setSelectedIndicator
  } = store()

  const {value: emp_id, item_no, position} = selectedStaff

  useEffect(() => {
    fetchCompetencies({
      id: emp_id, 
      filters: { 
        item_no,
        grouped: true 
    }})
    setSelectedIndicator({})
  }, [item_no, emp_id])
  
  return (
    <div className="flex flex-col flex-grow gap-4">
      <div>
          <h3 className="font-bold text-lg">Current Position</h3>
          <p className="text-muted-foreground text-sm">Update your current position's required competencies and indicators here.</p>
      </div>
      <div className="flex flex-col border rounded-lg p-4">
        <div className="flex flex-col md:flex-row justify-between"> 
          <div>
            <h4 className="leading-normal text-sm">Required Competencies for:</h4>
            <h5 className="font-semibold">{position} ({item_no})</h5>
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="w-full md:w-[30%] py-4">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
              <Input
                autoFocus
                placeholder="Type to search competency..."
                type="search"
                value={searchCompetency}
                onChange={(e) => setSearchCompetency(e.target.value)}
                className="pl-9 w-full text-sm rounded"
              />
            </div>
            { !competencies.isLoading ? (
                <Accordion
              type="single"
              collapsible
              className="w-full flex flex-col gap-4"
            >
              {competencies.data && Object.keys(competencies.data).map((type, idx) => (
                <div key={type}>
                  <div className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-2 mt-4">
                    {type}
                  </div>
                  {competencies.data[type]
                    .filter(competency =>
                      competency.competency.toLowerCase().includes(searchCompetency.toLowerCase())
                    )
                    .map((competency) => (
                    <AccordionItem 
                      value={`${type}-${competency.id}`} 
                      key={competency.id}
                      onClick={() => setSelectedCompetency(competency)}
                    >
                      <AccordionTrigger 
                        className={`
                          w-full
                          flex flex-row items-center gap-2
                          rounded-md text-xs transition-colors 
                          disabled:pointer-events-none disabled:opacity-50 
                          hover:text-accent-foreground p-2
                          ${selectedCompetency.id === competency.id && `font-bold`}
                          `}
                        title={competency.competency}
                      >
                        <span className="w-3/4 md:w-4/5 break-words text-left">
                          {competency.competency} ({competency.proficiency})
                        </span>
                        <span className="w-1/4 md:w-1/5 text-right">
                          {competency.percentage}%
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="flex flex-col gap-4 text-balance">
                        <Competency emp_id={emp_id} item_no={item_no} />
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </div>
              ))}
            </Accordion>) : <CompetenciesLoading /> }
          </div>
          <div className="w-full md:w-[70%] py-4">
            {Object.keys(selectedIndicator).length > 0 && <Indicator emp_id={selectedStaff?.value} item_no={selectedStaff?.item_no} />}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CurrentPosition