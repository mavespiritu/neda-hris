import { useState, useEffect } from 'react'
import { store } from "./store"
import StatusBadge from '@/components/StatusBadge'
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2 } from "lucide-react"
import axios from "axios"
import { formatDate } from '@/lib/utils.jsx'

const Summary = () => {
  const [employees, setEmployees] = useState([])
  const [years, setYears] = useState([])
  const [loading, setLoading] = useState(true)

  const { setSelectedSubmission } = store()

  useEffect(() => {
    setLoading(true)
    axios
      .get(route("cga.review.summary"))
      .then((res) => {
        setEmployees(res.data.employees)
        setYears(res.data.years)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const employeesByDivision = employees.reduce((acc, emp) => {
    if (!acc[emp.division]) acc[emp.division] = []
    acc[emp.division].push(emp)
    return acc
  }, {})

  return (
    <Card className="border rounded-lg h-full p-4 space-y-4">
      <div>
        <h3 className="font-bold text-lg">Submission Summary</h3>
        <p className="text-muted-foreground text-sm">
          View the submission status of each staff.
        </p>
      </div>

      <div className="overflow-x-auto">
        <div className="border rounded-lg relative">
          {loading && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
              <Loader2 className="h-6 w-6 animate-spin text-white" />
            </div>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Division</TableHead>
                <TableHead>Name</TableHead>
                {years.map((year) => (
                  <TableHead key={year}>{year}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(employeesByDivision).map(([division, divisionEmployees]) => (
                <>
                  {/* Division Row */}
                  <TableRow key={`division-${division}`} className="bg-muted">
                    <TableCell colSpan={2 + years.length} className="font-bold">
                      {division}
                    </TableCell>
                  </TableRow>

                  {/* Employees */}
                  {divisionEmployees.map((emp) => (
                    <TableRow key={emp.emp_id}>
                      <TableCell /> {/* Division placeholder */}
                      <TableCell>{emp.name}</TableCell>
                      {years.map((year) => {
                        const submission = emp.submissions?.[year]
                        return (
                          <TableCell
                            key={`${emp.emp_id}-${year}`}
                            className={submission ? "cursor-pointer hover:bg-muted/50" : ""}
                            onClick={() => submission && setSelectedSubmission(submission)}
                          >
                            {submission ? (
                              <div className="flex flex-col gap-1">
                                <StatusBadge status={submission.status} />
                                {submission.status && (
                                  <span className="text-xs text-muted-foreground">
                                    {formatDate(submission.date_created)}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </TableCell>
                        )
                      })}
                    </TableRow>
                  ))}
                </>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </Card>
  )
}

export default Summary
