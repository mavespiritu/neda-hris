import { useEffect, useRef } from "react"
import { useForm } from "@inertiajs/react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import TextInput from "@/components/TextInput"
import SingleComboBox from "@/components/SingleComboBox"
import MatrixBuilder from "../SuccessIndicators/MatrixBuilder"
import { createMatrixBlock, normalizeMatrixPayload } from "../SuccessIndicators/matrixUtils"

const categories = [
  { value: "Common", label: "Common" },
  { value: "OPCR", label: "OPCR" },
  { value: "DPCR", label: "DPCR" },
  { value: "IPCR", label: "IPCR" },
]

const Form = ({ mode, data, onClose, open }) => {
  const isEdit = mode === "edit"
  const { toast } = useToast()
  const loadedRecordIdRef = useRef(null)

  const {
    data: formData,
    setData,
    post,
    put,
    processing,
    reset,
    errors,
  } = useForm({
    name: "",
    category: "Common",
    matrix_payload: [createMatrixBlock()],
  })

  useEffect(() => {
    const recordId = data?.id ?? null

    if (!open) return
    if (loadedRecordIdRef.current === recordId) return

    loadedRecordIdRef.current = recordId

    if (isEdit && data) {
      const sourceMatrix = data.matrix_rows ?? data.matrix_payload
      const normalizedMatrix = normalizeMatrixPayload(sourceMatrix)

      setData({
        id: data.id || null,
        name: data.name || "",
        category: data.category || "Common",
        matrix_payload: normalizedMatrix.length ? [normalizedMatrix[0]] : [createMatrixBlock()],
      })
      return
    }

    setData({
      name: "",
      category: "Common",
      matrix_payload: [createMatrixBlock()],
    })
  }, [open, isEdit, data?.id, data, setData])

  useEffect(() => {
    if (!open) {
      loadedRecordIdRef.current = null
    }
  }, [open])

  const handleSubmit = (e) => {
    e.preventDefault()

    if (isEdit) {
      put(route("performance.ratings.update", data.id), {
        onSuccess: () => {
          onClose()
          reset()
          toast({ title: "Success!", description: "The rating matrix was updated successfully." })
        },
      })
      return
    }

    post(route("performance.ratings.store"), {
      onSuccess: () => {
        onClose()
        reset()
        toast({ title: "Success!", description: "The rating matrix was saved successfully." })
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-[96vw] max-h-[92vh] overflow-hidden p-0">
        <form onSubmit={handleSubmit} className="flex max-h-[92vh] flex-col">
          <div className="flex-1 min-h-0 overflow-y-auto px-6 py-6">
            <DialogHeader>
              <DialogTitle>{isEdit ? "Edit Rating" : "Add Rating"}</DialogTitle>
              <DialogDescription>
                Configure the default rating matrix used for success indicators without a custom matrix.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-5 space-y-6">
              <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50/60 p-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1 md:col-span-2">
                    <Label>Name</Label>
                    <TextInput
                      className="w-full rounded-md border border-slate-200 px-3 py-2"
                      value={formData.name}
                      onChange={(e) => setData("name", e.target.value)}
                    />
                    {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <Label>Category</Label>
                    <SingleComboBox
                      items={categories}
                      value={formData.category}
                      onChange={(value) => setData("category", value || "Common")}
                      placeholder="Select category"
                      name="category"
                      width="w-full"
                    />
                    {errors.category && <p className="text-xs text-red-500">{errors.category}</p>}
                  </div>
                </div>
              </div>

              <MatrixBuilder
                value={formData.matrix_payload}
                onChange={(value) => setData("matrix_payload", value)}
              />
            </div>
          </div>

          <div className="flex shrink-0 items-center justify-end gap-2 border-t border-slate-200 bg-background px-6 py-4">
            <DialogClose asChild>
              <Button type="button" variant="ghost">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={processing}>
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEdit ? "Updating..." : "Saving..."}
                </>
              ) : isEdit ? "Update" : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default Form
