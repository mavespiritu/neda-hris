import { useState, useEffect, useMemo } from 'react'
import { store } from './store'
import SubmittedCompetency from "./SubmittedCompetency"
import { AlertCircle } from "lucide-react"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const SubmissionCompetencies = () => {

  const {
      selectedSubmission,
      fetchSubmittedCompetencies,
      submittedCompetencies,
      setSelectedSubmittedCompetencies,
      selectedSubmittedCompetencies,
  } = store()

  useEffect(() => {
      if (!selectedSubmission?.id) return

      fetchSubmittedCompetencies({
          id: selectedSubmission.id,
      })

  }, [selectedSubmission.id])

  return (
    <div className="border rounded-lg p-4">
      <p className="flex items-center gap-2 text-sm text-red-500">
        <AlertCircle className="h-4 w-4" />
        Note: Highlighted rows are competencies and indicators with changes from previous approved submitted competency gap analysis.
      </p>
      <Accordion
        type="single"
        collapsible
        className="w-full flex flex-col gap-4"
      >
        {submittedCompetencies.data && Object.keys(submittedCompetencies.data).map((proficiency, idx) => (
          <div key={proficiency}>
            <div className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-2 mt-4">
              {proficiency}
            </div>
            {submittedCompetencies.data[proficiency]
              .map((competency) => (
              <AccordionItem 
                value={`${proficiency}-${competency.id}`} 
                key={competency.id}
                onClick={() => setSelectedSubmittedCompetencies(competency)}
                className="mb-1"
              >
                <AccordionTrigger 
                  className={`
                    w-full
                    flex flex-row items-center gap-2
                    rounded-md transition-colors 
                    disabled:pointer-events-none disabled:opacity-50 
                    hover:text-accent-foreground p-2 text-sm
                    ${selectedSubmittedCompetencies?.id === competency.id && `font-bold`}
                    ${competency?.isUpdated === 1 && `bg-red-200`}
                    `}
                  title={competency.competency}
                >
                  <span className="w-3/4 md:w-4/5 break-words text-left">
                    {competency.competency} (Level {competency.proficiency})
                  </span>
                  <span className="w-1/4 md:w-1/5 text-right">
                    {competency.percentage}%
                  </span>
                </AccordionTrigger>
                <AccordionContent className="flex flex-col gap-4 text-balance">
                  {selectedSubmittedCompetencies && <SubmittedCompetency emp_id={selectedSubmittedCompetencies.emp_id} item_no={selectedSubmittedCompetencies.position_id} />}
                </AccordionContent>
              </AccordionItem>
            ))}
          </div>
        ))}
      </Accordion>
    </div>
  )
}

export default SubmissionCompetencies