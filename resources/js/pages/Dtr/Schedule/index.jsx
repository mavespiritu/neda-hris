import { Fragment, useState, useEffect, useRef } from "react"
import { usePage, router, useForm } from "@inertiajs/react"
import PageTitle from "@/components/PageTitle"
import { MonthYearPicker } from "@/components/MonthYearPicker"
import { format } from "date-fns"
import SingleComboBox from "@/components/SingleComboBox"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import MultipleUpdateForm from "./MultipleUpdateForm"

const breadcrumbItems = [
  { label: "Home", href: "/" },
  { label: "Flexiplace" },
  { label: "Schedule", href: "/fwa/schedule" },
]

const dtrOptions = [
  { value: "Onsite", label: "Onsite" },
  { value: "Flexiplace", label: "Flexiplace" },
  { value: "VL", label: "Vacation Leave (VL)" },
  { value: "SL", label: "Sick Leave (SL)" },
  { value: "FL", label: "Forced Leave (FL)" },
  { value: "OB", label: "Official Business (OB)" },
]

export default function Index() {
  const { toast } = useToast()
  const {
    auth,
    data: { employeesByDivision, fridays, month, employees },
  } = usePage().props 
  
  const isPublic = !auth || !auth.user

  const form = useForm({ emp_id: null, date: null, dtr_type: null })

  const current = new Date()
  const initialSelected = month
    ? (() => {
        const [year, mon] = month.split("-")
        return { month: Number(mon), year: Number(year) }
      })()
    : { month: current.getMonth() + 1, year: current.getFullYear() }

  const [selected, setSelected] = useState(initialSelected)
  const [loadedMonth, setLoadedMonth] = useState(initialSelected)
  const [localEmployees, setLocalEmployees] = useState(employeesByDivision)
  const [openDialog, setOpenDialog] = useState(false)
  const [currentDivision, setCurrentDivision] = useState(null)
  const [pendingUpdate, setPendingUpdate] = useState(null)
  const didMount = useRef(false)

  const fetchSchedules = (month, year) => {
    const monthStr = `${year}-${String(month).padStart(2, "0")}`
    router.get(
      route("fwa.schedule.index"),
      { month: monthStr },
      { preserveState: false, replace: true }
    )
    setLoadedMonth({ month, year })
  }

  useEffect(() => {
    if (
      selected.month &&
      selected.year &&
      (selected.month !== loadedMonth.month ||
        selected.year !== loadedMonth.year)
    ) {
      fetchSchedules(selected.month, selected.year)
      setLoadedMonth(selected)
    }
  }, [selected, loadedMonth])

  useEffect(() => {
    if (!pendingUpdate) return
    form.setData(pendingUpdate)
  }, [pendingUpdate])

  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true
      return
    }
    if (!pendingUpdate) return

    form.post(route("fwa.schedule.store"), {
      preserveState: true,
      preserveScroll: true,
      onSuccess: () =>
        toast({
          title: "Success",
          description: "Schedule updated successfully!",
        }),
      onError: () =>
        toast({
          title: "Error",
          description: "Failed to update schedule.",
        }),
      onFinish: () => setPendingUpdate(null),
    })
  }, [form.data])

  const handleDtrChange = (division, empIndex, date, value) => {
    setLocalEmployees((prev) => {
      const updatedDivision = [...prev[division]]
      updatedDivision[empIndex] = {
        ...updatedDivision[empIndex],
        [date]: value,
      }
      return { ...prev, [division]: updatedDivision }
    })

    setPendingUpdate({
      emp_id: localEmployees[division][empIndex].id,
      date,
      dtr_type: value,
    })
  }

  const calcRowTotals = (emp) => ({
    flexiplace: fridays.filter((d) => emp[d] === "Flexiplace").length,
    onsite: fridays.filter((d) => emp[d] === "Onsite").length,
  })

  const calcColumnTotals = (employees) => {
    const totals = fridays.map((date) => ({
      flexiplace: employees.filter((emp) => emp[date] === "Flexiplace").length,
      onsite: employees.filter((emp) => emp[date] === "Onsite").length,
    }))
    const totalFlexiplace = totals.reduce((acc, t) => acc + t.flexiplace, 0)
    const totalOnsite = totals.reduce((acc, t) => acc + t.onsite, 0)
    return { totals, totalFlexiplace, totalOnsite }
  }

  return (
    <div className="flex flex-col h-full gap-4">
      <PageTitle
        pageTitle="Flexiplace Schedule"
        description={`${isPublic ? 'View' : 'Manage'} the scheduling of flexiplace here.`}
        breadcrumbItems={isPublic ? [] : breadcrumbItems}
      />

      <div className="flex items-end justify-between">
        <div className="space-y-1">
          <Label>Select month and year:</Label>
          <MonthYearPicker
            value={selected}
            onChange={setSelected}
            startYear={current.getFullYear() - 5}
            endYear={current.getFullYear() + 5}
            placeholder="Select month & year"
          />
        </div>
        {!isPublic && (
          <Button size="sm" onClick={() => setOpenDialog(true)}>
            Multiple Update
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-6 w-full">
        {localEmployees &&
          Object.entries(localEmployees).map(([division, employees]) => {
            const { totals, totalFlexiplace, totalOnsite } =
              calcColumnTotals(employees)

            return (
              <Card key={division} className="border rounded-lg">
                <CardHeader>
                  <div className="flex items-center justify-between w-full">
                    <h2 className="font-semibold text-lg truncate">{division}</h2>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div
                    className="grid gap-0 w-full text-xs divide-y divide-border divide-solid"
                    style={{
                      gridTemplateColumns: `minmax(120px, 1fr) repeat(${fridays.length}, minmax(40px, 1fr)) 80px 80px`,
                    }}
                  >
                    {/* Header row */}
                    <div className="bg-muted font-semibold p-4">Employee</div>
                    {fridays.map((date) => (
                      <div
                        key={date}
                        className="bg-muted font-semibold text-center p-4 truncate"
                      >
                        {format(new Date(date), "MMM dd")}
                      </div>
                    ))}
                    <div className="bg-muted font-semibold text-center p-4">
                      Total Flexiplace
                    </div>
                    <div className="bg-muted font-semibold text-center p-4">
                      Total Onsite
                    </div>

                    {/* Employee rows */}
                    {employees.map((emp, empIndex) => {
                      const rowTotals = calcRowTotals(emp)
                      return (
                        <Fragment key={emp.id}>
                          <div className="truncate p-2 text-xs">{emp.name}</div>
                          {fridays.map((date) => (
                            <div key={date} className="p-1 text-center">
                              {isPublic ? (
                                <span>{emp[date] || "-"}</span>
                              ) : (
                                <SingleComboBox
                                  items={dtrOptions}
                                  value={emp[date] || ""}
                                  onChange={(val) =>
                                    handleDtrChange(division, empIndex, date, val)
                                  }
                                  placeholder="-"
                                  width="w-full"
                                />
                              )}
                            </div>
                          ))}
                          <div className="p-1 text-center font-semibold">
                            {rowTotals.flexiplace}
                          </div>
                          <div className="p-1 text-center font-semibold">
                            {rowTotals.onsite}
                          </div>
                        </Fragment>
                      )
                    })}

                    {/* Totals row */}
                    <div className="bg-muted font-semibold p-1">
                      Total Flexiplace
                    </div>
                    {totals.map((t, i) => (
                      <div
                        key={i}
                        className="bg-muted font-semibold p-1 text-center"
                      >
                        {t.flexiplace}
                      </div>
                    ))}
                    <div className="bg-muted font-semibold p-1 text-center">
                      {totalFlexiplace}
                    </div>
                    <div className="bg-muted font-semibold p-1"></div>

                    <div className="bg-muted font-semibold p-1">Total Onsite</div>
                    {totals.map((t, i) => (
                      <div
                        key={i}
                        className="bg-muted font-semibold p-1 text-center"
                      >
                        {t.onsite}
                      </div>
                    ))}
                    <div className="bg-muted font-semibold p-1"></div>
                    <div className="bg-muted font-semibold p-1 text-center">
                      {totalOnsite}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
      </div>

      {!isPublic && (
        <MultipleUpdateForm
          open={openDialog}
          onClose={() => setOpenDialog(false)}
          employees={employees}
          dates={fridays}
          onSaved={() => {
            fetchSchedules(selected.month, selected.year)
          }}
        />
      )}
    </div>
  )
}
