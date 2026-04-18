import { useEffect } from "react"
import { useForm } from "@inertiajs/react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import TextInput from "@/components/TextInput"
import TextArea from "@/components/TextArea"
import { Label } from "@/components/ui/label"
import SingleComboBox from "@/components/SingleComboBox"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  processOptions,
  stateOptions,
  actorTypeOptions,
  scopeTypeOptions,
  scopeSourceOptions,
  scopeMatchOptions,
  actionOptions,
  recipientRoleOptions,
} from "./selections"

const emptyForm = {
  id: null,
  process_key: "",
  from_state: "",
  to_state: "",
  expected_actor_type: "",
  actor_scope_type: null,
  actor_scope_source: null,
  actor_scope_value: "",
  actor_scope_match: "exact",
  multiple_assignees: false,
  expected_action: "",
  notification_label: "",
  recipient_role: null,
  recipient_scope_type: null,
  recipient_scope_source: null,
  recipient_scope_value: "",
  is_return_step: false,
  is_terminal: false,
  is_active: true,
  sort_order: 0,
}

const Form = ({ mode, data, onClose, open }) => {
  const isEdit = mode === "edit"
  const { toast } = useToast()

  const {
    data: formData,
    setData,
    post,
    put,
    processing,
    reset,
    errors,
  } = useForm(emptyForm)

  useEffect(() => {
    if (isEdit && data) {
      setData({
        id: data.id ?? null,
        process_key: data.process_key || "",
        from_state: data.from_state || "",
        to_state: data.to_state || "",
        expected_actor_type: data.expected_actor_type || "",
        actor_scope_type: data.actor_scope_type || null,
        actor_scope_source: data.actor_scope_source || null,
        actor_scope_value: data.actor_scope_value || "",
        actor_scope_match: data.actor_scope_match || "exact",
        multiple_assignees: !!data.multiple_assignees,
        expected_action: data.expected_action || "",
        notification_label: data.notification_label || "",
        recipient_role: data.recipient_role || null,
        recipient_scope_type: data.recipient_scope_type || null,
        recipient_scope_source: data.recipient_scope_source || null,
        recipient_scope_value: data.recipient_scope_value || "",
        is_return_step: !!data.is_return_step,
        is_terminal: !!data.is_terminal,
        is_active: data.is_active !== false,
        sort_order: Number(data.sort_order ?? 0),
      })
    } else {
      reset()
    }
  }, [mode, data, reset, setData])

  const handleSubmit = (e) => {
    e.preventDefault()

    if (isEdit) {
      put(route("settings.travel-orders.workflows.update", data.id), {
        onSuccess: () => {
          onClose()
          reset()
          toast({
            title: "Success!",
            description: "The workflow transition was updated successfully.",
          })
        },
      })
    } else {
      post(route("settings.travel-orders.workflows.store"), {
        onSuccess: () => {
          onClose()
          reset()
          toast({
            title: "Success!",
            description: "The workflow transition was saved successfully.",
          })
        },
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Workflow Transition" : "Add Workflow Transition"}</DialogTitle>
          <DialogDescription className="text-justify">
            Define the next step, actor scope, and notification routing for a process.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <Label>Process</Label>
              <SingleComboBox
                items={processOptions}
                value={formData.process_key}
                onChange={(value) => setData("process_key", value || "")}
                placeholder="Select process"
                name="process"
                invalidMessage={!!errors.process_key}
              />
              {errors.process_key && <p className="text-xs text-red-500">{errors.process_key}</p>}
            </div>

            <div className="space-y-1">
              <Label>Sort Order</Label>
              <TextInput
                type="number"
                min="0"
                value={formData.sort_order}
                onChange={(e) => setData("sort_order", e.target.value)}
                placeholder="Enter sort order"
                isInvalid={!!errors.sort_order}
              />
              {errors.sort_order && <p className="text-xs text-red-500">{errors.sort_order}</p>}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <Label>From State</Label>
              <SingleComboBox
                items={stateOptions}
                value={formData.from_state}
                onChange={(value) => setData("from_state", value || "")}
                placeholder="Select from state"
                name="from state"
                invalidMessage={!!errors.from_state}
              />
              {errors.from_state && <p className="text-xs text-red-500">{errors.from_state}</p>}
            </div>

            <div className="space-y-1">
              <Label>To State</Label>
              <SingleComboBox
                items={stateOptions}
                value={formData.to_state}
                onChange={(value) => setData("to_state", value || "")}
                placeholder="Select to state"
                name="to state"
                invalidMessage={!!errors.to_state}
              />
              {errors.to_state && <p className="text-xs text-red-500">{errors.to_state}</p>}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <Label>Expected Actor Type</Label>
              <SingleComboBox
                items={actorTypeOptions}
                value={formData.expected_actor_type}
                onChange={(value) => setData("expected_actor_type", value || "")}
                placeholder="Select actor type"
                name="actor type"
                invalidMessage={!!errors.expected_actor_type}
              />
              {errors.expected_actor_type && <p className="text-xs text-red-500">{errors.expected_actor_type}</p>}
            </div>

            <div className="space-y-1">
              <Label>Expected Action</Label>
              <SingleComboBox
                items={actionOptions}
                value={formData.expected_action}
                onChange={(value) => setData("expected_action", value || "")}
                placeholder="Select action"
                name="action"
                invalidMessage={!!errors.expected_action}
              />
              {errors.expected_action && <p className="text-xs text-red-500">{errors.expected_action}</p>}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-1">
              <Label>Actor Scope Type</Label>
              <SingleComboBox
                items={scopeTypeOptions}
                value={formData.actor_scope_type}
                onChange={(value) => setData("actor_scope_type", value)}
                placeholder="Select scope type"
                name="actor scope type"
                invalidMessage={!!errors.actor_scope_type}
              />
              {errors.actor_scope_type && <p className="text-xs text-red-500">{errors.actor_scope_type}</p>}
            </div>
            <div className="space-y-1">
              <Label>Actor Scope Source</Label>
              <SingleComboBox
                items={scopeSourceOptions}
                value={formData.actor_scope_source}
                onChange={(value) => setData("actor_scope_source", value)}
                placeholder="Select scope source"
                name="actor scope source"
                invalidMessage={!!errors.actor_scope_source}
              />
              {errors.actor_scope_source && <p className="text-xs text-red-500">{errors.actor_scope_source}</p>}
            </div>
            <div className="space-y-1">
              <Label>Actor Scope Value</Label>
              <TextInput
                value={formData.actor_scope_value}
                onChange={(e) => setData("actor_scope_value", e.target.value)}
                placeholder="Enter scope value"
                isInvalid={!!errors.actor_scope_value}
              />
              {errors.actor_scope_value && <p className="text-xs text-red-500">{errors.actor_scope_value}</p>}
            </div>
            <div className="space-y-1">
              <Label>Actor Scope Match</Label>
              <SingleComboBox
                items={scopeMatchOptions}
                value={formData.actor_scope_match}
                onChange={(value) => setData("actor_scope_match", value || "exact")}
                placeholder="Select match"
                name="scope match"
                invalidMessage={!!errors.actor_scope_match}
              />
              {errors.actor_scope_match && <p className="text-xs text-red-500">{errors.actor_scope_match}</p>}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-1 md:col-span-2">
              <Label>Notification Label</Label>
              <TextArea
                value={formData.notification_label}
                onChange={(e) => setData("notification_label", e.target.value)}
                placeholder="Describe the notification that should be sent"
                invalidMessage={!!errors.notification_label}
              />
              {errors.notification_label && <p className="text-xs text-red-500">{errors.notification_label}</p>}
            </div>
            <div className="space-y-1">
              <Label>Recipient Role</Label>
              <SingleComboBox
                items={recipientRoleOptions}
                value={formData.recipient_role}
                onChange={(value) => setData("recipient_role", value)}
                placeholder="Select recipient role"
                name="recipient role"
                invalidMessage={!!errors.recipient_role}
              />
              {errors.recipient_role && <p className="text-xs text-red-500">{errors.recipient_role}</p>}
            </div>
            <div className="space-y-1">
              <Label>Recipient Scope Type</Label>
              <SingleComboBox
                items={scopeTypeOptions}
                value={formData.recipient_scope_type}
                onChange={(value) => setData("recipient_scope_type", value)}
                placeholder="Select recipient scope"
                name="recipient scope type"
                invalidMessage={!!errors.recipient_scope_type}
              />
              {errors.recipient_scope_type && <p className="text-xs text-red-500">{errors.recipient_scope_type}</p>}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1">
              <Label>Recipient Scope Source</Label>
              <SingleComboBox
                items={scopeSourceOptions}
                value={formData.recipient_scope_source}
                onChange={(value) => setData("recipient_scope_source", value)}
                placeholder="Select recipient source"
                name="recipient scope source"
                invalidMessage={!!errors.recipient_scope_source}
              />
              {errors.recipient_scope_source && <p className="text-xs text-red-500">{errors.recipient_scope_source}</p>}
            </div>
            <div className="space-y-1">
              <Label>Recipient Scope Value</Label>
              <TextInput
                value={formData.recipient_scope_value}
                onChange={(e) => setData("recipient_scope_value", e.target.value)}
                placeholder="Enter recipient scope value"
                isInvalid={!!errors.recipient_scope_value}
              />
              {errors.recipient_scope_value && <p className="text-xs text-red-500">{errors.recipient_scope_value}</p>}
            </div>
            <div className="space-y-1">
              <Label>Process Notes</Label>
              <div className="rounded-md border p-3 text-xs text-muted-foreground">
                Use these fields to route by division, unit, office, or global scope.
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <div className="flex items-center gap-2 rounded-md border p-3">
              <Checkbox
                checked={!!formData.multiple_assignees}
                onCheckedChange={(checked) => setData("multiple_assignees", !!checked)}
              />
              <Label className="m-0">Multiple Assignees</Label>
            </div>
            <div className="flex items-center gap-2 rounded-md border p-3">
              <Checkbox
                checked={!!formData.is_return_step}
                onCheckedChange={(checked) => setData("is_return_step", !!checked)}
              />
              <Label className="m-0">Return Step</Label>
            </div>
            <div className="flex items-center gap-2 rounded-md border p-3">
              <Checkbox
                checked={!!formData.is_terminal}
                onCheckedChange={(checked) => setData("is_terminal", !!checked)}
              />
              <Label className="m-0">Terminal Step</Label>
            </div>
            <div className="flex items-center gap-2 rounded-md border p-3">
              <Checkbox
                checked={!!formData.is_active}
                onCheckedChange={(checked) => setData("is_active", !!checked)}
              />
              <Label className="m-0">Active</Label>
            </div>
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

