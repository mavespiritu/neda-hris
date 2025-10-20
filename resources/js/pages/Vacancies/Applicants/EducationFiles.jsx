import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import Attachment from "@/components/Attachment"


const EducationFiles = ({req}) => {

  return (
    <TableRow>
        <TableCell colSpan={3} className="p-0">
            <div className="ml-8">
                <Table>
                    <TableHeader className="border-b">
                        <TableRow className="bg-muted text-xs">
                            <TableHead className="w-[40%] border-l uppercase font-semibold text-[13px]">
                                <div className="flex flex-col p-2">
                                    <span>(a) Level</span>
                                    <span>(b) Name of School</span>
                                    <span>(c) Basic Education/Degree/Course</span>
                                </div>
                            </TableHead>
                            <TableHead className="w-[20%] uppercase font-semibold text-[13px]">Year Graduated</TableHead>
                            <TableHead className="w-[30%] uppercase font-semibold text-[13px]">Attachment</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                    {req.subItems.map((sub, i) => (
                        <TableRow key={i}>
                        <TableCell className="border-l">
                            <div className="flex flex-col font-medium">
                                <span>(a) {sub.level}</span>
                                <span>(b) {sub.school}</span>
                                <span>(c) {sub.course}</span>
                            </div>
                        </TableCell>
                        <TableCell className="font-medium">
                        {sub.year_graduated}
                        </TableCell>
                        <TableCell>
                        {sub.files?.length > 0 ? (
                            <div className="flex flex-col gap-2">
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

export default EducationFiles