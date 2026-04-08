import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function Rne({ record, periodLabel = "" }) {
  return (
    <Card className="border border-slate-200 bg-white shadow-none">
      <CardHeader className="border-b border-slate-200 bg-slate-50/60 px-3 py-3">
        <CardTitle className="text-base">Review and Evaluation</CardTitle>
        <CardDescription>{record?.title || `OPCR ${periodLabel}`}</CardDescription>
      </CardHeader>
      <CardContent className="px-3 py-4 text-sm text-slate-600">
        This tab is ready for review and evaluation content.
      </CardContent>
    </Card>
  )
}
