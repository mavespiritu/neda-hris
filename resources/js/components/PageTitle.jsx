import { Head } from '@inertiajs/react'
import Breadcrumbs from "@/components/Breadcrumbs"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card"

const PageTitle = ({pageTitle, description, breadcrumbItems}) => {
  return (
    <>
      <Head title={pageTitle} />
          <div className="flex flex-col md:flex-row md:gap-2 md:justify-between md:items-center mb-2">
        <div className="flex flex-col">
            <h1 className="text-lg font-semibold md:text-xl">{pageTitle}</h1>
            <span className="text-sm text-muted-foreground">{description}</span>
        </div>
        <Breadcrumbs
            className="md:hidden"
            items={breadcrumbItems}
        />
    </div>
    </>
  )
}

export default PageTitle