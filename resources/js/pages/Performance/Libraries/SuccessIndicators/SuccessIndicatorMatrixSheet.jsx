import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import MatrixBuilder from "./MatrixBuilder"

export default function SuccessIndicatorMatrixSheet({
  open,
  onOpenChange,
  title = "Rating Matrix",
  description = "Read-only preview of the rating matrix for this success indicator.",
  ratingRows = [],
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-5xl">
        <SheetHeader className="text-left">
          <SheetTitle className="text-base">{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>

        <div className="mt-6">
          <MatrixBuilder value={ratingRows} disabled showControls={false} />
        </div>
      </SheetContent>
    </Sheet>
  )
}
