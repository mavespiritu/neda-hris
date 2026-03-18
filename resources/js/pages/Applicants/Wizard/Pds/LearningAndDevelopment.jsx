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
import { Brain, Loader2, Plus, Pencil, Trash2 } from "lucide-react"
import store from "../store"
import { formatDate } from "@/lib/utils.jsx"
import { useToast } from "@/hooks/use-toast"
import LearningAndDevelopmentForm from "./LearningAndDevelopmentForm"

const emptyForm = { id: null, seminar_title: "", from_date: null, to_date: null, hours: "", participation: "", type: "", conducted_by: "" }

const LearningAndDevelopment = ({ applicantId, profileType, section = "learningAndDevelopment" }) => {
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

  useEffect(() => { fetchPdsSection(section, { applicantId, profileType }) }, [applicantId, profileType, section])
  const rows = Array.isArray(pdsState.learningAndDevelopment) ? pdsState.learningAndDevelopment : []

  const openAddDialog = async () => {
    if (!applicantId) return
    setDialogMode("add"); setFormErrors({}); setFormLoading(true); setDialogOpen(true)
    try { const response = await axios.get(route("applicants.create-learning-and-development", { applicantId })); setFormData(response.data) }
    catch { setDialogOpen(false); toast({ title: "Error", description: "Failed to open add form.", variant: "destructive" }) }
    finally { setFormLoading(false) }
  }

  const openEditDialog = async (row) => {
    if (!applicantId) return
    setDialogMode("edit"); setFormErrors({}); setFormLoading(true); setDialogOpen(true)
    try { const response = await axios.get(route("applicants.edit-learning-and-development", { applicantId, id: row.id })); setFormData(response.data) }
    catch { setDialogOpen(false); toast({ title: "Error", description: "Failed to open edit form.", variant: "destructive" }) }
    finally { setFormLoading(false) }
  }

  const confirmDelete = async () => {
    if (!recordToDelete || !applicantId) return
    try { await axios.delete(route("applicants.delete-learning-and-development", { applicantId, id: recordToDelete.id })); await fetchPdsSection(section, { applicantId, profileType }); toast({ title: "Deleted", description: "Learning and development deleted successfully." }) }
    catch { toast({ title: "Error", description: "Failed to delete record.", variant: "destructive" }) }
    finally { setDeleteDialogOpen(false); setRecordToDelete(null) }
  }

  const handleSubmit = async () => {
    if (!applicantId) return
    setSubmitting(true); setFormErrors({})
    try {
      if (dialogMode === "add") await axios.post(route("applicants.store-learning-and-development", { applicantId }), formData)
      else await axios.put(route("applicants.update-learning-and-development", { applicantId, id: formData.id }), formData)
      setDialogOpen(false); setFormData(emptyForm); await fetchPdsSection(section, { applicantId, profileType })
      toast({ title: "Success!", description: dialogMode === "add" ? "Learning and development added successfully." : "Learning and development updated successfully." })
    } catch (error) {
      setFormErrors(error.response?.data?.errors || {})
      toast({ title: error.response?.data?.title || "Validation failed", description: error.response?.data?.message || "Please check the fields highlighted in red.", variant: "destructive" })
    } finally { setSubmitting(false) }
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div><CardTitle className="font-semibold text-lg flex items-center"><Brain className="mr-2 h-4 w-4" /> Learning and Development</CardTitle><CardDescription>List of learning and development records.</CardDescription></div>
          <Button type="button" onClick={openAddDialog} disabled={!applicantId}><Plus className="h-4 w-4 mr-1" />Add Record</Button>
        </CardHeader>
        <CardContent className="relative">
          {loading && <div className="absolute inset-0 z-20 flex items-center justify-center rounded-md bg-white/50 backdrop-blur-[2px]"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}
          <div className="hidden md:block rounded-md border overflow-x-auto"><Table><TableHeader className="bg-muted"><TableRow><TableHead rowSpan={2} className="w-[60px]">#</TableHead><TableHead rowSpan={2} className="w-[20%]">Title of Learning and Development Interventions / Training Programs</TableHead><TableHead colSpan={2} className="text-center">Inclusive Dates of Attendance</TableHead><TableHead rowSpan={2}>No. of Hours</TableHead><TableHead rowSpan={2}>Type of L&D</TableHead><TableHead rowSpan={2}>Conducted/Sponsored by</TableHead><TableHead rowSpan={2} className="w-[100px] text-right">Actions</TableHead></TableRow><TableRow><TableHead className="text-center">From</TableHead><TableHead className="text-center">To</TableHead></TableRow></TableHeader><TableBody>{rows.length > 0 ? rows.map((row, index) => (<TableRow key={row.id ?? index} className="h-10"><TableCell className="py-2 px-3 text-sm">{index + 1}</TableCell><TableCell className="py-2 px-3 text-sm w-[20%]">{row.seminar_title || "-"}</TableCell><TableCell className="py-2 px-3 text-sm w-[10%] text-center">{formatDate(row.from_date) || "-"}</TableCell><TableCell className="py-2 px-3 text-sm w-[10%] text-center">{formatDate(row.to_date) || "-"}</TableCell><TableCell className="py-2 px-3 text-sm">{row.hours || "-"}</TableCell><TableCell className="py-2 px-3 text-sm">{row.type || "-"}</TableCell><TableCell className="py-2 px-3 text-sm">{row.conducted_by || "-"}</TableCell><TableCell className="py-2 px-3"><div className="flex items-center justify-end gap-0.5"><Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditDialog(row)}><Pencil className="h-3.5 w-3.5" /></Button><Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setRecordToDelete(row); setDeleteDialogOpen(true) }}><Trash2 className="h-3.5 w-3.5 text-red-500" /></Button></div></TableCell></TableRow>)) : <TableRow><TableCell colSpan={8} className="py-3 text-center text-sm text-muted-foreground">No learning and development records found.</TableCell></TableRow>}</TableBody></Table></div>
          <div className="md:hidden flex flex-col gap-3">{rows.length > 0 ? rows.map((row, index) => (<div key={row.id ?? index} className="rounded-md border bg-background p-3 space-y-2"><div className="flex items-center justify-between"><span className="text-xs font-semibold text-muted-foreground">Record #{index + 1}</span><div className="flex items-center gap-1"><Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditDialog(row)}><Pencil className="h-3.5 w-3.5" /></Button><Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setRecordToDelete(row); setDeleteDialogOpen(true) }}><Trash2 className="h-3.5 w-3.5 text-red-500" /></Button></div></div><div className="grid grid-cols-1 gap-2 text-sm"><div><p className="text-[11px] font-medium text-muted-foreground">Title of Learning and Development Interventions / Training Programs</p><p>{row.seminar_title || "-"}</p></div><div><p className="text-[11px] font-medium text-muted-foreground">Inclusive Dates (From)</p><p>{formatDate(row.from_date) || "-"}</p></div><div><p className="text-[11px] font-medium text-muted-foreground">Inclusive Dates (To)</p><p>{formatDate(row.to_date) || "-"}</p></div><div><p className="text-[11px] font-medium text-muted-foreground">No. of Hours</p><p>{row.hours || "-"}</p></div><div><p className="text-[11px] font-medium text-muted-foreground">Type of L&D</p><p>{row.type || "-"}</p></div><div><p className="text-[11px] font-medium text-muted-foreground">Conducted/Sponsored by</p><p>{row.conducted_by || "-"}</p></div></div></div>)) : <div className="rounded-md border p-4 text-center text-sm text-muted-foreground">No learning and development records found.</div>}</div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogContent className="sm:max-w-3xl"><DialogHeader><DialogTitle>{dialogMode === "add" ? "Add Learning and Development" : "Edit Learning and Development"}</DialogTitle></DialogHeader><LearningAndDevelopmentForm formData={formData} setFormData={setFormData} formErrors={formErrors} formLoading={formLoading} /><DialogFooter><Button type="button" variant="ghost" onClick={() => setDialogOpen(false)} disabled={submitting}>Cancel</Button><Button type="button" onClick={handleSubmit} disabled={submitting || formLoading}>{submitting ? "Saving..." : "Save"}</Button></DialogFooter></DialogContent></Dialog>
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Record?</AlertDialogTitle><AlertDialogDescription>Are you sure you want to delete this learning and development record? This action cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel onClick={() => { setRecordToDelete(null); setDeleteDialogOpen(false) }}>Cancel</AlertDialogCancel><AlertDialogAction onClick={confirmDelete} className="bg-destructive text-white hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </>
  )
}

export default LearningAndDevelopment
