import { useState, useEffect } from 'react'
import { Switch } from "@/components/ui/switch"
import Indicator from "@/pages/MyCga/Indicator"
import ComponentLoading from "@/components/ComponentLoading"
import { useToast } from "@/hooks/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"

const Competency = ({ competency, fetchCompetencies, all, custom, proficiency }) => {

  const { toast } = useToast()

  const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content')

  const [activeIndicator, setActiveIndicator] = useState(null)
  const [indicator, setIndicator] = useState(null)
  const [indicators, setIndicators] = useState([])
  const [compliances, setCompliances] = useState([])
  const [indicatorsLoading, setIndicatorsLoading] = useState(true)
  const [indicatorsError, setIndicatorsError] = useState(null)

  const fetchIndicators = async () => {
    try {
        let url = ''

        if(all){
          url = `/my-cga/competency/${competency.id}?all=true`
        }else if(custom){
          url = `/my-cga/competency/${competency.id}?custom=true&proficiency=${proficiency}`
        }else{
          url = `/my-cga/competency/${competency.id}`
        }

        const response = await fetch(url)
        if (!response.ok) {
            throw new Error('Network response was not ok')
        }

        const data = await response.json()
        
        const sortedData = Object.keys(data)
          .map(proficiency => parseInt(proficiency))
          .sort((a, b) => b - a)
          .reduce((acc, proficiency) => {
              acc[parseInt(proficiency)] = data[proficiency]
              return acc
          }, {})

        setIndicators(sortedData)
    } catch (err) {
      setIndicatorsError(err.message)
    } finally {
      setIndicatorsLoading(false)
    }
  }

  const fetchCompliances = async () => {
    try {
        
        let url = ''

        if(all){
          url = `/my-cga/compliances/${competency.id}?all=true`
        }else if(custom){
          url = `/my-cga/compliances/${competency.id}?custom=true&proficiency=${proficiency}`
        }else{
          url = `/my-cga/compliances/${competency.id}`
        }

        const response = await fetch(url)
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
      const response = await fetch(`/my-cga/compliances/${indicatorId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': csrfToken,
        },
        body: JSON.stringify({ compliance: newCompliance }),
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
        [indicatorId]: { compliance: currentCompliance } // Revert to previous state
      }))
    }
  }

  return (
    <div className="grid grid-cols-12 gap-4 h-full">
      <div className="col-span-4 h-full"> 
        { !indicatorsLoading ? (
          <div className="grid grid-rows-[auto,1fr] h-full">
            <div className={`flex flex-col ${all ? 'mb-2' : ''}`}>
              <h4 className="font-semibold leading-normal text-sm tracking-tight">
                {competency.competency}
              </h4>
              {!all && (
                <p className="text-xs mb-2 text-justify leading-normal">Required Level: {competency.proficiency}</p>
              )}
            </div>
            <div className="flex-1">
            <ScrollArea className="pr-4 h-full">
              <div className="h-12">
              <p className="text-xs mb-4 text-justify leading-normal">{competency.description}</p>  
              <div className="flex flex-col gap-4">
                {Object.keys(indicators).sort((a, b) => b - a).map((proficiency, index) => (
                  <div key={`proficiency-${proficiency}-${index}`}>
                    <h5 key={`h5-${proficiency}-${index}`} className="text-xs font-semibold mb-2">LEVEL {proficiency} INDICATORS</h5>
                    <ul key={`ul-${proficiency}-${index}`} className="border rounded-lg divide-y divide-gray-200">
                      {indicators[proficiency].map((indicator, index) => (
                        <li
                          key={`indicator-${indicator.indicator_id}-${index}`}
                          className={`px-4 py-2 hover:bg-[#B7E8FF] cursor-pointer flex flex-col ${
                            activeIndicator === indicator.indicator_id ? 'bg-muted hover:bg-muted font-medium' : 'hover:bg-transparent hover:underline'
                        }`}
                        >
                          <div className="inline-flex items-center space-x-2 w-full">
                            <Switch 
                              key={`switch-${indicator.indicator_id}-${index}`}
                              checked={compliances[indicator.indicator_id]?.compliance || false}
                              onCheckedChange={(isChecked) => handleToggleChange(indicator.indicator_id, isChecked)}
                            />
                            <a
                              href="#"
                              className="text-xs hover:underline break-normal"
                              onClick={() => handleIndicatorClick(indicator.indicator_id, proficiency)}
                            >
                              {indicator.indicator}
                            </a>
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
          <ComponentLoading />
        )}
        
      </div>
      <div className="col-span-8 h-full">
        { activeIndicator !== null ? (
            <Indicator indicator={indicator} />
        ) : (
            <div className="font-semibold text-muted-foreground flex justify-center items-center h-full">
                Please choose an indicator to view evidences.
            </div>
        )
        }
      </div>
    </div>
  )
}

export default Competency