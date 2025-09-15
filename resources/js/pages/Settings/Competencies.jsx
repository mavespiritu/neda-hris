import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import Schedules from './Competencies/Schedules/index'


const Competencies = () => {

  return (
    <Card>
      <CardHeader className="space-y-0 pb-4">
        <CardTitle className="text-lg">Competencies</CardTitle>
        <CardDescription className="text-sm">You can change settings here for competencies setup</CardDescription>
      </CardHeader>
      <CardContent className="border-t">
        <div className="flex items-start gap-4 px-4 py-6">
          <div className="flex flex-col w-1/3">
            <span className="text-sm font-semibold">Submission Schedules</span>
            <span className="text-xs text-muted-foreground">Add or edit annual CGA submission period.</span>
          </div>
          <div className="flex-1 flex flex-col gap-2">
            <Schedules />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default Competencies
