import { useState, useEffect } from "react"
import { useForm, usePage, Link } from "@inertiajs/react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog"
import SearchableComboBox from "@/components/SearchableComboBox"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { formatDate } from "@/lib/utils.jsx"
import DatePicker from "@/components/DatePicker"

const Form = ({mode, data, onClose, open}) => {

  console.log(data)

  const isEdit = mode === "edit"

  const [selectedApplicantInfo, setSelectedApplicantInfo] = useState(null)
  const [selectedVacancyInfo, setSelectedVacancyInfo] = useState(null)
  const [cityName, setCityName] = useState("")
  const [provinceName, setProvinceName] = useState("")
  const [barangayName, setBarangayName] = useState("")
  const [loadingAddress, setLoadingAddress] = useState(false)

  const { 
    data: formData, 
    setData, 
    post, 
    put, 
    processing, 
    reset, 
    errors 
  } = useForm({
    applicant_id: "",
    vacancy_id: "",
    date_submitted: "",
  })

  useEffect(() => {
    if (isEdit && data) {
      setData({
        id: data.id || null,
        applicant_id: data.applicant_id || "",
        vacancy_id: data.vacancy_id || "",
        date_submitted: data.date_submitted || "",
      })
    } else {
      reset()
    }
  }, [mode, data])

  console.log(data)

  // Fetch PSGC names when an applicant is selected
  useEffect(() => {
    const fetchAddressNames = async () => {
      if (!selectedApplicantInfo) return

      const {
        residential_city,
        residential_province,
        residential_barangay,
      } = selectedApplicantInfo

      if (!residential_city && !residential_province && !residential_barangay) {
        setCityName("")
        setProvinceName("")
        setBarangayName("")
        return
      }

      setLoadingAddress(true)
      try {
        const [cityRes, provinceRes, barangayRes] = await Promise.all([
          residential_city
            ? fetch(
                `https://psgc.gitlab.io/api/cities-municipalities/${residential_city}/`
              ).then((res) => (res.ok ? res.json() : null))
            : null,
          residential_province
            ? fetch(
                `https://psgc.gitlab.io/api/provinces/${residential_province}/`
              ).then((res) => (res.ok ? res.json() : null))
            : null,
          residential_barangay
            ? fetch(
                `https://psgc.gitlab.io/api/barangays/${residential_barangay}/`
              ).then((res) => (res.ok ? res.json() : null))
            : null,
        ])

        setCityName(cityRes?.name || residential_city || "")
        setProvinceName(provinceRes?.name || residential_province || "")
        setBarangayName(barangayRes?.name || residential_barangay || "")
      } catch (error) {
        console.error("Error fetching PSGC data:", error)
        setCityName(residential_city || "")
        setProvinceName(residential_province || "")
        setBarangayName(residential_barangay || "")
      } finally {
        setLoadingAddress(false)
      }
    }

    fetchAddressNames()
  }, [selectedApplicantInfo])

  const handleSubmit = (e) => {
    e.preventDefault()

    if (isEdit) {
      put(route("applications.update", data.id), {
        onSuccess: () => {
          onClose()
          reset()
          toast({
            title: "Success!",
            description: "The item was updated successfully.",
          })
        },
      })
    } else {
      post(route("applications.store"), {
        onSuccess: () => {
          onClose()
          reset()
          toast({
            title: "Success!",
            description: "The item was saved successfully.",
          })
        },
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Application" : "Add Application"}</DialogTitle>
          <DialogDescription className="text-justify">Fill-up all required fields.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label>Applicant</Label>
            <SearchableComboBox
              name="applicant_id"
              placeholder="Search applicants..."
              apiUrl={route("applications.applicants.search")}
              onChange={(val, item) => {
                setData("applicant_id", val)
                setSelectedApplicantInfo(item)
              }}
              value={formData.applicant_id}
              selectedItem={isEdit ? { 
                  value: data.applicant_id, 
                  label: `${data.name} (${data.email_address ? data.email_address : "No Email Address"})`,
              } : null}
              invalidMessage={errors.applicant_id}
            />
            {errors.applicant_id && (
              <span className="text-red-500 text-xs">
                {errors.applicant_id}
              </span>
            )}
            {selectedApplicantInfo && (
              <div className="mt-3 text-sm border rounded-lg p-3 bg-gray-50 space-y-1">
                <p>
                  <strong>Name:</strong> {selectedApplicantInfo.label}
                </p>
                <p>
                  <strong>Email Address:</strong>{" "}
                  {selectedApplicantInfo.email_address || "—"}
                </p>
                <p>
                  <strong>Mobile No.:</strong>{" "}
                  {selectedApplicantInfo.mobile_no || "—"}
                </p>
                <p>
                  <strong>Birth Date:</strong>{" "}
                  {formatDate(selectedApplicantInfo.birth_date) || "—"}
                </p>
                <p>
                  <strong>Residential Address:</strong>{" "}
                  {loadingAddress ? (
                    <span className="text-gray-500">Loading...</span>
                  ) : (
                    <>
                      {selectedApplicantInfo.residential_house_no
                        ? `${selectedApplicantInfo.residential_house_no}, `
                        : ""}
                      {selectedApplicantInfo.residential_street
                        ? `${selectedApplicantInfo.residential_street}, `
                        : ""}
                      {barangayName && `${barangayName}, `}
                      {cityName && `${cityName}, `}
                      {provinceName && `${provinceName} `}
                      {selectedApplicantInfo.residential_zip
                        ? `(${selectedApplicantInfo.residential_zip})`
                        : ""}
                    </>
                  )}
                </p>
              </div>
            )}
          </div>
          <div className="space-y-1">
            <Label>Vacancy</Label>
            <SearchableComboBox
              name="vacancy_id"
              placeholder="Search vacancies..."
              apiUrl={route("applications.vacancies.search")}
              onChange={(val, item) => {
                setData("vacancy_id", val)
                setSelectedVacancyInfo(item)
              }}
              value={formData.vacancy_id}
              selectedItem={isEdit ? { 
                  value: data.vacancy_id, 
                  label: `${data.publication.reference_no}: ${data.vacancy.position_description} (${data.vacancy.item_no})`,
              } : null}
              invalidMessage={errors.vacancy_id}
            />
            {errors.vacancy_id && (
              <span className="text-red-500 text-xs">
                {errors.vacancy_id}
              </span>
            )}

            {selectedVacancyInfo && (
              <div className="mt-3 text-sm border rounded-lg p-3 bg-gray-50 space-y-1">
                <p>
                  <strong>Position:</strong> {selectedVacancyInfo.position}
                </p>
                {selectedVacancyInfo.item_no && (
                  <p>
                  <strong>Item No:</strong> {selectedVacancyInfo.item_no}
                </p>
                )}
                <p>
                  <strong>Publication No.:</strong>{" "}
                  {selectedVacancyInfo.publish_no || "—"}
                </p>
                <p>
                  <strong>Posting Date:</strong>{" "}
                  {formatDate(selectedVacancyInfo.date_published) || "—"}
                </p>
                <p>
                  <strong>Closing Date:</strong>{" "}
                  {formatDate(selectedVacancyInfo.date_closed) || "—"}
                </p>
              </div>
            )}
          </div>
          <div className="space-y-1">
            <Label>Date Submitted</Label>
            <DatePicker
                placeholder="Select a date"
                value={formData.date_submitted}
                onDateChange={(date) => setData('date_submitted', date)}
                invalidMessage={errors.date_submitted}
            />
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
