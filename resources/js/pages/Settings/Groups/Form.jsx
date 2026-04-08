import { useEffect, useMemo, useState } from "react"
import axios from "axios"
import { useForm } from "@inertiajs/react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import TextInput from "@/components/TextInput"
import TextArea from "@/components/TextArea"
import { Label } from "@/components/ui/label"
import MultipleComboBox from "@/components/MultipleComboBox"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const normalizeMemberIds = (members) =>
  Array.isArray(members)
    ? members.map((member) => String(member?.employee_ipms_id ?? member?.value ?? member)).filter(Boolean)
    : []

const Form = ({ mode, data, onClose, open }) => {
  const isEdit = mode === "edit"
  const { toast } = useToast()
  const [employees, setEmployees] = useState([])

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
    description: "",
    members: [],
  })

  useEffect(() => {
    if (isEdit && data) {
      setData({
        id: data.id || null,
        name: data.name || "",
        description: data.description || "",
        members: normalizeMemberIds(data.members),
      })
      return
    }

    reset()
  }, [isEdit, data, reset, setData])

  useEffect(() => {
    let mounted = true

    axios
      .get(route("employees.show-filtered-employees"), { params: { emp_type_id: "Permanent" } })
      .then((response) => {
        if (!mounted) return

        const payload = response?.data ?? response
        setEmployees(Array.isArray(payload) ? payload : [])
      })
      .catch(() => {
        if (mounted) setEmployees([])
      })

    return () => {
      mounted = false
    }
  }, [])

  const employeeItems = useMemo(
    () => employees.map((employee) => ({ value: String(employee.value), label: employee.label })),
    [employees]
  )

  const handleSubmit = (e) => {
    e.preventDefault()

    if (isEdit) {
      put(route("settings.groups.update", data.id), {
        onSuccess: () => {
          onClose()
          reset()
          toast({
            title: "Success!",
            description: "The group was updated successfully.",
          })
        },
      })
      return
    }

    post(route("settings.groups.store"), {
      onSuccess: () => {
        onClose()
        reset()
        toast({
          title: "Success!",
          description: "The group was saved successfully.",
        })
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Group" : "Add Group"}</DialogTitle>
          <DialogDescription className="text-justify">
            Fill-up all required fields.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label>Name</Label>
            <TextInput
              value={formData.name}
              onChange={(e) => setData("name", e.target.value)}
              placeholder="Enter group name"
              isInvalid={!!errors.name}
            />
            {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
          </div>

          <div className="space-y-1">
            <Label>Description</Label>
            <TextArea
              id="description"
              name="description"
              value={formData.description}
              onChange={(e) => setData("description", e.target.value)}
              invalidMessage={errors.description}
            />
            {errors.description && <p className="text-xs text-red-500">{errors.description}</p>}
          </div>

          <div className="space-y-1">
            <Label>Members</Label>
            <MultipleComboBox
              items={employeeItems}
              value={formData.members}
              onChange={(values) => setData("members", values)}
              placeholder="Select members"
              name="member"
              invalidMessage={!!errors.members}
              width="w-full"
            />
            {errors.members && <p className="text-xs text-red-500">{errors.members}</p>}
          </div>

          <div className="flex justify-end gap-2">
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