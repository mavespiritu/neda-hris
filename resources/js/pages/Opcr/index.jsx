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
import { Building2, ClipboardList, Mail } from "lucide-react"
import { opcrPrograms, workMonitoringLink } from "../Performance/prototypeData"

export default function Index({ summary = {} }) {
  const accountableUnits = Array.from(
    new Set(
      opcrPrograms.flatMap((program) =>
        program.indicators.map((indicator) => indicator.accountable).filter(Boolean)
      )
    )
  )

  const metrics = [
    {
      label: "Program blocks",
      value: summary.program_count || opcrPrograms.length,
      description: "Office-wide program groupings in the prototype",
      icon: ClipboardList,
      tone: "blue",
    },
    {
      label: "Accountable units",
      value: accountableUnits.length,
      description: "Units that appear in the prototype mappings",
      icon: Building2,
      tone: "emerald",
    },
    {
      label: "Monitoring",
      value: "Email",
      description: "Delegated tasks and follow-through live in Outlook",
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
      <Head title="OPCR" />

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <PageTitle
          pageTitle="OPCR"
          description="Office Performance Commitment and Review for the whole office leadership."
          breadcrumbItems={[
            { label: "Home", href: "/" },
            { label: "Performance" },
            { label: "OPCR" },
          ]}
        />

        <Card className="border-0 bg-gradient-to-r from-slate-950 via-blue-950 to-cyan-700 text-white shadow-[0_18px_50px_-24px_rgba(15,23,42,0.8)]">
          <CardHeader className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-white/15 text-white hover:bg-white/15">Office access</Badge>
              <Badge className="bg-cyan-400/15 text-cyan-100 hover:bg-cyan-400/15">
                Regional Office level
              </Badge>
            </div>
            <CardTitle className="text-3xl tracking-tight">Office performance matrix</CardTitle>
            <CardDescription className="max-w-3xl text-slate-200">
              This page mirrors the prototype sheet for OPCR: office programs, activities, and target
              indicators with their accountable divisions.
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

        <div className="space-y-6">
          {opcrPrograms.map((program) => (
            <Card key={`${program.program}-${program.activity}`} className="overflow-hidden border-slate-200 bg-white/90 shadow-sm">
              <CardHeader className="border-b bg-slate-50/80">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">{program.mfo}</Badge>
                </div>
                <CardTitle className="text-lg">{program.program}</CardTitle>
                <CardDescription className="text-slate-600">{program.activity}</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-hidden">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
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
                          Division / Office Accountable
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {program.indicators.map((indicator, index) => (
                        <tr key={`${program.program}-${index}`} className="hover:bg-slate-50/80">
                          <td className="px-4 py-3 text-sm text-slate-700">
                            {indicator.target}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-700">{indicator.weight || "-"}</td>
                          <td className="px-4 py-3 text-sm text-slate-700">{indicator.budget || "-"}</td>
                          <td className="px-4 py-3 text-sm text-slate-700">{indicator.accountable || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-0 bg-gradient-to-br from-white to-sky-50 shadow-[0_12px_34px_-24px_rgba(15,23,42,0.45)]">
          <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">Work monitoring shortcut</p>
              <p className="mt-1 text-sm text-slate-600">
                The same Outlook inbox is used to coordinate delegated work and follow-through for office-level tasks.
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
