import PageTitle from "@/components/PageTitle"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from 'react'
import { useToast } from "@/hooks/use-toast"
import { 
    Plus,
    ChevronLeft
} from 'lucide-react'
import { usePage } from '@inertiajs/react'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const classifications = [
  "Executive",
  "Middle Management",
  "Professional & Supervisory & Technical",
  "Clerical & General Staff",
]

const InfoRow = ({ label, value }) => (
  <div className="grid grid-cols-[40%_60%] gap-y-2">
    <div className="text-sm text-muted-foreground">{label}</div>
    <div
      className="prose prose-sm max-w-none text-sm font-medium
        [&_.my-bullet-list]:list-disc [&_.my-bullet-list]:pl-6
        [&_.my-ordered-list]:list-decimal [&_.my-ordered-list]:pl-6
        [&_.my-list-item]:ml-4"
      dangerouslySetInnerHTML={{ __html: value }}
    />
  </div>
)

const VacancyClassification = ({ classification }) => (
  <div className="grid grid-cols-[40%_60%] gap-y-2">
    <div className="text-sm text-muted-foreground">Classification:</div>
    <div className="text-sm font-medium flex flex-wrap gap-2">
      {classifications.map((label) => (
        <div key={label} className="flex items-center gap-2 whitespace-nowrap">
          <span>{label}</span>
          <span className="w-4 h-4 inline-flex items-center justify-center text-xs">
            {label === classification ? "( X )" : "( )"}
          </span>
          
        </div>
      ))}
    </div>
  </div>
)

const VacancyInfo = () => {

  const { vacancy, competencies } = usePage().props

  const compTypeHeaders = {
    org: "Organizational",
    lead: "Leadership / Managerial",
    func: "Technical / Functional"
  }

  return (
    <div className="flex flex-col gap-4">
      <PageTitle
          pageTitle="Vacancy Details"
          description="You can find all the details about this vacancy here."
      />
      <div className="flex flex-col gap-4 border rounded-lg p-4 mx-4">
        <h3 className="font-bold text-lg">
          {vacancy.appointment_status === 'Permanent'
            ? 'Competency-Based Job Description'
            : 'Job Description'}
        </h3>
        <section className="space-y-3">
          <InfoRow label="Reference No:" value={vacancy.reference_no} />
          <InfoRow label="Publication Type:" value={vacancy.type} />
          <InfoRow label="Status of Appointment:" value={vacancy.appointment_status} />
          <InfoRow label="Position Title:" value={vacancy.position_description} />
          <InfoRow label="Salary Grade:" value={vacancy.sg} />
          {vacancy.appointment_status === 'Permanent' && (
            <InfoRow label="Item Number:" value={vacancy.item_no} />
          )}
          <InfoRow label="Area of Assignment:" value={vacancy.division} />
          {vacancy.appointment_status === 'Permanent' && (
            <InfoRow label="Reports to:" value={vacancy.reports_to} />
          )}
          {vacancy.appointment_status === 'Permanent' && (
            <InfoRow label="Positions Supervised:" value={vacancy.positions_supervised} />
          )}
          {vacancy.appointment_status === 'Permanent' && (
            <VacancyClassification classification={vacancy.classification} />
          )}
        </section>
        <h4 className="font-bold">A. Qualification Guide</h4>
        {vacancy.appointment_status === 'Permanent' && (
          <>
            <span className="font-medium text-sm">CSC-Prescribed QS</span>
            <section className="space-y-3">
              <InfoRow label="Education:" value={vacancy.prescribed_education} />
              <InfoRow label="Experience:" value={vacancy.prescribed_experience} />
              <InfoRow label="Training:" value={vacancy.prescribed_training} />
              <InfoRow label="Eligibility:" value={vacancy.prescribed_eligibility} />
            </section>
          </>    
        )}
        
        <span className="font-medium text-sm">Preferred Qualifications</span>
        <section className="space-y-3">
          <InfoRow label="Education:" value={vacancy.preferred_education} />
          <InfoRow label="Experience:" value={vacancy.preferred_experience} />
          <InfoRow label="Training:" value={vacancy.preferred_training} />
          <InfoRow label="Eligibility:" value={vacancy.preferred_eligibility} />
          <InfoRow label="DEPDev Pre-employment Exam:" value={vacancy.examination} />
        </section>
        <h4 className="font-bold">B. Job Summary</h4>
        <div className="border rounded-lg p-4">
          <div
            className="prose prose-sm max-w-none text-sm font-medium
              [&_.my-bullet-list]:list-disc [&_.my-bullet-list]:pl-6
              [&_.my-ordered-list]:list-decimal [&_.my-ordered-list]:pl-6
              [&_.my-list-item]:ml-4"
            dangerouslySetInnerHTML={{ __html: vacancy.summary }}
          />
        </div>
        <h4 className="font-bold">C. Job Output</h4>
        <div className="border rounded-lg p-4">
          <div
            className="prose prose-sm max-w-none text-sm font-medium
              [&_.my-bullet-list]:list-disc [&_.my-bullet-list]:pl-6
              [&_.my-ordered-list]:list-decimal [&_.my-ordered-list]:pl-6
              [&_.my-list-item]:ml-4"
            dangerouslySetInnerHTML={{ __html: vacancy.output }}
          />
        </div>
        <h4 className="font-bold">D. Duties and Responsibilities</h4>
        <div className="border rounded-lg p-4">
          <div
            className="prose prose-sm max-w-none text-sm font-medium
              [&_.my-bullet-list]:list-disc [&_.my-bullet-list]:pl-6
              [&_.my-ordered-list]:list-decimal [&_.my-ordered-list]:pl-6
              [&_.my-list-item]:ml-4"
            dangerouslySetInnerHTML={{ __html: vacancy.responsibility }}
          />
        </div>
        {vacancy.appointment_status === 'Permanent' && (
          <>
            <h4 className="font-bold">E. Competency Requirements</h4>
            <div className="flex flex-col gap-4"> 
              {Object.entries(compTypeHeaders).map(([type, header]) => {
                const filtered = competencies.filter(c => c.comp_type === type)

                return (
                  <div key={type} className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 w-[50%]">{header}</TableHead>
                          <TableHead className="bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700">Level</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filtered.length > 0 ? (
                          filtered.map((c) => (
                            <TableRow key={c.value}>
                              <TableCell className="px-4 py-2 text-sm font-medium w-[50%]">{c.competency}</TableCell>
                              <TableCell className="px-4 py-2 text-sm font-medium">{c.level}</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={2} className="px-4 py-2 italic text-muted-foreground text-sm text-center font-medium">
                              No competencies available.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )
              })}
            </div>  
          </>
        )}
        <h4 className="font-bold">Additional Remarks</h4>
        <div className="border rounded-lg p-4">
          <div
            className="prose prose-sm max-w-none text-sm font-medium
              [&_.my-bullet-list]:list-disc [&_.my-bullet-list]:pl-6
              [&_.my-ordered-list]:list-decimal [&_.my-ordered-list]:pl-6
              [&_.my-list-item]:ml-4"
            dangerouslySetInnerHTML={{ __html: vacancy.remarks }}
          />
        </div>
      </div>
    </div>
  )
}

export default VacancyInfo