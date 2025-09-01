import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { parse, format, isValid } from 'date-fns'

const CsForm = ({
  publication,
  vacancies,
  signatoryName,
  signatoryPosition,
  agencyAddress,
  requirements
}) => {

  const divisions = {
    DRD: 'Development Research, Communication, and Advocacy Division',
    FAD: 'Finance and Administrative Division',
    PMED: 'Monitoring and Evaluation Division',
    ORD: 'Office of the Regional Director',
    PFPD: 'Policy Formulation and Planning Division',
    PDIPBD: 'Project Development, Investment Programming and Budgeting Division',
  }

  const dateStr = publication.date_closed
  const timeStr = publication.time_closed

  const date = dateStr ? new Date(dateStr) : null
  const time = timeStr ? parse(timeStr, 'HH:mm:ss', new Date()) : null

  const formattedDate = date ? format(date, 'MMMM d, yyyy') : ''
  const formattedTime = time && isValid(time) ? format(time, 'hh:mm a') : ''
  const closingDate = formattedDate
  const closingTime = formattedTime ? ' ' + formattedTime : ''

  const closingDateTime = `${formattedDate}${formattedTime ? ' ' + formattedTime : ''}`

  return (
    <div className="flex flex-col gap-2 text-xxs leading-tight">
      <div className="flex justify-between">
        <div>
          <h3 className="italic text-[10px]">CS Form No. 9</h3>
          <span className="italic text-[10px]">Revised 2018</span>
        </div>
        <div className="border p-2 text-[10px] border-gray-700 italic">
          <span>
            Electronic copy to be submitted to the CSC FO must be in MS Excel
            format
          </span>
        </div>
      </div>

      <div className="flex flex-col items-center">
        <span className="text-[10px]">Republic of the Philippines</span>
        <span className="text-[10px] font-bold">
          DEPARTMENT OF ECONOMY, PLANNING, AND DEVELOPMENT
        </span>
        <span className="text-[10px]">
          Request for Publication of Vacant Positions
        </span>
      </div>

      <div className="flex flex-col gap-1 text-[10px]">
        <span>To: CIVIL SERVICE COMMMISSION (CSC)</span>
        <span className="pl-4">
          We hereby request the publication of the following vacant positions,
          which are authorized to be filled, at the DEPARTMENT OF ECONOMY,
          PLANNING, AND DEVELOPMENT in the CSC website:
        </span>
      </div>

      <div className="w-1/3 flex flex-col items-center text-[10px] ml-auto mt-2">
        <span className="font-bold uppercase">{signatoryName}</span>
        <div className="border-b border-black w-full" />
        <span className="font-bold">{signatoryPosition}</span>
      </div>

      <div className="w-1/3 flex justify-end text-[10px] gap-1 ml-auto">
        <span>Date:</span>
        <div className="flex flex-col w-full items-center">
          <span>{format(new Date(), 'MMMM d, yyyy')}</span>
          <div className="border-b border-black w-full" />
        </div>
      </div>

      <Table className="w-full border border-black border-collapse text-black text-[10px] leading-tight mb-4">
        <TableHeader>
          <TableRow className="border border-black text-center">
            <TableHead className="border border-black p-1 text-black text-center" rowSpan={2}>No.</TableHead>
            <TableHead className="border border-black p-1 text-black text-center" rowSpan={2}>
              <div className="flex flex-col items-center text-center text-black">
                <span>Position Title</span>
                <span className="font-semibold">(Parenthetical Title, if applicable)</span>
              </div>
            </TableHead>
            <TableHead className="border border-black p-1 text-black text-center" rowSpan={2}>Plantilla Item No.</TableHead>
            <TableHead className="border border-black p-1 text-black text-center" rowSpan={2}>Salary Job/Pay Grade</TableHead>
            <TableHead style={{ width: '8%' }} className="border border-black p-1 font-semibold text-black text-center" rowSpan={2}>Monthly Salary</TableHead>
            <TableHead className="border border-black p-1 text-black text-center" colSpan={5}>Qualification Standards</TableHead>
            <TableHead className="border border-black p-1 text-black text-center" rowSpan={2}>Place of Assignment</TableHead>
          </TableRow>
          <TableRow className="border border-black text-center">
            <TableHead style={{ width: '10%' }} className="border border-black p-1 text-black text-center">Education</TableHead>
            <TableHead style={{ width: '10%' }} className="border border-black p-1 text-black text-center">Training</TableHead>
            <TableHead style={{ width: '10%' }} className="border border-black p-1 text-black text-center">Experience</TableHead>
            <TableHead style={{ width: '10%' }} className="border border-black p-1 text-black text-center">Eligibility</TableHead>
            <TableHead style={{ width: '30%' }} className="border border-black p-1 text-black text-center">Competency (if applicable)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {vacancies.length > 0 ? (
            vacancies.map((vacancy, index) => (
              <TableRow key={vacancy.id} className="text-center">
                <TableCell className="border border-black p-1 text-center">{index + 1}</TableCell>
                <TableCell className="border border-black p-1 text-left">{vacancy.positionTitle}</TableCell>
                <TableCell className="border border-black p-1 text-center">{vacancy.item_no}</TableCell>
                <TableCell className="border border-black p-1 text-center">{vacancy.sg}</TableCell>
                <TableCell className="border border-black p-1 text-right">
                  <span>
                    {vacancy.monthly_salary 
                      ? new Intl.NumberFormat('en-PH', { style: 'decimal', minimumFractionDigits: 2 }).format(vacancy.monthly_salary) 
                      : 'N/A'}
                  </span>
                </TableCell>
                <TableCell className="border border-black p-1 text-center">
                  <div dangerouslySetInnerHTML={{ __html: vacancy.prescribed_education }} />
                </TableCell>
                <TableCell className="border border-black p-1 text-center">
                  <div dangerouslySetInnerHTML={{ __html: vacancy.prescribed_training }} />
                </TableCell>
                <TableCell className="border border-black p-1 text-center">
                  <div dangerouslySetInnerHTML={{ __html: vacancy.prescribed_experience }} />
                </TableCell>
                <TableCell className="border border-black p-1 text-center">
                  <div dangerouslySetInnerHTML={{ __html: vacancy.prescribed_eligibility }} />
                </TableCell>
                <TableCell className="border border-black p-1 text-left align-top">
                  <div className="space-y-0.5">
                    {vacancy.competencies && (
                      <>
                        {vacancy.competencies.organizational.length > 0 && (
                          <div>
                            <span className="font-semibold">Organizational:</span>
                            <ul className="list-none pl-3">
                              {vacancy.competencies.organizational.map((comp) => (
                                <li key={`org-${comp.id}`}>- {comp.competency} (Level {comp.level});</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {vacancy.competencies.leadership.length > 0 && (
                          <div>
                            <span className="font-semibold">Leadership:</span>
                            <ul className="list-none pl-3">
                              {vacancy.competencies.leadership.map((comp) => (
                                <li key={`lead-${comp.id}`}>- {comp.competency} (Level {comp.level});</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {vacancy.competencies.functional.length > 0 && (
                          <div>
                            <span className="font-semibold">Functional:</span>
                            <ul className="list-none pl-3">
                              {vacancy.competencies.functional.map((comp) => (
                                <li key={`func-${comp.id}`}>- {comp.competency} (Level {comp.level});</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </TableCell>
                <TableCell className="border border-black p-1 text-center">
                  {divisions[vacancy.division] || vacancy.division} DEPDev RO1
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={11} className="text-center py-4">
                No vacancies found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <p>Interested and qualified applicants should signify their interest in writing. Attach the following documents to the application letter and send to the address below not later than {closingDateTime}.</p>

      {Array.isArray(requirements) && requirements.length > 0 && (
        <ol className="list-decimal list-inside my-2">
          {requirements.map((req, index) => (
            <li key={index}>{req}</li>
          ))}
        </ol>
      )}

      <p><span className="font-bold">QUALIFIED APPLICANTS</span> are advised to send their applications to/or through the link below:</p>
      
      <div className="w-1/4 flex flex-col items-center text-[10px] mt-1">
        <span className="font-bold uppercase">{signatoryName}</span>
        <div className="border-b border-black w-full" />
        <span>{signatoryPosition}</span>
        <div className="border-b border-black w-full" />
        <span>DEPDev RO1, {agencyAddress}</span>
        <div className="border-b border-black w-full" />
        <span className="min-h-[0.75rem]"></span>
        <div className="border-b border-black w-full" />
      </div>
      <span className="font-bold">APPLICATIONS WITH INCOMPLETE DOCUMENTS SHALL NOT BE ENTERTAINED.</span>
    </div>
  )
}

export default CsForm
