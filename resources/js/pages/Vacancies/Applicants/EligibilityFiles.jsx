import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatDate, } from "@/lib/utils.jsx"
import Attachment from "@/components/Attachment"

const EligibilityFiles = ({req}) => {

  return (
    <TableRow>
        <TableCell colSpan={3} className="p-0">
            <div className="ml-8">
                <Table>
                    <TableHeader className="border-b">
                        <TableRow className="bg-muted text-xs">
                            <TableHead className="w-[40%] border-l uppercase font-semibold text-[13px]">Career Service / RA 1080 (Board / Bar) Under Special Laws / CES / CSEE Barangay Eligibility / Driver's License</TableHead>
                            <TableHead className="w-[20%] uppercase font-semibold text-[13px]">Date of Examination<br/>/ Conferment</TableHead>
                            <TableHead className="w-[30%] uppercase font-semibold text-[13px]">Attachment</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                    {req.subItems.map((sub, i) => (
                        <TableRow key={i}>
                        <TableCell className="border-l font-medium">{sub.eligibility} ({sub.rating})</TableCell>
                        <TableCell className="font-medium">
                            {formatDate(sub.exam_date)}
                        </TableCell>
                        <TableCell>
                        {sub.files?.length > 0 ? (
                            <div className="flex flex-col gap-1">
                            {sub.files.map((file, fIndex) => (
                                <div
                                key={fIndex}
                                className="flex items-center justify-between"
                                >
                                <Attachment file={file} />
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

export default EligibilityFiles