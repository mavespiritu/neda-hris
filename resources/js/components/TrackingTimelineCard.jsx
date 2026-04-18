import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { CheckCircle2, Circle } from "lucide-react"

const stepMeta = {
  done: {
    icon: CheckCircle2,
    dotClass: "text-emerald-500",
  },
  current: {
    icon: CheckCircle2,
    dotClass: "text-emerald-500",
  },
  upcoming: {
    icon: Circle,
    dotClass: "text-slate-400",
  },
  conditional: {
    icon: Circle,
    dotClass: "text-slate-400",
  },
}

const formatStepDateTime = (value) => {
  if (!value) {
    return { date: "", time: "" }
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return { date: String(value), time: "" }
  }

  return {
    date: new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(parsed),
    time: new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
    }).format(parsed),
  }
}

const TrackingTimelineCard = ({
  workflow,
  title = "Workflow Tracking",
  description = "Process guide and current progress for this travel request.",
}) => {
  const steps = Array.isArray(workflow?.steps) ? workflow.steps : []

  if (steps.length === 0) {
    return null
  }

  return (
    <Card className="border-dashed shadow-sm">
      <CardHeader className="space-y-1">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          {workflow?.current_state && (
            <Badge variant="outline" className="shrink-0">
              {workflow.current_state}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4 py-1">
        {steps.map((step, index) => {
          const meta = stepMeta[step.status] || stepMeta.upcoming
          const Icon = meta.icon
          const actorNames = Array.isArray(step.expected_actor_names)
            ? step.expected_actor_names.filter(Boolean)
            : []
          const actorText = actorNames.length > 0
            ? actorNames.join(", ")
            : (step.expected_actor_text || "")
          const showActorText = step.status === "upcoming" || step.status === "conditional"
          const { date, time } = formatStepDateTime(step.acted_at)
          const isFirst = index === 0
          const isLast = index === steps.length - 1

          return (
            <div key={`${step.key || step.state || index}`} className="grid grid-cols-[92px_40px_minmax(0,1fr)] gap-3 items-start">
              <div className="text-right pt-0.5">
                <div className="text-xs font-medium text-slate-700 leading-4">{date || ""}</div>
                <div className="text-[11px] text-muted-foreground leading-4">{time || ""}</div>
              </div>

              <div className="relative flex justify-center self-stretch min-h-10">
                <div
                  aria-hidden="true"
                  className={`absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 bg-slate-400/80 ${isFirst ? "top-3" : ""} ${isLast ? "bottom-3" : ""}`}
                />
                <div className="relative z-10 rounded-full bg-background p-0.5 shadow-[0_0_0_1px_rgba(255,255,255,1)]">
                  <Icon className={`h-5 w-5 ${meta.dotClass}`} strokeWidth={2.2} />
                </div>
              </div>

              <div className="min-w-0 pb-2">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="font-medium text-sm leading-5">{step.title}</div>
                </div>

                {step.subtitle && (
                  <div className="text-xs text-muted-foreground mt-0.5">{step.subtitle}</div>
                )}

                {showActorText && actorText && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    {actorText}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

export default TrackingTimelineCard