import { useMemo, useState } from "react"
import { Star } from "lucide-react"
import { usePage } from "@inertiajs/react"
import PageTitle from "@/components/PageTitle"
import useCrudTable from "@/hooks/useCrudTable"

const breadcrumbItems = [
  { label: "Home", href: "/" },
  { label: "Recruitment", href: "#" },
  { label: "Feedbacks", href: "/feedbacks" },
]

const StarRating = ({ value = 0 }) => {
  const filled = Number(value) || 0

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }, (_, index) => {
        const starValue = index + 1
        const active = starValue <= filled

        return (
          <Star
            key={starValue}
            className={`h-4 w-4 ${active ? "fill-amber-400 text-amber-400" : "text-slate-300"}`}
          />
        )
      })}
      <span className="ml-1 text-xs font-medium text-slate-600">{filled}/5</span>
    </div>
  )
}

const formatSubmittedAt = (value) => {
  if (!value) return "-"

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "-"

  const formatter = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  })

  const parts = formatter.formatToParts(date)
  const dateParts = parts.filter((part) => ["month", "day", "year"].includes(part.type)).map((part) => part.value)
  const timeParts = parts.filter((part) => ["hour", "minute", "second", "dayPeriod"].includes(part.type)).map((part) => part.value)

  return `${dateParts.join(" ")} ${timeParts.join(":")}`
}

const Feedbacks = () => {
  const { data: { feedbacks } } = usePage().props
  const [filters] = useState({})
  const feedbackTableData = feedbacks ?? {
    data: [],
    current_page: 1,
    last_page: 1,
    per_page: 20,
  }

  const columns = useMemo(
    () => [
      {
        header: "Position Applied",
        accessorKey: "position_applied",
        meta: { enableSorting: true },
      },
      {
        header: "Date Submitted",
        accessorKey: "date_submitted",
        meta: { enableSorting: true },
        cell: ({ row }) => {
          const value = row.original.date_submitted
          return formatSubmittedAt(value)
        },
      },
      {
        header: "Applicant",
        accessorKey: "applicant_name",
        meta: { enableSorting: true },
      },
      {
        header: "Rating",
        accessorKey: "rating",
        meta: { enableSorting: true },
        cell: ({ row }) => <StarRating value={row.original.rating} />,
      },
      {
        header: "Improvement Feedback",
        accessorKey: "feedback",
        cell: ({ row }) => (
          <span className="block whitespace-normal break-words text-sm text-slate-700">
            {row.original.feedback || "-"}
          </span>
        ),
      },
    ],
    []
  )

  const { TableView } = useCrudTable({
    columns,
    routeName: route("feedbacks.index"),
    initialData: feedbackTableData,
    filters,
    responseType: "inertia",
    options: {
      enableAdd: false,
      enableEdit: false,
      enableView: false,
      enableViewAsLink: false,
      enableDelete: false,
      enableBulkDelete: false,
      enableSearching: true,
      enableFiltering: false,
      enableRowSelection: false,
      canModify: false,
    },
  })

  return (
    <div className="flex h-full flex-col gap-4">
      <PageTitle
        pageTitle="Feedbacks"
        description="Review submitted applicant feedback after application submission."
        breadcrumbItems={breadcrumbItems}
      />
      <div className="overflow-x-auto">
        <div className="relative">
          <TableView />
        </div>
      </div>
    </div>
  )
}

export default Feedbacks
