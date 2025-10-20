import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatDate, formatDateRange, formatNumberWithCommas } from "@/lib/utils.jsx"
import Attachment from "@/components/Attachment"

const WorkExperienceFiles = ({req}) => {

  return (
    <TableRow>
        <TableCell colSpan={3} className="p-0">
            <div className="ml-8">
                <Table>
                    <TableHeader className="border-b">
                        <TableRow className="bg-muted text-xs">
                            <TableHead className="w-[40%] border-l uppercase font-semibold text-[13px]">
                                <div className="flex flex-col p-2">
                                    <span>(a) Dept/Agency/Office/Company</span>
                                    <span>(b) Position</span>
                                    <span>(c) Monthly Salary</span>
                                </div>
                            </TableHead>
                            <TableHead className="w-[20%] uppercase font-semibold text-[13px]">Duration</TableHead>
                            <TableHead className="w-[30%] uppercase font-semibold text-[13px]">Attachment</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                    {req.subItems.map((sub, i) => (
                        <TableRow key={i}>
                        <TableCell className="border-l font-medium">
                            <div className="flex flex-col">
                                <span>(a) {sub.agency}</span>
                                <span>(b) {sub.position}</span>
                                <span>(c) P{formatNumberWithCommas(sub.monthly_salary)}</span>
                            </div>
                        </TableCell>
                        <TableCell className="font-medium">
                        {formatDateRange(sub.from_date,sub.to_date)}
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

export default WorkExperienceFiles