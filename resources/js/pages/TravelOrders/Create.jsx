import PageTitle from "@/components/PageTitle"
import { useState } from "react"
import { Head } from "@inertiajs/react"
import { useLocalStorage } from "@/hooks/useLocalStorage"
import Form from "./Form"
import { usePage } from '@inertiajs/react'

const breadcrumbItems = [
  { label: "Home", href: "/" },
  { label: "Travel Orders", href: route("travel-orders.index") },
  { label: "Add New", href: route("travel-orders.create") },
]

const Create = () => {

    const { data } = usePage().props
    const travelCategories = data?.travelCategories ?? []
    const employees = data?.employees ?? []

    return (
        <div className="h-full flex flex-col">
        <Head title="Travel Orders" />
        <PageTitle
            pageTitle="Add New Travel Order"
            description="File your travel order here."
            breadcrumbItems={breadcrumbItems}
        />

        <Form 
            travelCategories={travelCategories}
            employees={employees}
            mode="create"
            data={null}
        />
        </div>
    )
}

export default Create
