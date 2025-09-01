import { useState, useEffect } from "react"
import PageTitle from "@/components/PageTitle"
import { Head, usePage, router, useForm, Link } from "@inertiajs/react"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import TextInput from "@/components/TextInput"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import RichTextEditor from "@/components/RichTextEditor"
import FileUpload from "@/components/FileUpload"
import { 
    Search, 
    ThumbsUp, 
    Plus, 
    ThumbsDown, 
    Trash2, 
    Pencil, 
    ChevronLeft, 
    Printer, 
    Settings, 
    ChevronDown,
    Eye,
    EyeOff,
    Loader2 
} from 'lucide-react'

const Form = () => {
  const { toast } = useToast()
  const { url, target } = usePage().props

  console.log(target)

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Flexiplace" },
    { label: "RAA", href: "/raa" },
    { label: "Accomplish", href: url },
  ]

  const initialOutputs = target.outputs.map((t) => ({
    target_id: t.id,
    output: t.output,
    accomplishments: t.accomplishments.length > 0 
      ? t.accomplishments.map((acc) => ({
          id: acc.id,
          accomplishment: acc.accomplishment || "",
          remarks: acc.remarks || "",
          existingFiles: acc.files || [],   
          files: [],
          removedFiles: [],
        }))
      : [
          {
            id: null,
            accomplishment: "",
            remarks: "",
            files: [],
            removedFiles: [],
          },
        ],
    removedAccomplishments: [],
  }))

  const { data, setData, post, processing, errors, progress } = useForm({
    outputs: initialOutputs,
  })

  const [fileErrors, setFileErrors] = useState({})

  const handleAddAccomplishment = (outputIndex) => {
    const updated = [...data.outputs]
    updated[outputIndex].accomplishments.push({
      id: null,
      accomplishment: "",
      remarks: "",
      files: [],
      removedFiles: [],
    })
    setData("outputs", updated)
  }

  const handleRemoveAccomplishment = (outputIndex, accIndex) => {
    const updated = [...data.outputs]
    const removed = updated[outputIndex].accomplishments.splice(accIndex, 1)[0]

    if (removed?.id) {
      updated[outputIndex].removedAccomplishments.push(removed.id)
    }

    setData("outputs", updated)
  }

  const handleChange = (outputIndex, accIndex, field, value) => {
    const updated = [...data.outputs]
    updated[outputIndex].accomplishments[accIndex][field] = value
    setData("outputs", updated)
  }

  const handleFileSelect = (outputIndex, accIndex, files) => {
    const updated = [...data.outputs]
    updated[outputIndex].accomplishments[accIndex].files = [
      ...updated[outputIndex].accomplishments[accIndex].files,
      ...files,
    ]
    setData("outputs", updated)
  }

  const handleFileRemove = (outputIndex, accIndex, fileToRemove) => {
    const updated = [...data.outputs]
    const acc = updated[outputIndex].accomplishments[accIndex]

    if (fileToRemove.id) {
      // It's an existing DB file
      acc.existingFiles = acc.existingFiles.filter(f => f.id !== fileToRemove.id)
      acc.removedFiles.push(fileToRemove.id)
    } else {
      // It's a new File object
      acc.files = acc.files.filter((f) => f !== fileToRemove)
    }

    setData("outputs", updated)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    post(route("raa.store", target.id), {
      preserveScroll: true,
      onSuccess: () => {
        toast({ title: "Success", description: "Accomplishments saved!" })
        router.visit(route("raa.index"))
      },
    })
  }

  useEffect(() => {
    const errorsObj = {}
    data.outputs.forEach((output, oIdx) => {
      output.accomplishments.forEach((acc, aIdx) => {
        // Grab all errors that start with this accomplishment's files
        const baseKey = `outputs.${oIdx}.accomplishments.${aIdx}.files`
        const relatedErrors = Object.entries(errors)
          .filter(([key]) => key.startsWith(baseKey))
          .map(([_, msg]) => msg)

        if (relatedErrors.length > 0) {
          errorsObj[baseKey] = relatedErrors
        }
      })
    })
    setFileErrors(errorsObj)
  }, [errors, data.outputs])

  return (
    <div className="h-full flex flex-col gap-2">
      <Head title="Accomplish RAA" />

      <div className="flex justify-between">
        <Link href={route("raa.index")} className="hidden md:block">
          <Button
            variant="ghost"
            className="flex items-center rounded-md disabled:opacity-50"
            size="sm"
          >
            <ChevronLeft className="h-8 w-8" />
            <span className="sr-only sm:not-sr-only">Back to RAAs</span>
          </Button>
        </Link>
      </div>

      <PageTitle
        pageTitle="Accomplish RAA"
        description="Record your actual accomplishments here if you are under flexiplace arrangement"
        breadcrumbItems={breadcrumbItems}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {data.outputs.map((output, outputIndex) => (
          <Card key={output.target_id} className="shadow-sm">
            <CardHeader>
              <CardTitle className="font-semibold text-lg">
                Target Output # {outputIndex + 1}: {output.output}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {output.accomplishments.map((acc, accIndex) => (
                <div key={acc.id ?? `new-${accIndex}`}  className="border rounded-lg p-4 space-y-3 bg-gray-50">
                  <div className="space-y-1">
                  <Label>Actual Accomplishment (include link to actual output if applicable)</Label>
                  <RichTextEditor
                    name="remarks"
                    onChange={(value) =>
                      handleChange(outputIndex, accIndex, "accomplishment", value)
                    }
                    isInvalid={errors[`outputs.${outputIndex}.accomplishments.${accIndex}.accomplishment`]}
                    value={acc.accomplishment}
                  />
                  {errors[`outputs.${outputIndex}.accomplishments.${accIndex}.accomplishment`] && (
                    <span className="text-red-500 text-xs">
                      {errors[`outputs.${outputIndex}.accomplishments.${accIndex}.accomplishment`]}
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                  <Label>Remarks/Justification</Label>
                  <TextInput
                    value={acc.remarks}
                    onChange={(e) =>
                      handleChange(outputIndex, accIndex, "remarks", e.target.value)
                    }
                    isInvalid={errors[`outputs.${outputIndex}.accomplishments.${accIndex}.remarks`]}
                  />
                  {errors[`outputs.${outputIndex}.accomplishments.${accIndex}.remarks`] && (
                    <span className="text-red-500 text-xs">
                      {errors[`outputs.${outputIndex}.accomplishments.${accIndex}.remarks`]}
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-4">
                  <div className="space-y-1">
                    <Label>MOVs (if applicable)</Label>
                    <FileUpload
                      data={acc.files || []}
                      onFilesSelect={(files) => handleFileSelect(outputIndex, accIndex, files)}
                      multiple
                      maxFiles={5}
                      maxFileSize={5 * 1024 * 1024}
                      allowedTypes={["jpg", "jpeg", "png", "pdf", "xlsx", "docx", "xls", "doc", "ppt", "pptx", "txt"]}
                      invalidMessage={fileErrors[`outputs.${outputIndex}.accomplishments.${accIndex}.files`]}
                    />
                    {progress && (
                      <div className="flex flex-col">
                        <span className="text-xs">Uploading. Please wait</span>
                        <progress value={progress.percentage} max="100">
                            {progress.percentage}%
                        </progress>
                      </div>
                    )}
                    {fileErrors[`outputs.${outputIndex}.accomplishments.${accIndex}.files`] ? (
                      <div className="text-red-500 text-xs">
                        {fileErrors[`outputs.${outputIndex}.accomplishments.${accIndex}.files`]
                          .map((msg, index) => (
                            <span key={index}>
                              {msg}
                              <br />
                            </span>
                          ))}
                      </div>
                    ) : (
                      <div className="inline-flex justify-between text-xs text-muted-foreground w-full">
                        <span>max no. of files: 5 (max of 5MB each)</span>
                        <span>allowed types: jpg, jpeg, png, pdf, xlsx, docx, xls, doc, ppt, pptx, txt</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    {acc.existingFiles?.length > 0 && (
                      <div className="flex flex-col gap-2">
                        {acc.existingFiles.map((file) => (
                          <div key={file.id} className="flex justify-between items-center text-xs">
                            <a
                              href={route("files.download", file.id)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              {file.name}
                            </a>
                            <button
                              type="button"
                              className="text-red-500 hover:underline"
                              onClick={() => handleFileRemove(outputIndex, accIndex, file)}
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {acc.files?.length > 0 && (
                      <div className="flex flex-col gap-2">
                        {acc.files.map((file, fIdx) => (
                          <div
                            key={`${file.name}-${fIdx}`}
                            className="flex justify-between items-center text-xs"
                          >
                            <span>{file.name}</span>
                            <button
                              type="button"
                              className="text-red-500 hover:underline"
                              onClick={() => handleFileRemove(outputIndex, accIndex, file)}
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  </div>

                  {output.accomplishments.length > 1 && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoveAccomplishment(outputIndex, accIndex)}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Remove
                    </Button>
                  )}
                </div>
              ))}

              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => handleAddAccomplishment(outputIndex)}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Accomplishment
              </Button>
            </CardContent>
          </Card>
        ))}

        {[null, "Needs Revision"].includes(target.raa_status) && (
          <div className="flex justify-end">
            <Button type="submit" disabled={processing}>
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>Please wait</span>
                </>
              ) : (
                'Save Accomplishments'
              )}
            </Button>
          </div>
        )}
      </form>
    </div>
  )
}

export default Form