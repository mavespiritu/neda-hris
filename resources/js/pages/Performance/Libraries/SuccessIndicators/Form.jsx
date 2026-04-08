import axios from "axios"
import { useEffect, useMemo, useRef, useState } from "react"
import { useForm } from "@inertiajs/react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import TextArea from "@/components/TextArea"
import { Label } from "@/components/ui/label"
import SingleComboBox from "@/components/SingleComboBox"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import MatrixBuilder from "./MatrixBuilder"
import { createMatrixBlock, normalizeMatrixPayload } from "./matrixUtils"

const levels = [
  { value: "OPCR", label: "OPCR" },
  { value: "DPCR", label: "DPCR" },
  { value: "IPCR", label: "IPCR" },
]

const categories = [
  { value: "Common", label: "Common" },
  { value: "OPCR", label: "OPCR" },
  { value: "DPCR", label: "DPCR" },
  { value: "IPCR", label: "IPCR" },
]

const matrixSources = [
  { value: "default", label: "Default Rating Matrix" },
  { value: "custom", label: "Custom Matrix" },
]

const Form = ({ mode, data, onClose, open }) => {
  const isEdit = mode === "edit"
  const { toast } = useToast()
  const [activities, setActivities] = useState([])
  const [activitiesLoading, setActivitiesLoading] = useState(false)
  const [ratings, setRatings] = useState([])
  const [ratingsLoading, setRatingsLoading] = useState(false)
  const [matrixSource, setMatrixSource] = useState("custom")
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
    level: "",
    category: "Common",
    performance_activity_id: null,
    performance_rating_id: null,
    target: "",
    matrix_payload: [createMatrixBlock()],
  })

  useEffect(() => {
    const loadActivities = async () => {
      try {
        setActivitiesLoading(true)
        const response = await axios.get(route("performance.activities.index"), { params: { per_page: 1000 } })
        const rows = Array.isArray(response?.data?.data) ? response.data.data : Array.isArray(response?.data) ? response.data : []
        setActivities(rows.map((item) => ({ value: String(item.id), label: item.activity_output })))
      } catch (error) {
        setActivities([])
      } finally {
        setActivitiesLoading(false)
      }
    }

    const loadRatings = async () => {
      try {
        setRatingsLoading(true)
        const response = await axios.get(route("performance.ratings.index"), { params: { per_page: 1000 } })
        const rows = Array.isArray(response?.data?.data) ? response.data.data : Array.isArray(response?.data) ? response.data : []
        setRatings(rows)
      } catch (error) {
        setRatings([])
      } finally {
        setRatingsLoading(false)
      }
    }

    if (open) {
      loadActivities()
      loadRatings()
    }
  }, [open])

  const ratingRecords = useMemo(() => {
    const records = []

    if (data?.performance_rating_id && data?.rating_name) {
      records.push({
        id: data.performance_rating_id,
        name: data.rating_name,
        category: data.rating_category || "Common",
        matrix_rows: data.matrix_payload,
      })
    }

    ratings.forEach((item) => records.push(item))

    const deduped = new Map()
    records.forEach((item) => {
      if (item?.id === undefined || item?.id === null) return
      const key = String(item.id)
      if (!deduped.has(key)) {
        deduped.set(key, item)
      }
    })

    return Array.from(deduped.values())
  }, [data, ratings])

  const ratingItems = useMemo(
    () =>
      ratingRecords.map((item) => ({
        value: String(item.id),
        label: `${item.name}${item.category ? ` (${item.category})` : ""}`,
      })),
    [ratingRecords]
  )

  const selectedRating = useMemo(() => {
    if (!formData.performance_rating_id) {
      return null
    }

    return ratingRecords.find((item) => String(item.id) === String(formData.performance_rating_id)) ?? null
  }, [formData.performance_rating_id, ratingRecords])

  useEffect(() => {
    const recordId = data?.id ?? null

    if (!open) {
      return
    }

    if (loadedRecordIdRef.current === recordId) {
      return
    }

    loadedRecordIdRef.current = recordId

    if (isEdit && data) {
      const normalizedMatrix = normalizeMatrixPayload(data.matrix_payload)
      const source = data.performance_rating_id ? "default" : "custom"

      setMatrixSource(source)
      setData({
        id: data.id || null,
        level: data.level || "",
        category: data.category || "Common",
        performance_activity_id: data.performance_activity_id ? String(data.performance_activity_id) : null,
        performance_rating_id: data.performance_rating_id ? String(data.performance_rating_id) : null,
        target: data.target || "",
        matrix_payload: normalizedMatrix.length ? [normalizedMatrix[0]] : [createMatrixBlock()],
      })
      return
    }

    setData({
      level: "",
      category: "Common",
      performance_activity_id: null,
      performance_rating_id: null,
      target: "",
      matrix_payload: [createMatrixBlock()],
    })
    setMatrixSource("custom")
  }, [open, isEdit, data?.id, data, reset, setData])

  useEffect(() => {
    if (!open) {
      loadedRecordIdRef.current = null
    }
  }, [open])

  const handleRatingChange = (value) => {
    const selected = ratingRecords.find((item) => String(item.id) === String(value))
    const normalized = normalizeMatrixPayload(selected?.matrix_rows)

    setData("performance_rating_id", String(value))
    setData("matrix_payload", normalized.length ? [normalized[0]] : [createMatrixBlock()])
  }

  useEffect(() => {
    if (matrixSource !== "default") {
      return
    }

    if (formData.performance_rating_id || ratingsLoading) {
      return
    }

    const fallbackRating = ratingRecords[0]
    if (fallbackRating) {
      handleRatingChange(String(fallbackRating.id))
    }
  }, [matrixSource, formData.performance_rating_id, ratingsLoading, ratingRecords])

  const handleMatrixSourceChange = (value) => {
    const nextSource = value || "custom"
    setMatrixSource(nextSource)

    if (nextSource === "default") {
      const fallbackRating = ratingRecords[0]

      if (fallbackRating) {
        handleRatingChange(String(fallbackRating.id))
      }
      return
    }

    setData("performance_rating_id", null)
    setData("matrix_payload", [createMatrixBlock()])
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (isEdit) {
      put(route("performance.success-indicators.update", data.id), {
        onSuccess: () => {
          onClose()
          reset()
          toast({ title: "Success!", description: "The item was updated successfully." })
        },
      })
      return
    }

    post(route("performance.success-indicators.store"), {
      onSuccess: () => {
        onClose()
        reset()
        toast({ title: "Success!", description: "The item was saved successfully." })
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-[96vw] max-h-[92vh] overflow-hidden p-0">
        <form onSubmit={handleSubmit} className="flex max-h-[92vh] flex-col">
          <div className="flex-1 min-h-0 overflow-y-auto px-6 py-6">
            <DialogHeader>
              <DialogTitle>{isEdit ? "Edit Success Indicator" : "Add Success Indicator"}</DialogTitle>
              <DialogDescription className="text-justify">
                Fill-up the indicator details and configure the rating matrix.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-5 space-y-6">
              <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50/60 p-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <Label>Level</Label>
                    <SingleComboBox
                      items={levels}
                      onChange={(value) => setData("level", value || "")}
                      placeholder="Select level"
                      name="level"
                      value={formData.level}
                      invalidMessage={errors.level}
                    />
                    {errors.level && <p className="text-xs text-red-500">{errors.level}</p>}
                  </div>

                  <div className="space-y-1">
                    <Label>Category</Label>
                    <SingleComboBox
                      items={categories}
                      onChange={(value) => setData("category", value || "Common")}
                      placeholder="Select category"
                      name="category"
                      value={formData.category}
                      invalidMessage={errors.category}
                    />
                    {errors.category && <p className="text-xs text-red-500">{errors.category}</p>}
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <Label>Target</Label>
                    <TextArea
                      id="success-indicator-target"
                      name="target"
                      value={formData.target}
                      onChange={(e) => setData("target", e.target.value)}
                      invalidMessage={errors.target}
                    />
                    {errors.target && <p className="text-xs text-red-500">{errors.target}</p>}
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <Label>Activity/Output</Label>
                <SingleComboBox
                  items={activities}
                  onChange={(value) => setData("performance_activity_id", value || null)}
                  placeholder={activitiesLoading ? "Loading activities..." : "Select activity/output"}
                  name="activity"
                  value={formData.performance_activity_id || ""}
                  invalidMessage={errors.performance_activity_id}
                  loading={activitiesLoading}
                />
                {errors.performance_activity_id && <p className="text-xs text-red-500">{errors.performance_activity_id}</p>}
              </div>

              <div className="space-y-1">
                <Label>Matrix Source</Label>
                <SingleComboBox
                  items={matrixSources}
                  onChange={handleMatrixSourceChange}
                  placeholder="Select matrix source"
                  name="matrix_source"
                  value={matrixSource}
                  invalidMessage={errors.performance_rating_id}
                />
                {errors.performance_rating_id && <p className="text-xs text-red-500">{errors.performance_rating_id}</p>}
                <p className="text-xs text-slate-500">
                  Choose whether this success indicator uses a default rating matrix or a custom one.
                </p>
              </div>

              {matrixSource === "default" && (
                <div className="space-y-1">
                  <Label>Default Rating Matrix</Label>
                <SingleComboBox
                  items={ratingItems}
                  onChange={handleRatingChange}
                  placeholder={ratingsLoading ? "Loading ratings..." : "Select rating matrix"}
                  name="performance_rating_id"
                  value={formData.performance_rating_id ? String(formData.performance_rating_id) : ""}
                  invalidMessage={errors.performance_rating_id}
                  loading={ratingsLoading}
                />
                {errors.performance_rating_id && <p className="text-xs text-red-500">{errors.performance_rating_id}</p>}
                <p className="text-xs text-slate-500">
                  Select a default rating template to reuse its matrix.
                </p>
                {selectedRating ? (
                  <p className="text-xs font-medium text-emerald-600">
                    Using default rating: {selectedRating.name}
                  </p>
                ) : null}
                {!selectedRating ? (
                  <p className="text-xs text-amber-600">
                    No default rating is selected yet. Pick a template above before saving.
                  </p>
                ) : null}
                </div>
              )}

              <MatrixBuilder
                value={formData.matrix_payload}
                onChange={(value) => setData("matrix_payload", value)}
                disabled={matrixSource === "default"}
              />
            </div>
          </div>

          <div className="flex shrink-0 items-center justify-end gap-2 border-t border-slate-200 bg-background px-6 py-4">
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={processing}>
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEdit ? "Updating..." : "Saving..."}
                </>
              ) : isEdit ? (
                "Update"
              ) : (
                "Save"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default Form
