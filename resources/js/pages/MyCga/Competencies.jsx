import { useState, useEffect, useCallback } from 'react'
import Competency from "@/pages/MyCga/Competency"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { useForm, Link } from '@inertiajs/react'

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

import { useToast } from "@/hooks/use-toast"

const Competencies = ({ emp_id, position_id, all, custom, career, setSelectedCareer, fetchCareers }) => {
    const [staffCompetencies, setStaffCompetencies] = useState([])
    const [competency, setCompetency] = useState(null)
    const [activeCompetency, setActiveCompetency] = useState(null)
    const [activeProficiency, setActiveProficiency] = useState(null)

    const { delete: destroy } =  useForm({
        position_id: position_id,
    })

    const { toast } = useToast()

    const fetchCompetencies = async () => {
        try {
            const url = all ? `/my-cga/competencies/${emp_id}?all=true` : `/my-cga/competencies/${emp_id}?position_id=${position_id}`

            const response = await fetch(url)
            if (!response.ok) {
                throw new Error('Network response was not ok')
            }
            const data = await response.json()

            setStaffCompetencies(data)
        } catch (err) {
          console.log(err)
        }
    }

    const handleCompetencyClick = (competencyId, proficiency) => {
        setActiveCompetency(competencyId)
        setActiveProficiency(proficiency)
        setCompetency(Object.values(staffCompetencies).flat().find(c => c.id === competencyId))
        localStorage.setItem('activeCompetency', competencyId)
    }

    useEffect(() => {
        fetchCompetencies()
        setActiveCompetency(null)
      }, [position_id, emp_id])

  const handleRemoveCompetencyClick = useCallback(
    async () => {
      destroy(`/my-cga/career-path/`, {
        preserveState: true,
        onSuccess: () => {
          toast({
            title: "Success!",
            description: "The career path has been deleted successfully",
          })
          
          fetchCareers()
          setSelectedCareer(null)

        },
        onError: (e) => {
          console.error(e)
        },
      })
    },
    [destroy, position_id, toast]
  )

    return (
        <div className="grid grid-cols-12 gap-4 h-full">
            <div className="col-span-3 h-full">
                <div className="grid grid-rows-[auto,1fr] h-full gap-2">
                    <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                            <h4 className="font-semibold leading-normal text-sm tracking-tight">
                                {all ? 'All Competencies' : 'Required Competencies for:'}
                            </h4>
                            <h5 className="font-medium text-sm">{position_id}</h5>
                        </div>

                        {career &&
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button size="sm" variant="outline" className="h-8 text-xs">
                                        Remove
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                                        <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete the career path.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleRemoveCompetencyClick}>Continue</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        }
                    </div>
                    <div className="flex-1">
                    <ScrollArea className="h-full pr-4">
                        <div className="h-12">
                        {Object.keys(staffCompetencies).map((type) => (
                            <div key={type}>
                                <div className="text-xs font-semibold mb-2 sticky top-0 z-20 bg-gray-100 p-2">{type}</div>
                                <div className="flex flex-col">
                                {staffCompetencies[type].map((competency) => (
                                    <a 
                                    key={competency.id} 
                                    className={`flex justify-between gap-4 flex-1 items-center rounded-md text-xs transition-colors disabled:pointer-events-none disabled:opacity-50 hover:text-accent-foreground h-9 px-4 py-2 ${ activeCompetency === competency.id ? 'bg-muted hover:bg-muted font-semibold' : 'hover:bg-transparent hover:underline font-medium'}`} 
                                    href="#"
                                    onClick={() => handleCompetencyClick(competency.id, competency.proficiency)}
                                    title={competency.competency}
                                    >
                                        <span className="break-words">{competency.competency} {!all && `(${competency.proficiency})`}</span>

                                        <span className="break-words">{competency.percentage}%</span>
                                    </a>
                                ))}
                                </div>
                            </div>
                        ))}
                        </div>
                    </ScrollArea>
                    </div>
                </div>
            </div>
            <div className="col-span-9 h-full">
                { activeCompetency !== null && position_id !== null ? (
                    <Competency position_id={position_id} competency={competency} fetchCompetencies={fetchCompetencies} all={all} custom={custom} proficiency={activeProficiency} />
                ) : (
                    <div className="font-semibold text-muted-foreground flex justify-center items-center h-full">
                        Please choose a competency to view its indicators.
                    </div>
                )
                }
            </div>
        </div>
    )
}

export default Competencies
