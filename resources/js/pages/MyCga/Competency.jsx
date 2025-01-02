import { useState, useEffect } from 'react'
import { Switch } from "@/components/ui/switch"
import Indicator from "@/pages/MyCga/Indicator"
import IndicatorsLoading from "@/components/skeletons/IndicatorsLoading"
import { useToast } from "@/hooks/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"
import SingleComboBox from "@/components/SingleComboBox"
import { Label } from "@/components/ui/label"
import { useForm, Link } from '@inertiajs/react'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import { Button } from "@/components/ui/button"
import { useTextSize } from "@/providers/TextSizeProvider"

const Competency = ({ emp_id, position_id, competency, fetchCompetencies, all, custom, proficiency }) => {

  const textSize = useTextSize()

  const { toast } = useToast()

  const [activeIndicator, setActiveIndicator] = useState(null)
  const [indicator, setIndicator] = useState(null)
  const [indicators, setIndicators] = useState([])
  const [compliances, setCompliances] = useState([])
  const [indicatorsLoading, setIndicatorsLoading] = useState(true)
  const [indicatorsError, setIndicatorsError] = useState(null)
  const [indicatorSelections, setIndicatorSelections] = useState([])

  const fetchIndicators = async () => {
    try {
        let url = ''

        if(all){
          url = `/my-cga/competency/${emp_id}?all=true&competency_id=${competency.id}&position_id=${position_id}`
        }else if(custom){
          url = `/my-cga/competency/${emp_id}?custom=true&proficiency=${proficiency}&competency_id=${competency.id}&position_id=${position_id}`
        }else{
          url = `/my-cga/competency/${emp_id}?competency_id=${competency.id}&position_id=${position_id}`
        }

        const response = await fetch(url)
        if (!response.ok) {
            throw new Error('Network response was not ok')
        }

        const data = await response.json()
        
        const sortedData = Object.entries(data.indicators)
        .map(([proficiency, indicators]) => ({
          proficiency: parseInt(proficiency), 
          indicators, 
        }))
        .sort((a, b) => b.proficiency - a.proficiency) 
        .reduce((acc, { proficiency, indicators }) => {
          acc[proficiency] = indicators 
          return acc
        }, {})

        setIndicators(sortedData)
        setIndicatorSelections(data.indicatorSelections)
    } catch (err) {
      setIndicatorsError(err.message)
    } finally {
      setIndicatorsLoading(false)
    }
  }

  const fetchCompliances = async () => {
    try {
        const response = await fetch(`/my-cga/compliances/${emp_id}?competency_id=${competency.id}`)
        if (!response.ok) {
            throw new Error('Network response was not ok')
        }
        const data = await response.json()
        
        setCompliances(data)
    } catch (err) {
      console.log(err.message)
    }
  }

  useEffect(() => {
    fetchIndicators()
    fetchCompliances()
    setActiveIndicator(null)

  }, [competency])

  const handleIndicatorClick = (indicatorId, proficiency) => {
      setActiveIndicator(indicatorId)
      setIndicator(Object.values(indicators[proficiency]).flat().find(i => i.indicator_id === indicatorId))
  }

  const handleIndicatorSelectionClick = (indicatorId) => {
    const selectedIndicator = indicatorSelections.find(c => c.value === indicatorId)

    if (selectedIndicator) {
      setActiveIndicator(indicatorId)
      setIndicator(Object.values(indicators[selectedIndicator.proficiency]).flat().find(i => i.indicator_id === indicatorId))
    }
  }

  const handleToggleChange = async (indicatorId, isChecked) => {
    
    const currentCompliance = compliances[indicatorId]?.compliance
    const newCompliance = !currentCompliance

    // Update local state
    setCompliances(prev => ({
      ...prev,
      [indicatorId]: { compliance: newCompliance }
    }))

    //Save the change to the server
    try {
      const response = await fetch(`/my-cga/compliances/${emp_id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': csrfToken,
        },
        body: JSON.stringify({ compliance: newCompliance, indicator_id: indicatorId }),
      })
      if (!response.ok) {

        toast({
          title: "Uh oh! Something went wrong.",
          description: "There was a problem updating your indicator compliance",
        })

        setCompliances(prev => ({
          ...prev,
          [indicatorId]: { compliance: currentCompliance } // Revert to previous state
        }))

      }else{
        
        toast({
          title: "Success!",
          description: "The indicator compliance has been updated successfully",
        })

        fetchCompetencies()

      }
    } catch (err) {
      console.log(err)
      toast({
        title: "Uh oh! Something went wrong.",
        description: "There was a problem updating your indicator compliance",
      })

      setCompliances(prev => ({
        ...prev,
        [indicatorId]: { compliance: currentCompliance }
      }))
    }
  }

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-12 gap-4 h-full">
      <div className="col-span-12 lg:col-span-4 flex flex-col gap-2">
        <div className="block lg:hidden">
            <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                    <Label htmlFor="indicator">Select Indicator:</Label>
                    <SingleComboBox 
                        items={indicatorSelections} 
                        onChange={(value => handleIndicatorSelectionClick(value))}
                        placeholder="Select indicator"
                        name="indicator"
                        id="indicator"
                        width="w-[460px]"
                        className="w-full"
                        value={activeIndicator}
                    />
                </div>
            </div>
        </div> 
        { !indicatorsLoading ? (
          <div className="lg:grid lg:grid-rows-[auto,1fr] hidden h-full">
            <HoverCard>
              <HoverCardTrigger asChild> 
                <Button variant="link" size="xs" className="flex justify-start font-semibold leading-normal text-wrap text-left text-sm tracking-tight p-0 mb-2">{competency.competency} {!all && `(${competency.proficiency})`}</Button>
              </HoverCardTrigger>
              <HoverCardContent className="text-xs mb-4 text-justify leading-normal">
                {competency.description}
              </HoverCardContent>
            </HoverCard>
            <div className="flex-1">
            <ScrollArea className="pr-4 h-full">
              <div className="h-auto lg:h-12">
              <div className="flex flex-col gap-4">
                {Object.keys(indicators).sort((a, b) => b - a).map((proficiency, index) => (
                  <div key={`proficiency-${proficiency}-${index}`}>
                    <h5 key={`h5-${proficiency}-${index}`} className={`text-xs font-semibold mb-2`}>Level {proficiency} Indicators</h5>
                    <ul key={`ul-${proficiency}-${index}`} className="border rounded-lg divide-y divide-gray-200">
                      {indicators[proficiency].map((indicator, index) => (
                        <li
                          key={`indicator-${indicator.indicator_id}-${index}`}
                          className={`px-4 py-2 hover:bg-[#B7E8FF] cursor-pointer flex flex-col ${
                            activeIndicator === indicator.indicator_id ? 'bg-muted hover:bg-muted font-semibold' : 'hover:bg-transparent hover:underline'
                        }`}
                        >
                          <div className="inline-flex items-center space-x-2 w-full">
                            <Switch 
                              key={`switch-${indicator.indicator_id}-${index}`}
                              checked={compliances[indicator.indicator_id]?.compliance || false}
                              onCheckedChange={(isChecked) => handleToggleChange(indicator.indicator_id, isChecked)}
                            />
                            <Link
                              preserveState
                              preserveScroll
                              className="text-xs hover:underline break-normal"
                              onClick={() => handleIndicatorClick(indicator.indicator_id, proficiency)}
                            >
                              {indicator.indicator}
                            </Link>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              </div>
            </ScrollArea>
            </div>
          </div>
        ) : (
          <IndicatorsLoading />
        )}
        
      </div>
      <div className="col-span-12 lg:col-span-8 h-full">
        { activeIndicator !== null ? (
            <Indicator emp_id={emp_id} indicator={indicator} handleToggleChange={handleToggleChange} compliance={compliances[indicator.indicator_id]?.compliance || false} />
        ) : (
            <div className="font-semibold text-muted-foreground text-sm flex justify-center items-center h-full">
                Please choose an indicator to view evidences.
            </div>
        )
        }
      </div>
    </div>
  )
}

export default Competency