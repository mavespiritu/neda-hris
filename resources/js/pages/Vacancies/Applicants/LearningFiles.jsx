import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatDate, formatDateRange } from "@/lib/utils.jsx"
import Attachment from "@/components/Attachment"
import { getTimestamp } from "@/lib/utils.jsx"

const LearningFiles = ({req, applicant}) => {

  return (
    <TableRow>
        <TableCell colSpan={3} className="p-0">
            <div className="ml-8">
                <Table>
                    <TableHeader className="border-b">
                        <TableRow className="bg-muted text-xs">
                            <TableHead className="w-[40%] border-l uppercase font-semibold text-[13px]">Title of Learning and Development Interventions / Training Programs</TableHead>
                            <TableHead className="w-[20%] uppercase font-semibold text-[13px]">Date</TableHead>
                            <TableHead className="w-[30%] uppercase font-semibold text-[13px]">Attachment</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                    {req.subItems.map((sub, i) => (
                        <TableRow key={i}>
                        <TableCell className="border-l font-medium">{sub.seminar_title}</TableCell>
                        <TableCell className="font-medium">
                            {formatDateRange(sub.from_date, sub.to_date)}
                        </TableCell>
                        <TableCell>
                        {sub.files?.length > 0 ? (
                            <div className="flex flex-col gap-1">
                            {sub.files.map((file, fIndex) => (
                                <div
                                key={fIndex}
                                className="flex items-center justify-between"
                                >
                                <Attachment file={file} filename={`${applicant.lastname}_${applicant.firstname}_${applicant.middlename}_${req.requirement}_${sub.seminar_title}_${fIndex}_${getTimestamp()}`} />
                                </div>
                            ))}
                            </div>
                        ) : (
                            <span className="text-xs text-muted-foreground"></span>
                        )}
                        </TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
            </div>
        </TableCell>
    </TableRow>
  )
}

export default LearningFiles