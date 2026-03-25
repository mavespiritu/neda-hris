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
import { CalendarRange, BadgeCheck, FileText, Mail, ArrowRight } from "lucide-react"

const formatSemester = (semester, year) => `${semester === 1 ? "1st" : "2nd"} Semester ${year}`

export default function Index({ records = [], summary = {}, emailLink = "/emails" }) {
  const stats = [
    {
      label: "IPCR records",
      value: Number(summary.total_records || 0).toLocaleString("en-US"),
      description: "Performance records tied to your account",
      icon: CalendarRange,
      tone: "blue",
    },
    {
      label: "Verified records",
      value: Number(summary.verified_records || 0).toLocaleString("en-US"),
      description: "Entries ready for evidence and review",
      icon: BadgeCheck,
      tone: "emerald",
    },
    {
      label: "Evidence items",
      value: Number(summary.evidence_count || 0).toLocaleString("en-US"),
      description: "Documents linked to performance evidence",
      icon: FileText,
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
      <Head title="IPCR" />

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <PageTitle
          pageTitle="IPCR"
          description="Your own Individual Performance Commitment and Review records."
          breadcrumbItems={[
            { label: "Home", href: "/" },
            { label: "Performance" },
            { label: "IPCR" },
          ]}
        />

        <div className="grid gap-4 lg:grid-cols-[1.45fr_0.85fr]">
          <Card className="overflow-hidden border-0 bg-gradient-to-br from-slate-900 via-blue-950 to-sky-700 text-white shadow-[0_18px_50px_-24px_rgba(15,23,42,0.8)]">
            <CardHeader className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-white/15 text-white hover:bg-white/15">Staff Only</Badge>
                <Badge className="bg-cyan-400/15 text-cyan-100 hover:bg-cyan-400/15">
                  Snapshot of your ratings
                </Badge>
              </div>
              <CardTitle className="text-3xl tracking-tight">My IPCR records</CardTitle>
              <CardDescription className="max-w-2xl text-slate-200">
                This page is restricted to your own staff account and shows the performance records
                attached to your IPCR profile.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Link href={emailLink}>
                <Button className="gap-2 bg-white text-slate-900 hover:bg-slate-100">
                  <Mail className="h-4 w-4" />
                  Open work monitoring
                </Button>
              </Link>
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            {stats.map((stat) => {
              const Icon = stat.icon
              return (
                <Card key={stat.label} className="border-0 bg-white/80 backdrop-blur shadow-[0_10px_30px_-20px_rgba(15,23,42,0.45)]">
                  <CardContent className="flex items-start justify-between gap-4 p-5">
                    <div>
                      <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                      <div className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
                        {stat.value}
                      </div>
                      <p className="mt-2 text-xs leading-relaxed text-slate-500">{stat.description}</p>
                    </div>
                    <div className={`rounded-2xl p-3 ${iconTone[stat.tone]}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <Card className="overflow-hidden border-slate-200 bg-white/90 shadow-sm">
            <CardHeader className="border-b bg-slate-50/80">
              <CardTitle className="text-lg">Your submitted IPCR entries</CardTitle>
              <CardDescription>Newest record appears first.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {records.length ? (
                <div className="overflow-hidden">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Period
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Verified By
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {records.map((record) => (
                        <tr key={record.id} className="hover:bg-slate-50/80">
                          <td className="px-4 py-3">
                            <div className="font-medium text-slate-900">{formatSemester(record.semester, record.year)}</div>
                            <div className="text-xs text-slate-500">{record.label}</div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              className={
                                record.status === "Verified"
                                  ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                                  : "bg-amber-100 text-amber-700 hover:bg-amber-100"
                              }
                            >
                              {record.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">
                            {record.verified_by || "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-6 text-sm text-slate-500">
                  No IPCR records were found for your account yet.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-white to-sky-50 shadow-[0_12px_34px_-24px_rgba(15,23,42,0.45)]">
            <CardHeader>
              <CardTitle className="text-lg">Monitoring shortcut</CardTitle>
              <CardDescription>
                Email-based task delegation and follow-through are handled in Outlook.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border border-sky-100 bg-white p-4">
                <p className="text-sm font-semibold text-slate-900">Latest record</p>
                <p className="mt-1 text-sm text-slate-600">{summary.latest_label || "No record yet"}</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-semibold text-slate-900">Work monitoring</p>
                <p className="mt-1 text-sm text-slate-600">
                  Use the Outlook inbox to manage delegated tasks and reference emails linked to your performance work.
                </p>
                <Link href={emailLink} className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-600">
                  Open inbox
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
