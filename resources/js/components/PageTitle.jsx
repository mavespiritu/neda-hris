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

const PageTitle = ({pageTitle, breadcrumbItems}) => {
  return (
    <>
    <Head title={pageTitle} />
    <div className="flex justify-between items-center mb-2">
        <h1 className="text-normal font-semibold md:text-xl">{pageTitle}</h1>
        <Breadcrumbs
            className="md:hidden"
            items={breadcrumbItems}
        />
    </div>
    </>
  )
}

export default PageTitle