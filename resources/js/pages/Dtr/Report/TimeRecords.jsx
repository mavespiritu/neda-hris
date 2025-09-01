import { useState, useEffect } from "react"
import { useForm, router } from '@inertiajs/react'
import { Loader2 } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import DatePicker from "@/components/DatePicker"

const TimeRecords = () => {
  const { data, setData } = useForm({
    date: new Date().toISOString().slice(0, 10),
    timeRecords: []
  })
  const [loading, setLoading] = useState(false)

  const fetchTimeRecords = async (date) => {
    setLoading(true)
    try {
      const res = await fetch(route('fwa.reports.time-records', { date }))
      const json = await res.json()
      setData("timeRecords", json.data.timeRecords || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateReport = () => {
    const url = route('fwa.reports.time-records.export', { date: data.date })
    window.open(url, '_blank')
  }

  // Fetch on mount and whenever date changes
  useEffect(() => {
    fetchTimeRecords(data.date)
  }, [data.date])

  return (
    <div>
      <Card className="flex flex-col h-full">
        <CardHeader className="space-y-2 pb-4">
          <CardTitle className="text-lg">Time Records</CardTitle>
          <CardDescription className="text-sm">
            Apply filters available and generate reports
          </CardDescription>
        </CardHeader>

        <CardContent className="flex-1 overflow-auto border-t p-4 relative">
          <div className="space-y-4">
          {/* Date filter + Button */}
            <div className="flex items-end justify-between mb-4">
              {/* Date Picker */}
              <div className="w-[200px] flex flex-col gap-1">
                <Label>Select date</Label>
                <DatePicker
                  value={data.date}
                  onDateChange={(date) => setData("date", date)}
                  placeholder="Select date"
                />
              </div>

              {/* Generate Report Button */}
              <Button
                className="ml-4"
                onClick={handleGenerateReport}
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Generate Report
              </Button>
            </div>
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="animate-spin w-4 h-4 text-gray-500" />
            </div>
          ) : data.timeRecords.length === 0 ? (
            <p className="text-center text-sm">No records found</p>
          ) : (
            <div className="border rounded-lg overflow-auto">
              <table className="min-w-full text-left border-collapse">
                <thead className="bg-gray-100">
                  <tr>
                    <th rowSpan={2} className="border-t-0 border-l-0 px-4 py-2 text-sm font-medium text-gray-700 border-gray-200 border">Division</th>
                    <th rowSpan={2} className="border-t-0 px-4 py-2 text-sm font-medium text-gray-700 border-gray-200 border">Name of Personnel</th>
                    <th colSpan={2} className="border-t-0 px-4 py-2 text-sm font-medium text-gray-700 border-gray-200 border text-center">Actual AM</th>
                    <th colSpan={2} className="border-t-0 px-4 py-2 text-sm font-medium text-gray-700 border-gray-200 border text-center">Actual PM</th>
                    <th rowSpan={2} className="border-t-0 border-r-0 px-4 py-2 text-sm font-medium text-gray-700 border-gray-200 border">Total Hours Rendered</th>
                  </tr>
                  <tr>
                    <th className="px-4 py-2 text-sm font-medium text-gray-700 border-gray-200 border">Time In</th>
                    <th className="px-4 py-2 text-sm font-medium text-gray-700 border-gray-200 border">Time Out</th>
                    <th className="px-4 py-2 text-sm font-medium text-gray-700 border-gray-200 border">Time In</th>
                    <th className="px-4 py-2 text-sm font-medium text-gray-700 border-gray-200 border">Time Out</th>
                  </tr>
                </thead>
                <tbody>
                  {data.timeRecords.map((r, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-gray-50 text-sm"
                    >
                      <td
                        className={`px-4 py-2 border-l-0 border-gray-200 border ${
                          idx === data.timeRecords.length - 1 ? "border-b-0" : ""
                        }`}
                      >
                        {r.division}
                      </td>
                      <td
                        className={`px-4 py-2 border-gray-200 border ${
                          idx === data.timeRecords.length - 1 ? "border-b-0" : ""
                        }`}
                      >
                        {r.name}
                      </td>
                      <td
                        className={`px-4 py-2 border-gray-200 border ${
                          idx === data.timeRecords.length - 1 ? "border-b-0" : ""
                        }`}
                      >
                        {r.am_time_in || "-"}
                      </td>
                      <td
                        className={`px-4 py-2 border-gray-200 border ${
                          idx === data.timeRecords.length - 1 ? "border-b-0" : ""
                        }`}
                      >
                        {r.am_time_out || "-"}
                      </td>
                      <td
                        className={`px-4 py-2 border-gray-200 border ${
                          idx === data.timeRecords.length - 1 ? "border-b-0" : ""
                        }`}
                      >
                        {r.pm_time_in || "-"}
                      </td>
                      <td
                        className={`px-4 py-2 border-gray-200 border ${
                          idx === data.timeRecords.length - 1 ? "border-b-0" : ""
                        }`}
                      >
                        {r.pm_time_out || "-"}
                      </td>
                      <td
                        className={`px-4 py-2 border-r-0 border-gray-200 border ${
                          idx === data.timeRecords.length - 1 ? "border-b-0" : ""
                        }`}
                      >
                        {r.total_hours || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default TimeRecords
