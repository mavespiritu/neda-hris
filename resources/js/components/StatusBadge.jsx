import { Badge } from "@/components/ui/badge"
import {
  CheckCircle,
  ShieldCheck,
  Ban,
  Clock,
  FileText,
  Edit3,
} from "lucide-react"

const statusMap = {
  Approved: {
    label: "Approved",
    className: "bg-green-100 text-green-700 hover:bg-green-100 hover:text-green-700",
    icon: CheckCircle,
  },
  Endorsed: {
    label: "Endorsed",
    className: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100 hover:text-yellow-700",
    icon: ShieldCheck,
  },
  "Needs Revision": {
    label: "Needs Revision",
    className: "bg-red-100 text-red-700 hover:bg-red-100 hover:text-red-700",
    icon: Edit3,
  },
  Disapproved: {
    label: "Disapproved",
    className: "bg-red-300 text-red-800 hover:bg-red-300 hover:text-red-800",
    icon: Ban,
  },
  Submitted: {
    label: "Submitted",
    className: "bg-gray-100 text-gray-700 hover:bg-gray-100 hover:text-gray-700",
    icon: FileText,
  },
  Pending: {
    label: "Pending",
    className: "bg-muted text-muted-foreground hover:bg-muted hover:text-muted-foreground",
    icon: Clock,
  },
  Draft: {
    label: "Draft",
    className: "bg-muted text-muted-foreground hover:bg-muted hover:text-muted-foreground",
    icon: FileText,
  },
}

const StatusBadge = ({ status }) => {
  if (!status) return null

  const { label, className, icon: Icon } = statusMap[status] || statusMap["Draft"]

  return (
    <Badge
      className={`border-gray-200 flex items-center gap-1.5 rounded-md text-xs font-medium h-fit w-fit px-2 py-[2px] ${className}`}
    >
      {Icon && <Icon className="w-3.5 h-3.5" />}
      {label}
    </Badge>
  )
}

export default StatusBadge
