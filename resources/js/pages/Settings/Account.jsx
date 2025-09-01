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
import FileUpload from "@/components/FileUpload"

const Account = () => {

  const { toast } = useToast()

  const {
    accountState,
    fetchAccount,
  } = useSettingsStore()

  const [loading, setLoading] = useState(true)

  const { data, setData, post, processing, errors } = useForm({
    last_name: '',
    first_name: '',
    middle_name: '',
    signature: null,
    digital_sig: null,
  })

  useEffect(() => {
    const load = async () => {
      await fetchAccount()
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    if (!loading && accountState) {
      setData({
        last_name: accountState.last_name || '',
        first_name: accountState.first_name || '',
        middle_name: accountState.middle_name || '',
        signature: accountState.signature || null,
        digital_sig: accountState.digital_sig || null,
      })
    }
  }, [accountState, loading])

  const handleSubmit = (e) => {
    e.preventDefault()
    post(route('settings.account.update'), {
      preserveScroll: true,
      onSuccess: () => {
        toast({ title: 'Saved', description: 'Settings updated successfully.' })
      },
    })
  }

  const fields = [
    {
      label: 'Last Name',
      description: 'Update your last name',
      key: 'last_name',
    },
    {
      label: 'First Name',
      description: 'Update your first name',
      key: 'first_name',
    },
    {
      label: 'Middle Name',
      description: 'Update your middle name',
      key: 'middle_name',
    },
  ]

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader className="space-y-0 pb-4">
          <CardTitle className="text-lg">Account</CardTitle>
          <CardDescription className="text-sm">
            You can change settings here for your account
          </CardDescription>
        </CardHeader>

        <CardContent className="border-t divide-y">
            {fields.map(({ label, description, key }) => (
                <div key={key} className="flex items-start gap-4 px-4 py-6">
                    <div className="flex flex-col w-1/3">
                        <span className="text-sm font-semibold">{label}</span>
                        <span className="text-xs text-muted-foreground">{description}</span>
                    </div>
                    <div className="flex-1 flex flex-col gap-2">
                    <TextInput
                        type="text"
                        value={data[key] ?? ''}
                        onChange={(e) => setData(key, e.target.value)}
                        className="border px-2 py-1 rounded text-sm"
                    />
                    {errors[key] && <span className="text-xs text-red-500">{errors[key]}</span>}
                    </div>
                </div>
                ))}

                {/* Signature */}
                <div key="signature" className="flex items-start gap-4 px-4 py-6">
                    <div className="flex flex-col w-1/3">
                        <span className="text-sm font-semibold">e-Signature</span>
                        <span className="text-xs text-muted-foreground">Upload your e-signature (PNG/JPG, max 4MB)</span>
                    </div>
                    <div className="flex-1 flex flex-col gap-2">
                        {data.signature && (
                        <div className="w-full h-24 border rounded flex items-center justify-center overflow-hidden bg-gray-50">
                            <img
                            src={
                                typeof data.signature === "string"
                                ? data.signature
                                : URL.createObjectURL(data.signature)
                            }
                            alt="Signature Preview"
                            className="max-h-24 object-contain"
                            />
                        </div>
                        )}
                        <FileUpload
                        data={data.signature}
                        onFilesSelect={(files) => setData('signature', files[0])}
                        multiple={false}
                        maxFiles={1}
                        maxFileSize={4096}
                        allowedTypes={["jpg", "jpeg", "png"]}
                        />
                        {errors.signature && <span className="text-xs text-red-500">{errors.signature}</span>}
                    </div>
                </div>

                {/* Digital Signature */}
                <div key="digital_sig" className="flex items-start gap-4 px-4 py-6">
                    <div className="flex flex-col w-1/3">
                        <span className="text-sm font-semibold">Digital Signature</span>
                        <span className="text-xs text-muted-foreground">Upload your digital signature (p12 file)</span>
                    </div>
                    <div className="flex-1 flex flex-col gap-2">
                        {data.digital_sig ? (
                        typeof data.digital_sig === "string" ? (
                            <div className="text-sm text-gray-600">Signature Uploaded</div>
                        ) : (
                            <div className="text-sm text-gray-600">Selected file: {data.digital_sig.name}</div>
                        )
                        ) : null}
                        <FileUpload
                        data={data.digital_sig}
                        onFilesSelect={(files) => setData('digital_sig', files[0])}
                        multiple={false}
                        maxFiles={1}
                        allowedTypes={["application/x-pkcs12"]}
                        />
                        {errors.digital_sig && <span className="text-xs text-red-500">{errors.digital_sig}</span>}
                    </div>
                </div>
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

export default Account
