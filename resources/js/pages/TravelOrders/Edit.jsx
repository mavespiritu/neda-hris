import PageTitle from "@/components/PageTitle"
import { Head, Link, usePage } from "@inertiajs/react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Form from "./Form"

const Edit = () => {
  const { data } = usePage().props

  const travelOrderId = data.data.id

  const categories = data?.categories ?? []
  const fundSources = data?.fundSources ?? []
  const employees = data?.employees ?? []
  const approver = data?.approver ?? null
  const referenceNo = data?.reference_no ?? ""
  const formData = data?.data ?? ""

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Travel Requests", href: route("travel-requests.index") },
    { label: "Edit", href: route("travel-requests.edit", { id: travelOrderId }) },
  ]

  return (
    <div className="h-full flex flex-col">
      <Head title="Travel Request" />

      <div className="flex justify-between mb-2">
        <Link href={route("travel-requests.index")} className="hidden md:block">
          <Button
            variant="ghost"
            className="flex items-center rounded-md disabled:opacity-50"
            size="sm"
          >
            <ChevronLeft className="h-8 w-8" />
            <span className="sr-only sm:not-sr-only">Back to Travel Requests</span>
          </Button>
        </Link>

        <Link
          href={route("travel-requests.show", { id: travelOrderId })}
          className="hidden md:block"
        >
          <Button
            variant="ghost"
            className="flex items-center rounded-md disabled:opacity-50"
            size="sm"
          >
            <span className="sr-only sm:not-sr-only">Go to Travel Request No. {data?.reference_no}</span>
            <ChevronRight className="h-8 w-8" />
          </Button>
        </Link>
      </div>

      <PageTitle
        pageTitle="Edit Travel Request"
        description="File your travel request here."
        breadcrumbItems={breadcrumbItems}
      />

      <Form
        categories={categories}
        fundSources={fundSources}
        employees={employees}
        approver={approver}
        mode="edit"
        data={formData}
        referenceNo={referenceNo}
      />
    </div>
  )
}

export default Edit
