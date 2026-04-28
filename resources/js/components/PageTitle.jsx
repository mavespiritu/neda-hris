import { useEffect } from "react"
import { Head } from '@inertiajs/react'
import { useBreadcrumbs } from "@/providers/BreadcrumbProvider"

const PageTitle = ({ pageTitle, description, breadcrumbItems }) => {
  const { setBreadcrumbItems } = useBreadcrumbs()

  useEffect(() => {
    setBreadcrumbItems(Array.isArray(breadcrumbItems) ? breadcrumbItems : [])

    return () => {
      setBreadcrumbItems([])
    }
  }, [breadcrumbItems, setBreadcrumbItems])

  return (
    <>
      <Head title={pageTitle} />

      <div className="flex flex-col gap-2 mb-4">
        {/* Title and description */}
        <div className="flex flex-col text-center md:text-left">
          <h3 className="font-semibold tracking-tight text-xl text-black">{pageTitle}</h3>
          <span className="text-sm text-muted-foreground">{description}</span>
        </div>
      </div>
    </>
  )
}

export default PageTitle
