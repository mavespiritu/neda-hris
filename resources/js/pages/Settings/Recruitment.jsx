import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import TextInput from "@/components/TextInput"
import SingleComboBox from "@/components/SingleComboBox"
import { Switch } from "@/components/ui/switch"
import useSettingsStore from '@/stores/useSettingsStore'
import { useState, useEffect } from "react"
import { useForm } from '@inertiajs/react'
import { useToast } from "@/hooks/use-toast"
import { Loader2, Plus, Trash2 } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const sections = [
  { value: 'Educational Background', label: 'Educational Background' },
  { value: 'Civil Service Eligibility', label: 'Civil Service Eligibility' },
  { value: 'Work Experience', label: 'Work Experience' },
  { value: 'Voluntary Work', label: 'Voluntary Work' },
  { value: 'Learning and Development', label: 'Learning and Development' },
  { value: 'Other Information', label: 'Other Information' },
]

const Recruitment = () => {
  const { toast } = useToast()
  const { recruitmentState, fetchRecruitment } = useSettingsStore()
  const [loading, setLoading] = useState(true)

  const { data, setData, patch, processing, errors } = useForm({
    requirements: [],
  })

  // Helper to sync form state with store
  const syncFormWithStore = () => {
    if (!recruitmentState) return
    setData({
      requirements: recruitmentState.requirements.map(req => ({
        id: req.id || null,
        requirement: req.requirement || '',
        is_default: !!req.is_default,
        is_multiple: !!req.is_multiple,
        connected_to: req.connected_to || '',
      })),
    })
  }

  // Initial load
  useEffect(() => {
    const load = async () => {
      await fetchRecruitment()
      setLoading(false)
    }
    load()
  }, [])

  // Sync when recruitmentState changes
 useEffect(() => {
  if (!loading && recruitmentState) {
    setData({
      requirements: recruitmentState.requirements.map(req => ({
        id: req.id || null,
        requirement: req.requirement || '',
        is_default: !!req.is_default,
        is_multiple: !!req.is_multiple,
        connected_to: req.connected_to || '',
      })),
    })
  }
}, [recruitmentState, loading])

  const handleRequirementChange = (index, field, value) => {
    const updated = [...data.requirements]
    updated[index][field] = value
    setData('requirements', updated)
  }

  const addRequirementRow = () => {
    setData('requirements', [
      ...data.requirements,
      { id: null, requirement: '', is_default: false, is_multiple: false, connected_to: '' },
    ])
  }

  const removeRequirementRow = (index) => {
    const updated = [...data.requirements]
    updated.splice(index, 1)
    setData('requirements', updated)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    patch(route('settings.recruitment.update'), {
      requirements: data.requirements,
      preserveScroll: true,
      onSuccess: async () => {
        toast({ title: 'Saved', description: 'Settings updated successfully.' })
        await fetchRecruitment() // no need to call syncFormWithStore() manually
      },
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader className="space-y-0 pb-4">
          <CardTitle className="text-lg">Recruitment</CardTitle>
          <CardDescription className="text-sm">
            You can change settings here for recruitment procedures
          </CardDescription>
        </CardHeader>

        <CardContent className="border-t divide-y">
          <div className="flex justify-between items-start gap-4 px-4 py-6">
            <div className="flex flex-col basis-1/3">
              <span className="text-sm font-semibold">Requirements</span>
              <span className="text-xs text-muted-foreground">Set list of requirements</span>
            </div>
            <div className="border rounded-lg flex-1 w-2/3 overflow-auto">
              <Table>
                <TableHeader className="text-xs">
                  <TableRow>
                    <TableHead className="w-8">#</TableHead>
                    <TableHead className="w-[40%]">Requirement</TableHead>
                    <TableHead className="text-center">Is Default?</TableHead>
                    <TableHead className="text-center">Allow Multiple Files?</TableHead>
                    <TableHead className="w-[20%] text-center">PDS Section</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.requirements.map((req, index) => (
                    <TableRow key={req.id || index}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <TextInput
                          name="requirement"
                          onChange={(e) => handleRequirementChange(index, 'requirement', e.target.value)}
                          isInvalid={errors[`requirements.${index}.requirement`]}
                          placeholder=""
                          value={req.requirement}
                        />
                        {errors?.[`requirements.${index}.requirement`] && (
                          <span className="text-red-500 text-xs">
                            {errors[`requirements.${index}.requirement`]}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={req.is_default}
                          onCheckedChange={(checked) => handleRequirementChange(index, 'is_default', checked)}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={req.is_multiple}
                          onCheckedChange={(checked) => handleRequirementChange(index, 'is_multiple', checked)}
                        />
                      </TableCell>
                      <TableCell>
                        <SingleComboBox
                          items={sections}
                          placeholder="Select one"
                          onChange={(value) => handleRequirementChange(index, 'connected_to', value)}
                          invalidMessage={errors[`requirements.${index}.connected_to`]}
                          value={req.connected_to}
                          className="w-40"
                        />
                        {errors?.[`requirements.${index}.connected_to`] && (
                          <span className="text-red-500 text-xs">
                            {errors[`requirements.${index}.connected_to`]}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeRequirementRow(index)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={6}>
                      <Button type="button" onClick={addRequirementRow} variant="outline" size="sm" className="w-full">
                        <Plus className="w-4 h-4 mr-2" /> Add Requirement
                      </Button>
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          </div>
        </CardContent>

        <CardFooter className="px-4 py-4 flex justify-end">
          <Button type="submit" disabled={processing}>
            {processing && <Loader2 className="animate-spin w-4 h-4 mr-2" />}
            Save Changes
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}

export default Recruitment
