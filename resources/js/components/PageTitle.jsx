import { Head } from '@inertiajs/react'
import Breadcrumbs from "@/components/Breadcrumbs"

const PageTitle = ({ pageTitle, description, breadcrumbItems }) => {
  return (
    <>
      <Head title={pageTitle} />

      <div className="flex flex-col gap-2 mb-4">
        {/* Breadcrumbs on top (visible on md and larger) */}
        <Breadcrumbs
          className="hidden md:flex mb-1"
          items={breadcrumbItems}
        />

        {/* Title and description */}
        <div className="flex flex-col text-center md:text-left">
          <h1 className="text-lg font-semibold md:text-xl">{pageTitle}</h1>
          <span className="text-sm text-muted-foreground">{description}</span>
        </div>
      </div>
    </>
  )
}

export default PageTitle
