import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2, FileDown, Signature } from "lucide-react"

const defaultSignatureOptions = [
  {
    value: "none",
    label: "No signature",
    description: "Preview the report without applying a signature.",
  },
  {
    value: "image",
    label: "E-signature",
    description: "Use the uploaded signature image in the report.",
  },
  {
    value: "digital",
    label: "Digital signature",
    description: "Use the uploaded PNPKI certificate for PDF signing.",
  },
]

const DefaultSidebar = ({
  signatureMode,
  onSignatureModeChange,
  signatureOptions,
  canUseImageSignature,
  canUseDigitalSignature,
  loadingSignatureProfile,
  signatureImage,
  signerName,
  selectedSummary,
  pdfUrl,
}) => {
  const selectedOption = signatureOptions.find((option) => option.value === signatureMode) || signatureOptions[0]

  return (
    <>
      <div className="rounded-lg border bg-muted/30 p-4">
        <div className="mb-3 flex items-center gap-2">
          <Signature className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Signing Options</h3>
        </div>

        <div className="space-y-2">
          {signatureOptions.map((option) => {
            const disabled =
              (option.value === "image" && !canUseImageSignature) ||
              (option.value === "digital" && !canUseDigitalSignature)

            const active = signatureMode === option.value

            return (
              <button
                key={option.value}
                type="button"
                disabled={disabled}
                onClick={() => onSignatureModeChange?.(option.value)}
                className={`w-full rounded-md border px-3 py-2 text-left transition ${
                  active
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-slate-200 bg-white hover:border-slate-300"
                } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">{option.label}</span>
                  {active && <Badge className="rounded-full bg-blue-600">Selected</Badge>}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">{option.description}</div>
              </button>
            )
          })}
        </div>

        {loadingSignatureProfile ? (
          <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Loading signature profile...
          </div>
        ) : (
          <div className="mt-4 rounded-md border bg-white p-3 text-xs text-slate-600">
            {signatureMode === "image" && (
              <>
                {canUseImageSignature ? (
                  <div className="space-y-2">
                    <div className="font-medium text-slate-700">E-signature preview</div>
                    <div className="rounded-md border bg-slate-50 p-2">
                      <img src={signatureImage || undefined} alt="Signature preview" className="mx-auto max-h-24 object-contain" />
                    </div>
                    <div className="text-xs">Will render as an image inside the report.</div>
                  </div>
                ) : (
                  <div className="text-xs text-amber-700">No uploaded e-signature found in your account settings.</div>
                )}
              </>
            )}

            {signatureMode === "digital" && (
              <>
                {canUseDigitalSignature ? (
                  <div className="space-y-2">
                    <div className="font-medium text-slate-700">Digital signature preview</div>
                    <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-3 text-center">
                      <div className="text-sm font-semibold text-slate-800">PNPKI certificate ready</div>
                      <div className="mt-1 text-xs text-slate-500">{signerName || "Current user"} will be applied as a digital signer.</div>
                    </div>
                    <div className="text-xs">The PDF will be cryptographically signed when generated.</div>
                  </div>
                ) : (
                  <div className="text-xs text-amber-700">No uploaded digital certificate found in your account settings.</div>
                )}
              </>
            )}

            {signatureMode === "none" && (
              <div className="text-xs text-slate-600">The report will be previewed and exported without an applied signature.</div>
            )}
          </div>
        )}
      </div>

      <div className="rounded-lg border bg-white p-4 text-xs text-slate-600">
        <div className="font-medium text-slate-800">Current selection</div>
        <div className="mt-1">{selectedSummary || selectedOption?.label || "No signature"}</div>
        <div className="mt-2">Preview uses the same report route as the PDF export.</div>
      </div>

      <div className="mt-auto flex justify-end gap-2">
        <Button variant="outline" type="button" onClick={() => pdfUrl && window.open(pdfUrl, "_blank", "noopener,noreferrer")} disabled={!pdfUrl}>
          <FileDown className="h-4 w-4" />
          Open PDF
        </Button>
      </div>
    </>
  )
}

const ReportPreviewDialog = ({
  open,
  onOpenChange,
  title,
  description,
  previewUrl,
  pdfUrl,
  signatureMode = "none",
  onSignatureModeChange,
  signatureOptions = defaultSignatureOptions,
  canUseImageSignature = false,
  canUseDigitalSignature = false,
  loadingSignatureProfile = false,
  signatureImage = null,
  signerName = "",
  selectedSummary = "",
  sidebarContent = null,
  previewOverlay = null,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[92vh] w-full max-w-[96vw] flex-col overflow-hidden">
        <DialogHeader className="space-y-2">
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_290px]">
          <div className="relative h-full min-h-0 overflow-hidden rounded-lg border bg-white">
            {previewUrl ? (
              <>
                <iframe key={previewUrl} title={title} src={previewUrl} className="absolute inset-0 h-full w-full" />
                {previewOverlay}
              </>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No preview URL provided.
              </div>
            )}
          </div>

          <div className="flex min-h-0 flex-col gap-4">
            {sidebarContent ?? (
              <DefaultSidebar
                signatureMode={signatureMode}
                onSignatureModeChange={onSignatureModeChange}
                signatureOptions={signatureOptions}
                canUseImageSignature={canUseImageSignature}
                canUseDigitalSignature={canUseDigitalSignature}
                loadingSignatureProfile={loadingSignatureProfile}
                signatureImage={signatureImage}
                signerName={signerName}
                selectedSummary={selectedSummary}
                pdfUrl={pdfUrl}
              />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ReportPreviewDialog