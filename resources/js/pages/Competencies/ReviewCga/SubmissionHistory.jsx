import { useEffect } from 'react'
import { store } from "./store"
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
import StatusBadge from '@/components/StatusBadge'
import { Button } from "@/components/ui/button"
import ActionForm from "./ActionForm"

const SubmissionHistory = ({submission}) => {

    const { 
        fetchSubmissionHistory,
        submissionHistory,
        openActionForm,
        closeActionForm,
        actionForm 
    } = store()

    useEffect(() => {
        if (!submission) return

        fetchSubmissionHistory({
            id: submission.id,
        })

    }, [submission])

  return (
    <div className="flex flex-col gap-4 border rounded-lg p-4">
        <div className="border rounded-lg">
            <Table className="text-xs">
                <TableHeader>
                    <TableRow>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="text-center">Acted By</TableHead>
                        <TableHead className="text-center">Date of Action</TableHead>
                        <TableHead className="w-[30%]">Remarks</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {submissionHistory.data.map((history, i) => (
                        <TableRow 
                            key={i}
                        >
                            <TableCell className="text-center">
                                <StatusBadge status={history.status} />
                            </TableCell>
                            <TableCell className="text-center">{history.name}</TableCell>
                            <TableCell className="text-center">{history.date_acted}</TableCell>
                            <TableCell className="">
                                <div dangerouslySetInnerHTML={{ __html: history.remarks }} />
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
                <TableFooter>
                    <TableRow>
                        <TableCell colSpan={4} align="right">
                            <Button 
                                type="button" 
                                onClick={() => openActionForm(submission)} 
                            >
                                Take Action
                            </Button>
                        </TableCell>
                    </TableRow>
                </TableFooter>
            </Table>
        </div>
        <ActionForm 
            submission={submission}
            open={actionForm.open} 
            onClose={() => {
                closeActionForm()
            }}
            onSuccess={(updatedStatus) => {
                fetchSubmissionHistory({ id: submission.id })
                submission.status = updatedStatus
            }} 
        />
    </div>
  )
}

export default SubmissionHistory