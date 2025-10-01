import { Badge } from "@/components/ui/badge"

const jobTypeMap = {
  Permanent: {
    label: "Permanent",
    className: "bg-green-100 text-green-700 hover:bg-green-100 hover:text-green-700",
  },
  Casual: {
    label: "Casual",
    className: "bg-blue-100 text-blue-700 hover:bg-blue-100 hover:text-blue-700",
  },
  Contractual: {
    label: "Contractual",
    className: "bg-orange-100 text-orange-700 hover:bg-orange-100 hover:text-orange-700",
  },
  "Contract of Service": {
    label: "Contract of Service",
    className: "bg-purple-100 text-purple-700 hover:bg-purple-100 hover:text-purple-700",
  },
  "Job Order": {
    label: "Job Order",
    className: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100 hover:text-yellow-700",
  },
  Temporary: {
    label: "Temporary",
    className: "bg-gray-100 text-gray-700 hover:bg-gray-100 hover:text-gray-700",
  },
}

const JobTypeBadge = ({ type }) => {
  if (!type) return null

  const { label, className } = jobTypeMap[type] || jobTypeMap["Temporary"]

  return (
    <Badge
      className={`border-gray-200 rounded-md text-xs font-medium h-fit w-fit px-2 py-[2px] ${className}`}
    >
      {label}
    </Badge>
  )
}

export default JobTypeBadge
