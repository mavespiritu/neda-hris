import { useEffect, useMemo, useRef, useState } from "react"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import ReportPreviewDialog from "@/components/ReportPreviewDialog"
import { Check } from "lucide-react"

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

const defaultPlacement = {
  page: 1,
  x: 58,
  y: 74,
  w: 24,
  h: 12,
}

const TravelOrderReportPreviewDialog = ({ open, onOpenChange, travelOrderId, travelOrderReference }) => {
  const [account, setAccount] = useState({
    signature: null,
    digital_sig: null,
    last_name: "",
    first_name: "",
    middle_name: "",
  })
  const [loadingAccount, setLoadingAccount] = useState(false)
  const [signatureSource, setSignatureSource] = useState("upload_digital")
  const [imageFileName, setImageFileName] = useState("")
  const [digitalFileName, setDigitalFileName] = useState("")
  const [placement, setPlacement] = useState(defaultPlacement)
  const [dragging, setDragging] = useState(false)
  const [signing, setSigning] = useState(false)
  const [signError, setSignError] = useState("")
  const overlayRef = useRef(null)
  const dragStateRef = useRef(null)

  useEffect(() => {
    if (!open) return

    let active = true

    const loadAccount = async () => {
      setLoadingAccount(true)

      try {
        const response = await axios.get(route("settings.account"))
        if (!active) return

        const data = response?.data ?? {}
        setAccount({
          signature: data.signature || null,
          digital_sig: data.digital_sig || null,
          last_name: data.last_name || "",
          first_name: data.first_name || "",
          middle_name: data.middle_name || "",
        })
      } catch (error) {
        if (!active) return
        setAccount({
          signature: null,
          digital_sig: null,
          last_name: "",
          first_name: "",
          middle_name: "",
        })
      } finally {
        if (active) setLoadingAccount(false)
      }
    }

    loadAccount()
    setPlacement(defaultPlacement)

    return () => {
      active = false
    }
  }, [open])

  useEffect(() => {
    if (!dragging) return

    const onPointerMove = (event) => {
      const state = dragStateRef.current
      const container = overlayRef.current
      if (!state || !container) return

      const rect = state.rect
      if (!rect.width || !rect.height) return

      const deltaX = ((event.clientX - state.startX) / rect.width) * 100
      const deltaY = ((event.clientY - state.startY) / rect.height) * 100

      const maxX = Math.max(0, 100 - state.origin.w)
      const maxY = Math.max(0, 100 - state.origin.h)

      const nextX = clamp(state.origin.x + deltaX, 0, maxX)
      const nextY = clamp(state.origin.y + deltaY, 0, maxY)

      setPlacement((current) => ({
        ...current,
        x: nextX,
        y: nextY,
      }))
    }

    const onPointerUp = () => {
      setDragging(false)
      dragStateRef.current = null
    }

    window.addEventListener("pointermove", onPointerMove)
    window.addEventListener("pointerup", onPointerUp)

    return () => {
      window.removeEventListener("pointermove", onPointerMove)
      window.removeEventListener("pointerup", onPointerUp)
    }
  }, [dragging])

  const signerName = useMemo(() => {
    const parts = [account.first_name, account.middle_name, account.last_name]
      .map((part) => String(part || "").trim())
      .filter(Boolean)

    return parts.join(" ").trim()
  }, [account.first_name, account.last_name, account.middle_name])

  const previewUrl = useMemo(
    () =>
      route("travel-requests.generate", {
        id: travelOrderId,
        preview: 1,
        pdf: 1,
      }),
    [travelOrderId]
  )

  const unsignedPdfUrl = useMemo(
    () =>
      route("travel-requests.generate", {
        id: travelOrderId,
        pdf: 1,
      }),
    [travelOrderId]
  )

  const canUseSavedImage = Boolean(account.signature)
  const canUseSavedDigital = Boolean(account.digital_sig)
  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content || ""

  const signatureLabel =
    signatureSource === "upload_digital" || signatureSource === "saved_digital"
      ? "DIGITAL SIGNATURE"
      : "E-SIGNATURE"

  const signatureHint =
    signatureSource === "upload_digital" || signatureSource === "saved_digital"
      ? "Drag to position the digital signature appearance."
      : "Drag to position the e-signature stamp."

  const startDrag = (event) => {
    if (!overlayRef.current) return

    event.preventDefault()
    event.stopPropagation()

    dragStateRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      rect: overlayRef.current.getBoundingClientRect(),
      origin: { ...placement },
    }

    setDragging(true)
  }

  const extractFilenameFromDisposition = (headerValue) => {
    if (!headerValue) return ""

    const utf8Match = /filename\*\s*=\s*UTF-8''([^;]+)/i.exec(headerValue)
    if (utf8Match?.[1]) {
      try {
        return decodeURIComponent(utf8Match[1].replace(/[\"']/g, ""))
      } catch {
        return utf8Match[1].replace(/[\"']/g, "")
      }
    }

    const plainMatch = /filename\s*=\s*("?)([^";]+)\1/i.exec(headerValue)
    return plainMatch?.[2]?.trim() || ""
  }

  const triggerBlobDownload = (blob, filename) => {
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement("a")

    link.href = url
    link.download = filename
    link.rel = "noopener"
    document.body.appendChild(link)
    link.click()
    link.remove()

    window.setTimeout(() => {
      window.URL.revokeObjectURL(url)
    }, 1000)
  }

  const handleSignAndDownload = async (event) => {
    event.preventDefault()

    if (signing) return

    setSigning(true)
    setSignError("")

    try {
      const formData = new FormData(event.currentTarget)
      const response = await axios.post(route("travel-requests.report.sign", travelOrderId), formData, {
        responseType: "blob",
        headers: {
          Accept: "application/pdf",
        },
      })

      const filename =
        extractFilenameFromDisposition(response.headers?.["content-disposition"]) ||
        `${travelOrderReference ? `${travelOrderReference}_SIGNED` : `travel-order-${travelOrderId}_SIGNED`}.pdf`

      triggerBlobDownload(response.data, filename)
    } catch (error) {
      const response = error?.response

      if (response?.data instanceof Blob) {
        try {
          const message = await response.data.text()
          setSignError(message || "Failed to generate the signed PDF.")
        } catch {
          setSignError("Failed to generate the signed PDF.")
        }
      } else {
        setSignError(
          response?.data?.message ||
          response?.data ||
          error?.message ||
          "Failed to generate the signed PDF."
        )
      }
    } finally {
      setSigning(false)
    }
  }

  const sidebarContent = (
    <form
      className="flex h-full min-h-0 flex-col gap-4"
      action={route("travel-requests.report.sign", travelOrderId)}
      method="POST"
      encType="multipart/form-data"
      onSubmit={handleSignAndDownload}
    >
      <input type="hidden" name="_token" value={csrfToken} />
      <input type="hidden" name="signature_source" value={signatureSource} />
      <input type="hidden" name="signature_page" value={placement.page} />
      <input type="hidden" name="signature_x" value={placement.x.toFixed(2)} />
      <input type="hidden" name="signature_y" value={placement.y.toFixed(2)} />
      <input type="hidden" name="signature_w" value={placement.w.toFixed(2)} />
      <input type="hidden" name="signature_h" value={placement.h.toFixed(2)} />

      <div className="rounded-lg border bg-muted/30 p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold">Signing Options</h3>
            <p className="text-xs text-muted-foreground">Choose a local file upload or a saved profile asset.</p>
          </div>
          <Badge variant="outline" className="rounded-full">
            Preview only
          </Badge>
        </div>

        <div className="space-y-2">
          {[
            {
              value: "upload_digital",
              label: "Upload digital certificate",
              description: "Upload a .p12/.pfx file for this signing only.",
            },
            {
              value: "upload_image",
              label: "Upload e-signature image",
              description: "Upload a PNG or JPG image for this signing only.",
            },
          ].map((option) => {
            const active = signatureSource === option.value
            const disabled = Boolean(option.disabled)

            return (
              <button
                key={option.value}
                type="button"
                disabled={disabled}
                onClick={() => setSignatureSource(option.value)}
                className={`w-full rounded-md border px-3 py-2 text-left transition ${
                  active
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-slate-200 bg-white hover:border-slate-300"
                } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium">{option.label}</span>
                  {active && <Check className="h-4 w-4"/>}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">{option.description}</div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="rounded-lg border bg-white p-4 text-xs text-slate-600">
        <div className="font-medium text-slate-800">Sign inputs</div>
        {signatureSource === "upload_image" && (
          <div className="mt-3 space-y-2">
            <Label htmlFor="signature_image_file">E-signature image</Label>
            <Input
              id="signature_image_file"
              name="signature_image_file"
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              required
              onChange={(e) => setImageFileName(e.target.files?.[0]?.name || "")}
            />
            <div className="text-[11px] text-muted-foreground">
              {imageFileName || "PNG/JPG upload only. The file is sent for this signing request only."}
            </div>
          </div>
        )}

        {signatureSource === "upload_digital" && (
          <div className="mt-3 space-y-3">
            <div className="space-y-2">
              <Label htmlFor="digital_certificate">Digital certificate (.p12/.pfx)</Label>
              <Input
                id="digital_certificate"
                name="digital_certificate"
                type="file"
                accept=".p12,.pfx,application/x-pkcs12,application/octet-stream"
                required
                onChange={(e) => setDigitalFileName(e.target.files?.[0]?.name || "")}
              />
              <div className="text-[11px] text-muted-foreground">
                {digitalFileName || "Select your local certificate for this signing only."}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="digital_certificate_password">Certificate password</Label>
              <Input
                id="digital_certificate_password"
                name="digital_certificate_password"
                type="password"
                placeholder="Enter the P12 password"
                required
              />
            </div>
          </div>
        )}

        {signatureSource === "saved_digital" && (
          <div className="mt-3 space-y-2 text-[11px] text-muted-foreground">
            <div>{loadingAccount ? "Loading saved certificate..." : "The saved certificate will be used for signing."}</div>
            <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-3">
              <div className="font-medium text-slate-700">Signer</div>
              <div>{signerName || "Current user"}</div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="digital_certificate_password">Certificate password</Label>
              <Input
                id="digital_certificate_password"
                name="digital_certificate_password"
                type="password"
                placeholder="Enter the P12 password"
                required
              />
            </div>
          </div>
        )}

        {signatureSource === "saved_image" && (
          <div className="mt-3 space-y-2 text-[11px] text-muted-foreground">
            <div>The saved image signature will be embedded into the report.</div>
            {account.signature && (
              <div className="rounded-md border bg-slate-50 p-2">
                <img src={account.signature} alt="Saved signature preview" className="mx-auto max-h-24 object-contain" />
              </div>
            )}
          </div>
        )}
      </div>

      <div className="rounded-lg border bg-white p-4 text-xs text-slate-600">
        <div className="font-medium text-slate-800">Signature placement</div>
        <div className="mt-1">{signatureHint}</div>
        <div className="mt-1 text-[11px] text-muted-foreground">
          Drag the box on the PDF preview. The current position is stored as a percentage of the page.
        </div>
      </div>

      <div className="rounded-lg border bg-white p-4 text-xs text-slate-600">
        <div className="font-medium text-slate-800">Current selection</div>
        <div className="mt-1">
          {signatureSource === "upload_digital"
            ? "Upload digital certificate"
            : signatureSource === "upload_image"
              ? "Upload e-signature image"
              : signatureSource === "saved_digital"
                ? "Saved digital certificate"
                : signatureSource === "saved_image"
                  ? "Saved e-signature image"
                  : "No signature"}
        </div>
        <div className="mt-2">The preview is a cached PDF; the signed PDF is generated only when you submit.</div>
        {signError && <div className="mt-2 text-xs text-red-600">{signError}</div>}
      </div>

      <div className="mt-auto flex flex-wrap justify-end gap-2">
        <Button variant="outline" type="button" onClick={() => window.open(unsignedPdfUrl, "_blank", "noopener,noreferrer") }>
          Open PDF
        </Button>
        <Button type="submit" disabled={signing || (loadingAccount && signatureSource.startsWith("saved_"))}>
          {signing ? "Generating PDF..." : "Sign & Download PDF"}
        </Button>
      </div>
    </form>
  )

  const previewOverlay = (
    <div ref={overlayRef} className="absolute inset-0 z-10 select-none pointer-events-none">
      <button
        type="button"
        onPointerDown={startDrag}
        className={`pointer-events-auto absolute rounded-md border-2 border-dashed bg-white/75 p-2 text-left shadow-lg backdrop-blur-sm transition ${
          dragging ? "border-blue-600 bg-blue-50/90" : "border-blue-400 hover:border-blue-600"
        }`}
        style={{
          left: `${placement.x}%`,
          top: `${placement.y}%`,
          width: `${placement.w}%`,
          height: `${placement.h}%`,
        }}
      >
        <div className="flex h-full w-full flex-col justify-center gap-1 overflow-hidden">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-blue-700">{signatureLabel}</div>
          <div className="text-[10px] text-slate-600">{signatureHint}</div>
          <div className="text-[10px] text-slate-500">
            x: {placement.x.toFixed(1)}% y: {placement.y.toFixed(1)}%
          </div>
        </div>
      </button>
    </div>
  )

  return (
    <ReportPreviewDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Travel Order Preview${travelOrderReference ? ` - ${travelOrderReference}` : ""}`}
      description="Preview the report before printing or downloading the PDF."
      previewUrl={previewUrl}
      pdfUrl={unsignedPdfUrl}
      sidebarContent={sidebarContent}
      previewOverlay={previewOverlay}
    />
  )
}

export default TravelOrderReportPreviewDialog
