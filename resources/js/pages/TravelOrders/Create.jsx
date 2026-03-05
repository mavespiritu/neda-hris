import PageTitle from "@/components/PageTitle"
import { useState } from "react"
import { Head } from "@inertiajs/react"
import { useLocalStorage } from "@/hooks/useLocalStorage"
import Form from "./Form"
import { usePage } from '@inertiajs/react'

const breadcrumbItems = [
  { label: "Home", href: "/" },
  { label: "Travel Request", href: route("travel-requests.index") },
  { label: "Add New", href: route("travel-requests.create") },
]

const Create = () => {

    const { data } = usePage().props
    const categories = data?.categories ?? []
    const fundSources = data?.fundSources ?? []
    const employees = data?.employees ?? []
    const approver = data?.approver ?? null
    const referenceNo = data?.reference_no ?? ""

    return (
        <div className="h-full flex flex-col">
        <Head title="Travel Requests" />
        <PageTitle
            pageTitle="Add New Travel Request"
            description="File your travel request here."
            breadcrumbItems={breadcrumbItems}
        />

        <Form 
            categories={categories}
            fundSources={fundSources}
            employees={employees}
            approver={approver}
            mode="create"
            data={null}
            referenceNo={referenceNo}
        />
        </div>
    )
}

export default Create
