import { Head, Link } from "@inertiajs/react"
import PageTitle from "@/components/PageTitle"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ClipboardList, Mail, UsersRound } from "lucide-react"
import { dpcrKras, workMonitoringLink } from "../Performance/prototypeData"

export default function Index({ divisionName = "Division", summary = {} }) {
  const metrics = [
    {
      label: "KRA blocks",
      value: dpcrKras.length,
      description: "Division-level performance areas in the prototype",
      icon: ClipboardList,
      tone: "blue",
    },
    {
      label: "Accountable unit",
      value: summary.unit_count || 1,
      description: "Prototype coverage by the ICT Unit",
      icon: UsersRound,
      tone: "emerald",
    },
    {
      label: "Work monitoring",
      value: "Email",
      description: "Delegated work traces flow through Outlook",
      icon: Mail,
      tone: "cyan",
    },
  ]

  const iconTone = {
    blue: "bg-blue-50 text-blue-700",
    emerald: "bg-emerald-50 text-emerald-700",
    cyan: "bg-cyan-50 text-cyan-700",
  }

  return (
    <>
      <Head title="DPCR" />

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <PageTitle
          pageTitle="DPCR"
          description="Division Performance Commitment and Review for division chiefs and assistant division chiefs."
          breadcrumbItems={[
            { label: "Home", href: "/" },
            { label: "Performance" },
            { label: "DPCR" },
          ]}
        />

        <Card className="border-0 bg-gradient-to-r from-slate-900 via-blue-900 to-sky-700 text-white shadow-[0_18px_50px_-24px_rgba(15,23,42,0.8)]">
          <CardHeader className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-white/15 text-white hover:bg-white/15">Division Access</Badge>
              <Badge className="bg-sky-400/15 text-sky-100 hover:bg-sky-400/15">
                {divisionName}
              </Badge>
            </div>
            <CardTitle className="text-3xl tracking-tight">Division performance matrix</CardTitle>
            <CardDescription className="max-w-3xl text-slate-200">
              This page mirrors the prototype structure for division-level commitments, indicators, and
              accountability under SPMS.
            </CardDescription>
          </CardHeader>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          {metrics.map((metric) => {
            const Icon = metric.icon
            return (
              <Card key={metric.label} className="border-0 bg-white/85 backdrop-blur shadow-[0_10px_30px_-20px_rgba(15,23,42,0.45)]">
                <CardContent className="flex items-start justify-between gap-4 p-5">
                  <div>
                    <p className="text-sm font-medium text-slate-500">{metric.label}</p>
                    <div className="mt-1 text-3xl font-bold tracking-tight text-slate-900">{metric.value}</div>
                    <p className="mt-2 text-xs leading-relaxed text-slate-500">{metric.description}</p>
                  </div>
                  <div className={`rounded-2xl p-3 ${iconTone[metric.tone]}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <Card className="border-slate-200 bg-white/90 shadow-sm">
          <CardHeader className="border-b bg-slate-50/80">
            <CardTitle className="text-lg">Prototype KRA blocks</CardTitle>
            <CardDescription>
              These are the current DPC indicators from the workbook prototype.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      #
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      KRA
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Success Indicator / Target
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Weight
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Budget
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Unit
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dpcrKras.map((row, index) => (
                    <tr key={row.title} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3 text-sm text-slate-500">{index + 1}</td>
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">{row.title}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{row.target}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{row.weight || "-"}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{row.budget || "-"}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{row.unit || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-white to-sky-50 shadow-[0_12px_34px_-24px_rgba(15,23,42,0.45)]">
          <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">Work monitoring shortcut</p>
              <p className="mt-1 text-sm text-slate-600">
                Use Outlook inbox tasks to track delegated items and follow-ups that feed the division workflow.
              </p>
            </div>
            <Link href={workMonitoringLink.href}>
              <Button className="gap-2 bg-slate-900 hover:bg-slate-800">
                <Mail className="h-4 w-4" />
                Open work monitoring
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
