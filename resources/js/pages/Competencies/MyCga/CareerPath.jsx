import { useState, useEffect } from 'react'
import { usePage } from '@inertiajs/react'
import { store } from './store'
import Competency from './Competency'
import Indicator from './Indicator'
import CareerPathForm from './CareerPathForm'
import CompetenciesLoading from "@/components/skeletons/CompetenciesLoading"
import { Input } from "@/components/ui/input"
import SingleComboBox from "@/components/SingleComboBox"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

import { Search } from 'lucide-react'

const CareerPath = () => {

    const { toast } = useToast()

    const [searchCompetency, setSearchCompetency] = useState("")

    const {
        competencies,
        selectedCompetency,
        selectedIndicator,
        fetchCompetencies,
        selectedStaff,
        setSelectedCompetency,
        setSelectedIndicator,
        careerPaths,
        fetchCareerPaths,
        selectedCareerPath,
        setSelectedCareerPath,
        resetCompetencies,
        isCareerPathFormOpen,
        openCareerPathForm,
        closeCareerPathForm,
        deleteCareerPath,
    } = store()

    const { item_no, value: emp_id } = selectedStaff ?? {}

    useEffect(() => {
            fetchCareerPaths({id: emp_id})
            setSelectedIndicator({})
        }, [item_no, emp_id])

    useEffect(() => {
        if(selectedCareerPath) {
            fetchCompetencies({
              id: selectedCareerPath.emp_id, 
              filters: { 
                item_no: selectedCareerPath.item_no,
                grouped: true  
              }})
        }
    }, [selectedCareerPath])

    useEffect(() => {
        resetCompetencies()
    }, [])
  
  return (
    <div className="flex flex-col flex-grow gap-4">
      <div>
          <h3 className="font-bold text-lg">Career Path</h3>
          <p className="text-muted-foreground text-sm">Update your career path positions' required competencies and indicators here.</p>
      </div>
      <div className="flex flex-col border rounded-lg p-4">
        <h4 className="leading-normal text-sm">Required Competencies for:</h4>
        <div className="flex flex-col md:flex-row gap-4">
            <div> 
                <SingleComboBox 
                items={careerPaths?.data ?? []}
                loading={careerPaths.isLoading}
                onChange={(value) => {
                    if (!value) {
                    setSelectedCareerPath(null)
                    resetCompetencies()
                    setSelectedCompetency({})
                    setSelectedIndicator({})
                    return
                    }

                    const found = careerPaths?.data?.find(item => item.value === value)
                    setSelectedCareerPath(found ?? null)
                }}
                value={selectedCareerPath?.value ?? null}
                placeholder="Choose career path"
                name="career path"
                id="careerPath"
                className="w-full mb-4"
                />
            </div>
            <Button variant="outline" onClick={openCareerPathForm}>Add Career Path</Button>
            {selectedCareerPath && 
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive">
                            Remove this 
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Confirm Removal</AlertDialogTitle>
                            <AlertDialogDescription>
                            This action cannot be undone. This will permanently remove selected position on your  career path list.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel className="border-0">Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                                className="bg-destructive text-white hover:bg-destructive/90"
                                onClick={() => deleteCareerPath({toast})}
                            >Yes, remove it</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            }
            <CareerPathForm 
                open={isCareerPathFormOpen} 
                onClose={() => {
                    closeCareerPathForm()
                }} 
            />
        </div>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="w-full md:w-[30%]">
            {selectedCareerPath && (
                <div>
                    <h4 className="leading-normal text-sm">Career Path Details:</h4>
                    <h5 className="font-semibold">{selectedCareerPath.position}</h5>
                    <h5 className="font-medium text-sm">{selectedCareerPath.item_no}</h5>
                    <h5 className="text-sm font-medium">Division: {selectedCareerPath.division_id}</h5>
                </div>
            )}
            {competencies.data && Object.keys(competencies.data).length > 0 && (
                <div className="relative my-4">
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
            )}
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
                        <Competency emp_id={selectedCareerPath?.emp_id} item_no={selectedCareerPath?.item_no} />
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </div>
              ))}
            </Accordion>) : <CompetenciesLoading /> }
          </div>
          <div className="w-full md:w-[70%] py-4">
            { Object.keys(selectedIndicator).length > 0 && <Indicator emp_id={selectedCareerPath?.emp_id} item_no={selectedCareerPath?.item_no} />}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CareerPath