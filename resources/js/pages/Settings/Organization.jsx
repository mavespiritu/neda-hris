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
import useSettingsStore from '@/stores/useSettingsStore'
import { useState, useEffect } from "react"
import { useForm } from '@inertiajs/react'
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

const Organization = () => {

  const { toast } = useToast()

  const {
    organizationState,
    fetchOrganization,
  } = useSettingsStore()

  const [loading, setLoading] = useState(true)

  const { data, setData, patch, processing } = useForm({
    agency_name_long: '',
    agency_name_short: '',
    agency_head: '',
    agency_head_position: '',
    agency_sub_head: '',
    agency_sub_head_position: '',
    agency_address: '',
  })

  useEffect(() => {
    const load = async () => {
      await fetchOrganization()
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    if (!loading && organizationState) {
      setData({
        agency_main_name_long: organizationState.agency_main_name_long || '',
        agency_main_name_short: organizationState.agency_main_name_short || '',
        agency_name_long: organizationState.agency_name_long || '',
        agency_name_short: organizationState.agency_name_short || '',
        agency_head: organizationState.agency_head || '',
        agency_head_position: organizationState.agency_head_position || '',
        agency_sub_head: organizationState.agency_sub_head || '',
        agency_sub_head_position: organizationState.agency_sub_head_position || '',
        agency_address: organizationState.agency_address || '',
      })
    }
  }, [organizationState, loading])

  const handleSubmit = (e) => {
    e.preventDefault()
    patch(route('settings.organization.update'), {
      preserveScroll: true,
      onSuccess: () => {
        toast({ title: 'Saved', description: 'Settings updated successfully.' })
      },
    })
  }

  const fields = [
    {
      label: 'Full Name of Agency (Main)',
      description: 'Update the full name of the main agency',
      key: 'agency_main_name_long',
    },
    {
      label: 'Short Name of Agency (Main)',
      description: 'Update the short name of the main agency',
      key: 'agency_main_name_short',
    },
    {
      label: 'Full Name of Agency',
      description: 'Update the full name of the agency',
      key: 'agency_name_long',
    },
    {
      label: 'Short Name of Agency',
      description: 'Update the short name of the agency',
      key: 'agency_name_short',
    },
    {
      label: 'Head of Agency',
      description: 'Update the name of the head of agency',
      key: 'agency_head',
    },
    {
      label: 'Head Position',
      description: 'Update the position of the head of agency',
      key: 'agency_head_position',
    },
    {
      label: 'Assistant Head of Agency',
      description: 'Update the name of the assistant head of agency',
      key: 'agency_sub_head',
    },
    {
      label: 'Assistant Head Position',
      description: 'Update the position of the assistant head of agency',
      key: 'agency_sub_head_position',
    },
    {
      label: 'Office Address',
      description: 'Update the address of the agency office',
      key: 'agency_address',
    },
  ]

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader className="space-y-0 pb-4">
          <CardTitle className="text-lg">Organization</CardTitle>
          <CardDescription className="text-sm">
            You can change settings here for organization info
          </CardDescription>
        </CardHeader>

        <CardContent className="border-t divide-y">
          {fields.map(({ label, description, key }) => (
            <div key={key} className="flex justify-between items-center gap-4 px-4 py-6">
              <div className="flex flex-col basis-1/2">
                <span className="text-sm font-semibold">{label}</span>
                <span className="text-xs text-muted-foreground">{description}</span>
              </div>
              <TextInput
                type="text"
                value={data[key] ?? ''}
                onChange={(e) => setData(key, e.target.value)}
                className="border px-2 py-1 rounded w-1/2 text-sm"
              />
            </div>
          ))}
        </CardContent>

        <CardFooter className="px-4 py-4 flex justify-end">
          <Button type="submit" disabled={processing}>
            {processing ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
            Save Changes
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}

export default Organization
