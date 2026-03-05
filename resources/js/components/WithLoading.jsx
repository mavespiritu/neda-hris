import LoadingOverlay from "./LoadingOverlay"

const WithLoading = ({
  loading = false,
  block = false,
  overlayVariant = "fixed",
  overlayText = "",
  children,
}) => {
  if (block && loading) {
    return (
      <div className="min-h-[240px]">
        <LoadingOverlay show variant={overlayVariant} text={overlayText} />
      </div>
    )
  }

  return (
    <div className="relative">
      <LoadingOverlay show={loading} variant={overlayVariant} text={overlayText} />
      {children}
    </div>
  )
}

export default WithLoading
