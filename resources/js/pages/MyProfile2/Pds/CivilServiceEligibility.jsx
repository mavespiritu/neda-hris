import { useEffect, useState } from "react"
import axios from "axios"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { FileText, Loader2, Plus, Pencil, Trash2 } from "lucide-react"
import store from "../store"
import DatePicker from "@/components/DatePicker"
import TextInput from "@/components/TextInput"
import { formatDate } from "@/lib/utils.jsx"
import { useToast } from "@/hooks/use-toast"
import CivilServiceEligibilityForm from "./CivilServiceEligibilityForm"

const emptyForm = {
  id: null,
  eligibility: "",
  rating: "",
  exam_date: "",
  exam_place: "",
  license_no: "",
  validity_date: "",
}

const CivilServiceEligibility = ({
  applicantId,
  profileType,
  section = "civilServiceEligibility",
}) => {
  const { toast } = useToast()
  const { loading, pdsState, fetchPdsSection } = store()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState("add")
  const [formLoading, setFormLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState(emptyForm)
  const [formErrors, setFormErrors] = useState({})
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [recordToDelete, setRecordToDelete] = useState(null)

  useEffect(() => {
    fetchPdsSection(section, { applicantId, profileType })
  }, [applicantId, profileType, section])

  const rows = Array.isArray(pdsState.civilServiceEligibility)
    ? pdsState.civilServiceEligibility
    : []

  const openAddDialog = async () => {
    setDialogMode("add")
    setFormErrors({})
    setFormLoading(true)
    setDialogOpen(true)

    try {
      const response = await axios.get(route("profile.create-civil-service-eligibility"))
      setFormData(response.data)
    } catch {
      setDialogOpen(false)
      toast({
        title: "Error",
        description: "Failed to open add form.",
        variant: "destructive",
      })
    } finally {
      setFormLoading(false)
    }
  }

  const openEditDialog = async (row) => {
    setDialogMode("edit")
    setFormErrors({})
    setFormLoading(true)
    setDialogOpen(true)

    try {
      const response = await axios.get(
        route("profile.edit-civil-service-eligibility", { id: row.id })
      )
      setFormData(response.data)
    } catch {
      setDialogOpen(false)
      toast({
        title: "Error",
        description: "Failed to open edit form.",
        variant: "destructive",
      })
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async (row) => {
    try {
      await axios.delete(route("profile.delete-civil-service-eligibility", { id: row.id }))
      await fetchPdsSection(section, { applicantId, profileType })

      toast({
        title: "Deleted",
        description: "Civil service eligibility deleted successfully.",
      })
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete record.",
        variant: "destructive",
      })
    }
  }

  const confirmDelete = async () => {
    if (!recordToDelete) return

    try {
      await axios.delete(
        route("profile.delete-civil-service-eligibility", { id: recordToDelete.id })
      )
      await fetchPdsSection(section, { applicantId, profileType })

      toast({
        title: "Deleted",
        description: "Civil service eligibility deleted successfully.",
      })
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete record.",
        variant: "destructive",
      })
    } finally {
      setDeleteDialogOpen(false)
      setRecordToDelete(null)
    }
  }


  const handleSubmit = async () => {
    setSubmitting(true)
    setFormErrors({})

    try {
      if (dialogMode === "add") {
        await axios.post(route("profile.store-civil-service-eligibility"), formData)
      } else {
        await axios.put(
          route("profile.update-civil-service-eligibility", { id: formData.id }),
          formData
        )
      }

      setDialogOpen(false)
      setFormData(emptyForm)
      await fetchPdsSection(section, { applicantId, profileType })

      toast({
        title: "Success!",
        description:
          dialogMode === "add"
            ? "Civil service eligibility added successfully."
            : "Civil service eligibility updated successfully.",
      })
    } catch (error) {
      setFormErrors(error.response?.data?.errors || {})
      toast({
        title: error.response?.data?.title || "Validation failed",
        description:
          error.response?.data?.message || "Please check the fields highlighted in red.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="font-semibold text-lg flex items-center">
              <FileText className="mr-2 h-4 w-4" /> Civil Service Eligibility
            </CardTitle>
            <CardDescription>List of civil service eligibility records.</CardDescription>
          </div>

          <Button type="button" onClick={openAddDialog}>
            <Plus className="h-4 w-4 mr-1" />
            Add Record
          </Button>
        </CardHeader>

        <CardContent className="relative">
          {loading && (
            <div className="absolute inset-0 z-20 flex items-center justify-center rounded-md bg-white/50 backdrop-blur-[2px]">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          <div className="hidden md:block rounded-md border overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted">
                <TableRow>
                  <TableHead className="w-[60px]">#</TableHead>
                  <TableHead>Eligibility</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Date of Examination / Conferment</TableHead>
                  <TableHead>Place of Examination / Conferment</TableHead>
                  <TableHead>License No.</TableHead>
                  <TableHead>Date of Validity</TableHead>
                  <TableHead className="w-[100px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {rows.length > 0 ? (
                  rows.map((row, index) => (
                    <TableRow key={row.id ?? index} className="h-10">
                      <TableCell className="py-2 px-3 text-sm">{index + 1}</TableCell>
                      <TableCell className="py-2 px-3 text-sm">{row.eligibility || "-"}</TableCell>
                      <TableCell className="py-2 px-3 text-sm">{row.rating || "-"}</TableCell>
                      <TableCell className="py-2 px-3 text-sm">{formatDate(row.exam_date) || "-"}</TableCell>
                      <TableCell className="py-2 px-3 text-sm">{row.exam_place || "-"}</TableCell>
                      <TableCell className="py-2 px-3 text-sm">{row.license_no || "-"}</TableCell>
                      <TableCell className="py-2 px-3 text-sm">{formatDate(row.validity_date) || "-"}</TableCell>
                      <TableCell className="py-2 px-3">
                        <div className="flex items-center justify-end gap-0.5">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => openEditDialog(row)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => {
                              setRecordToDelete(row)
                              setDeleteDialogOpen(true)
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="py-3 text-center text-sm text-muted-foreground">
                      No civil service eligibility records found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="md:hidden flex flex-col gap-3">
            {rows.length > 0 ? (
              rows.map((row, index) => (
                <div key={row.id ?? index} className="rounded-md border bg-background p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground">Record #{index + 1}</span>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => openEditDialog(row)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => {
                          setRecordToDelete(row)
                          setDeleteDialogOpen(true)
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-red-500" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <div>
                      <p className="text-[11px] font-medium text-muted-foreground">Eligibility</p>
                      <p>{row.eligibility || "-"}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-medium text-muted-foreground">Rating</p>
                      <p>{row.rating || "-"}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-medium text-muted-foreground">Date of Examination / Conferment</p>
                      <p>{formatDate(row.exam_date) || "-"}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-medium text-muted-foreground">Place of Examination / Conferment</p>
                      <p>{row.exam_place || "-"}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-medium text-muted-foreground">License No.</p>
                      <p>{row.license_no || "-"}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-medium text-muted-foreground">Date of Validity</p>
                      <p>{formatDate(row.validity_date) || "-"}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-md border p-4 text-center text-sm text-muted-foreground">
                No civil service eligibility records found.
              </div>
            )}
          </div>
        </CardContent>

      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "add" ? "Add Civil Service Eligibility" : "Edit Civil Service Eligibility"}
            </DialogTitle>
          </DialogHeader>

          <CivilServiceEligibilityForm
            formData={formData}
            setFormData={setFormData}
            formErrors={formErrors}
            formLoading={formLoading}
          />

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setDialogOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleSubmit} disabled={submitting || formLoading}>
              {submitting ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Record?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this civil service eligibility record? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setRecordToDelete(null)
                setDeleteDialogOpen(false)
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default CivilServiceEligibility
