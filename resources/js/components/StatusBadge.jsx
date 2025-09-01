import { Badge } from "@/components/ui/badge"
import {
  CheckCircle,
  ShieldCheck,
  XCircle,
  Ban,
  Clock,
  FileText,
  Edit3,
} from "lucide-react"

const statusMap = {
  Approved: {
    label: "Approved",
    className: "bg-green-100 text-green-700",
    icon: CheckCircle,
  },
  Endorsed: {
    label: "Endorsed",
    className: "bg-yellow-100 text-yellow-700",
    icon: ShieldCheck,
  },
  "Needs Revision": {
    label: "Needs Revision",
    className: "bg-red-100 text-red-700",
    icon: Edit3,
  },
  Disapproved: {
    label: "Disapproved",
    className: "bg-red-300 text-red-800",
    icon: Ban,
  },
  Submitted: {
    label: "Submitted",
    className: "bg-gray-100 text-gray-700",
    icon: FileText,
  },
  Pending: {
    label: "Pending",
    className: "bg-muted text-muted-foreground",
    icon: Clock,
  },
  Draft: {
    label: "Draft",
    className: "bg-muted text-muted-foreground",
    icon: FileText,
  },
}

const StatusBadge = ({ status }) => {
  if (!status) return null   // ⬅️ don't render anything if status is null/undefined/empty string

  const { label, className, icon: Icon } = statusMap[status] || statusMap["Draft"]

  return (
    <Badge
      className={`border-gray-200 flex items-center gap-1.5 rounded-md text-xs font-medium h-fit w-fit px-2 py-[2px] ${className} hover:bg-inherit hover:text-inherit`}
    >
      {Icon && <Icon className="w-3.5 h-3.5" />}
      {label}
    </Badge>
  )
}

export default StatusBadge
