import { useEffect, useMemo, useState } from "react"
import { useForm, router } from "@inertiajs/react"
import { Button } from "@/components/ui/button"
import SingleComboBox from "@/components/SingleComboBox"
import AmountInput from "@/components/AmountInput"
import { Trash2, Plus, Pencil } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import StatusInfoBox from "@/components/StatusInfoBox"

import {
  Table,
  TableBody,
  TableCell,
  TableRow,
  TableHead,
  TableHeader,
  TableFooter,
} from "@/components/ui/table"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

import { formatAmount, formatToNumber } from "@/lib/utils.jsx"

const computeTotalGas = (totalKm, avgConsumption) => {
  const km = formatToNumber(totalKm)
  const avg = formatToNumber(avgConsumption)
  if (!km || !avg) return 0
  return km / avg
}

const computeFuelCost = (totalKm, avgConsumption, gasPrice) => {
  const liters = computeTotalGas(totalKm, avgConsumption)
  return liters * formatToNumber(gasPrice)
}

const computeGrandTotal = (totalKm, avgConsumption, gasPrice, tollFee, tev) => {
  const fuel = computeFuelCost(totalKm, avgConsumption, gasPrice)
  return fuel + formatToNumber(tollFee) + formatToNumber(tev)
}

const ServiceVehicleExpenseForm = ({
  travelOrderId,
  vehicles = [],
  initial = [],
  onTotalChange,
  canReview = false,
  isRequestingVehicle = false,
}) => {
  const { toast } = useToast()

  const [driverOptions, setDriverOptions] = useState([])
  const [driversLoading, setDriversLoading] = useState(false)

  useEffect(() => {
    let mounted = true

    const loadDrivers = async () => {
      try {
        setDriversLoading(true)
        const res = await fetch(route("employees.show-active-employees"), {
          headers: { Accept: "application/json" },
        })
        const data = await res.json()

        if (!mounted) return

        const opts = (Array.isArray(data) ? data : data?.employees || []).map((e) => ({
          value: String(e.value ?? e.emp_id ?? ""),
          label: e.label ?? e.name ?? "",
        }))

        setDriverOptions(opts)
      } catch (err) {
        console.error(err)
        setDriverOptions([])
      } finally {
        if (mounted) setDriversLoading(false)
      }
    }

    loadDrivers()
    return () => {
      mounted = false
    }
  }, [])

  const vehicleOptions = useMemo(() => {
    return (Array.isArray(vehicles) ? vehicles : []).map((v) => {
      const id = v?.value ?? v?.id
      return {
        value: String(id ?? ""),
        label: `${v.vehicle} (${v.plate_no})`,
        avg_consumption: Number(v.avg_consumption || 0),
      }
    })
  }, [vehicles])

  const [items, setItems] = useState(() => (Array.isArray(initial) ? initial : []))
  useEffect(() => {
    setItems(Array.isArray(initial) ? initial : [])
  }, [initial])

  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState("create")
  const [editingId, setEditingId] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const saveForm = useForm({
    //driver: "",
    vehicle_id: "",
    total_km: "",
    gas_price: 0,
    toll_fee: 0,
    tev: 0,
  })

  const deleteForm = useForm({})

  const selectedVehicle = useMemo(() => {
    return vehicleOptions.find((o) => String(o.value) === String(saveForm.data.vehicle_id)) || null
  }, [vehicleOptions, saveForm.data.vehicle_id])

  const totalGasPreview = useMemo(() => {
    return computeTotalGas(saveForm.data.total_km, selectedVehicle?.avg_consumption || 0)
  }, [saveForm.data.total_km, selectedVehicle?.avg_consumption])

  const fuelCostPreview = useMemo(() => {
    return computeFuelCost(
      saveForm.data.total_km,
      selectedVehicle?.avg_consumption || 0,
      saveForm.data.gas_price
    )
  }, [saveForm.data.total_km, selectedVehicle?.avg_consumption, saveForm.data.gas_price])

  const grandTotalPreview = useMemo(() => {
    return computeGrandTotal(
      saveForm.data.total_km,
      selectedVehicle?.avg_consumption || 0,
      saveForm.data.gas_price,
      saveForm.data.toll_fee,
      saveForm.data.tev
    )
  }, [
    saveForm.data.total_km,
    selectedVehicle?.avg_consumption,
    saveForm.data.gas_price,
    saveForm.data.toll_fee,
    saveForm.data.tev,
  ])

  const displayRows = useMemo(() => {
    const arr = Array.isArray(items) ? items : []

    return arr.map((row) => {
      const v = vehicleOptions.find((o) => String(o.value) === String(row.vehicle_id))
      const avg = v?.avg_consumption || row?.avg_consumption || 0

      const fuelCost = computeFuelCost(row.total_km, avg, row.gas_price)
      const grand = computeGrandTotal(row.total_km, avg, row.gas_price, row.toll_fee, row.tev)

      return {
        ...row,
        vehicle_label:
          v?.label ||
          (row?.vehicle_name && row?.plate_no
            ? `${row.vehicle_name} (${row.plate_no})`
            : `Vehicle #${row.vehicle_id ?? ""}`),
        fuelCost,
        grand,
      }
    })
  }, [items, vehicleOptions])

  const overallTotal = useMemo(() => {
    return displayRows.reduce((sum, r) => sum + formatToNumber(r.grand), 0)
  }, [displayRows])

  useEffect(() => {
    if (typeof onTotalChange === "function") {
      onTotalChange(overallTotal)
    }
  }, [overallTotal, onTotalChange])

  const canDelete = displayRows.length > 1
  const showActions = canReview && isRequestingVehicle

  const reloadServiceExpenses = () => {
    router.reload({ preserveScroll: true })
  }

  const startCreate = () => {
    setMode("create")
    setEditingId(null)
    saveForm.clearErrors()
    saveForm.setData({
      //driver: "",
      vehicle_id: "",
      total_km: "",
      gas_price: 0,
      toll_fee: 0,
      tev: 0,
    })
    setOpen(true)
  }

  const startEdit = (row) => {
    setMode("edit")
    setEditingId(row.id)
    saveForm.clearErrors()
    saveForm.setData({
      //driver: row?.driver ? String(row.driver) : "",
      vehicle_id: row?.vehicle_id ? String(row.vehicle_id) : "",
      total_km: row?.total_km ?? "",
      gas_price: formatToNumber(row?.gas_price),
      toll_fee: formatToNumber(row?.toll_fee),
      tev: formatToNumber(row?.tev),
    })
    setOpen(true)
  }

  const closeDialog = () => {
    setOpen(false)
    saveForm.clearErrors()
  }

  const onSubmitSave = (e) => {
    e.preventDefault()

    const isEdit = mode === "edit" && editingId
    const successMsg = isEdit ? "Estimate updated." : "Estimate added."

    const opts = {
      preserveScroll: true,
      onSuccess: (page) => {
        const flash = page.props?.flash
        if (flash?.message) {
          toast({
            title: flash.title || "Success",
            description: flash.message,
            variant: flash.status === "error" ? "destructive" : "default",
          })
        }
        reloadServiceExpenses()
        closeDialog()
      },
      onError: () => {
        toast({
          title: "Please check the form",
          description: "Fix the errors and try again.",
          variant: "destructive",
        })
      },
    }

    if (isEdit) {
      saveForm.put(route("travel-requests.service-expense.update", [travelOrderId, editingId]), opts)
    } else {
      saveForm.post(route("travel-requests.service-expense.store", travelOrderId), opts)
    }
  }

  const confirmDelete = () => {
    if (!deleteTarget?.id) return

    deleteForm.delete(route("travel-requests.service-expense.destroy", [travelOrderId, deleteTarget.id]), {
      preserveScroll: true,
      onSuccess: (page) => {
        const flash = page.props?.flash
        if (flash?.message) {
          toast({
            title: flash.title || "Deleted",
            description: flash.message,
            variant: flash.status === "error" ? "destructive" : "default",
          })
        }
        setDeleteTarget(null)
        reloadServiceExpenses()
      },
      onError: (errors) => {
        toast({
          title: "Delete failed",
          description: errors?.service_expense || "Unable to delete this item. Please try again.",
          variant: "destructive",
        })
      },
    })
  }

  return (
    <div className="space-y-2 w-full">
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-semibold">Official Vehicle Use Estimate</div>

        {canReview && isRequestingVehicle && (
          <Button type="button" size="sm" onClick={startCreate}>
            <Plus className="h-4 w-4" />
            Add estimate
          </Button>
        )}
      </div>

      {!canDelete && displayRows.length === 1 && (
        <StatusInfoBox message={"At least one vehicle use estimate is required."} />
      )}

      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="h-9">
              {/* <TableHead className="py-1 px-2 text-xs font-semibold">Driver</TableHead> */}
              <TableHead className="py-1 px-2 text-xs font-semibold">Vehicle</TableHead>
              <TableHead className="py-1 px-2 text-xs font-semibold text-right">Round Trip Cost</TableHead>
              {showActions && (
                <TableHead className="py-1 px-2 text-xs font-semibold w-[110px] text-right">Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>

          <TableBody>
            {displayRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={showActions ? 4 : 3} className="py-3 px-2 text-xs text-muted-foreground">
                  No vehicle use estimate yet.
                </TableCell>
              </TableRow>
            ) : (
              displayRows.map((row) => (
                <TableRow key={row.id} className="h-9">
                  {/* <TableCell className="py-1 px-2 text-xs whitespace-nowrap">{row.driver_name}</TableCell> */}
                  <TableCell className="py-1 px-2 text-xs">
                    <div className="font-medium">{row.vehicle_label}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {formatAmount(formatToNumber(row.total_km))} KMs • Fuel: {formatAmount(row.fuelCost)} • Toll:{" "}
                      {formatAmount(formatToNumber(row.toll_fee))} • TEV: {formatAmount(formatToNumber(row.tev))}
                    </div>
                  </TableCell>

                  <TableCell className="py-1 px-2 text-xs text-right font-semibold whitespace-nowrap">
                    {formatAmount(row.grand)}
                  </TableCell>

                  {showActions && (
                    <TableCell className="py-1 px-2 text-right">
                      <div className="inline-flex items-center gap-1">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => startEdit(row)}
                          className="h-8 px-2"
                          aria-label="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>

                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeleteTarget(row)}
                          disabled={deleteForm.processing || !canDelete}
                          className="h-8 px-2 text-destructive disabled:opacity-40"
                          aria-label="Delete"
                          title={!canDelete ? "At least one entry is required" : "Delete"}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>

          {displayRows.length > 0 && (
            <TableFooter>
              <TableRow className="h-9">
                <TableCell colSpan={2} className="py-2 px-2 text-xs font-semibold text-right">
                  Overall Total
                </TableCell>
                <TableCell className="py-2 px-2 text-xs text-right font-semibold">{formatAmount(overallTotal)}</TableCell>
                {showActions && <TableCell className="py-2 px-2" />}
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>

      <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : closeDialog())}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>
              {mode === "edit" ? "Edit Service Expense Estimate" : "Add Service Expense Estimate"}
            </DialogTitle>
            <DialogDescription>Enter details for the service vehicle expense.</DialogDescription>
          </DialogHeader>

          <form onSubmit={onSubmitSave} className="space-y-3">
            {/* <div className="space-y-1">
              <label className="text-xs font-semibold" htmlFor="svc_driver">
                Driver <span className="text-destructive">*</span>
              </label>

              <SingleComboBox
                id="driver"
                name="driver"
                items={driverOptions}
                value={saveForm.data.driver}
                onChange={(val) => saveForm.setData("driver", val)}
                placeholder={driversLoading ? "Loading drivers..." : "Select driver"}
                invalidMessage={saveForm.errors.driver}
              />

              {saveForm.errors?.driver && (
                <span className="text-red-500 text-[11px]">{saveForm.errors.driver}</span>
              )}
            </div> */}

            <div className="space-y-1">
              <label className="text-xs font-semibold" htmlFor="svc_vehicle_id">
                Vehicle <span className="text-destructive">*</span>
              </label>

              <SingleComboBox
                id="svc_vehicle_id"
                name="vehicle_id"
                items={vehicleOptions}
                value={saveForm.data.vehicle_id}
                onChange={(val) => saveForm.setData("vehicle_id", val)}
                placeholder="Select vehicle"
                invalidMessage={saveForm.errors.vehicle_id}
              />

              {!!selectedVehicle?.avg_consumption && (
                <div className="text-[11px] text-muted-foreground">
                  Average consumption:{" "}
                  <span className="font-semibold">{formatAmount(selectedVehicle.avg_consumption)}</span> km/L
                </div>
              )}

              {saveForm.errors.vehicle_id && (
                <div className="text-[11px] text-destructive">{saveForm.errors.vehicle_id}</div>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold" htmlFor="svc_total_km">
                Total Kilometers (office ↔ destinations) <span className="text-destructive">*</span>
              </label>
              <AmountInput
                id="svc_total_km"
                name="total_km"
                value={saveForm.data.total_km}
                onChange={(value) => saveForm.setData("total_km", value)}
                isInvalid={!!saveForm.errors.total_km}
                placeholder="Enter distance in km"
              />
              {saveForm.errors.total_km && (
                <div className="text-[11px] text-destructive">{saveForm.errors.total_km}</div>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold" htmlFor="svc_gas_price">
                Gas Price (per liter) <span className="text-destructive">*</span>
              </label>
              <AmountInput
                id="svc_gas_price"
                name="gas_price"
                value={saveForm.data.gas_price}
                onChange={(value) => saveForm.setData("gas_price", value)}
                isInvalid={!!saveForm.errors.gas_price}
              />
              {saveForm.errors.gas_price && (
                <div className="text-[11px] text-destructive">{saveForm.errors.gas_price}</div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold" htmlFor="svc_toll_fee">
                  Toll Fee
                </label>
                <AmountInput
                  id="svc_toll_fee"
                  name="toll_fee"
                  value={saveForm.data.toll_fee}
                  onChange={(value) => saveForm.setData("toll_fee", value)}
                  isInvalid={!!saveForm.errors.toll_fee}
                />
                {saveForm.errors.toll_fee && (
                  <div className="text-[11px] text-destructive">{saveForm.errors.toll_fee}</div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold" htmlFor="svc_tev">
                  TEV (Driver)
                </label>
                <AmountInput
                  id="svc_tev"
                  name="tev"
                  value={saveForm.data.tev}
                  onChange={(value) => saveForm.setData("tev", value)}
                  isInvalid={!!saveForm.errors.tev}
                />
                {saveForm.errors.tev && (
                  <div className="text-[11px] text-destructive">{saveForm.errors.tev}</div>
                )}
              </div>
            </div>

            <div className="rounded-md border p-3 text-xs space-y-1">
              <div className="flex justify-between">
                <span>Gas Consumption</span>
                <span className="font-semibold">{formatAmount(totalGasPreview)} L</span>
              </div>
              <div className="flex justify-between">
                <span>Fuel Cost</span>
                <span className="font-semibold">{formatAmount(fuelCostPreview)}</span>
              </div>
              <div className="flex justify-between">
                <span>Round Trip Cost</span>
                <span className="font-semibold">{formatAmount(grandTotalPreview)}</span>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="ghost" onClick={closeDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={saveForm.processing}>
                {saveForm.processing ? "Saving..." : mode === "edit" ? "Update item" : "Save item"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>Delete estimate?</DialogTitle>
            <DialogDescription>
              This action will remove the selected estimate.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="ghost" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteForm.processing}
            >
              {deleteForm.processing ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ServiceVehicleExpenseForm
