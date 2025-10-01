import { Loader2, Search, Filter, ChevronRight, MapPin, Banknote, FileCog, Building } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatDate } from "@/lib/utils.jsx"
import JobTypeBadge from "./JobTypeBadge"
import { usePage, router, Link } from '@inertiajs/react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { useState } from "react"
import ApplicationForm from "./ApplicationForm"

const InfoRow = ({ label, value }) => (
  <div className="grid grid-cols-[20%_80%] gap-y-2">
    <div className="text-sm">{label}</div>
    <div
      className="prose prose-sm max-w-none text-sm font-medium
        [&_.my-bullet-list]:list-disc [&_.my-bullet-list]:pl-6
        [&_.my-ordered-list]:list-decimal [&_.my-ordered-list]:pl-6
        [&_.my-list-item]:ml-4"
      dangerouslySetInnerHTML={{ __html: value }}
    />
  </div>
)

const compTypeHeaders = {
    org: "Organizational",
    lead: "Leadership / Managerial",
    func: "Technical / Functional"
}

const JobDescription = ({action, job, latestApp}) => {

    const [openAppForm, setOpenAppForm] = useState(false)

  return (
    <SheetContent className="w-1/2 flex flex-col">
        <SheetHeader>
            <SheetTitle className="flex flex-col gap-1 mb-4">
                <h3 className="text-2xl font-semibold">
                {job.position_description}{" "}
                {job.appointment_status === "Permanent" && `(${job.item_no})`}
                </h3>
                <span className="text-lg font-normal mb-4">{job.division_name ?? ""}</span>
                <div className="flex items-center gap-2 mb-6">
                    {action === "apply" && (
                        latestApp ? (
                            <Button className="w-fit" onClick={() => setOpenAppForm(true)}>
                                Apply Now
                            </Button>
                        ) : (
                            <Button
                            className="w-fit"
                            onClick={() =>
                                router.post(route("jobs.store", job.hashed_id))
                            }
                            >
                            Apply Now
                            </Button>
                        )
                    )}
                    <span className="text-sm font-medium">Deadline of Submission is <span className="text-red-500 font-semibold underline">{formatDate(job.date_closed)}</span></span>
                </div>
                <div className="space-y-2">
                    <div className="flex items-center gap-4">
                        <Building className="w-4 h-4" />
                        <JobTypeBadge type={job.appointment_status} />
                    </div>
                    {job.appointment_status === "Permanent" && (
                        <div className="flex items-center gap-4">
                            <FileCog className="w-4 h-4" />
                            <span className="text-sm font-normal">Plantilla Item No. {job.item_no}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-4">
                        <MapPin className="w-4 h-4" />
                        <span className="text-sm font-normal">{job.division_name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Banknote className="w-4 h-4" />
                        <span className="text-sm font-normal">
                            SG {job.sg} / 
                            P{parseFloat(job.monthly_salary).toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            })}</span>
                    </div>
                    <p className="text-sm font-medium">Posted on {formatDate(job.date_published)}</p>
                </div>
            </SheetTitle>
        </SheetHeader>
        <ScrollArea className="flex-1 pr-4">
            <div className="flex flex-col gap-6 pb-6">
                <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Qualification Standards</h3>
                    {job.appointment_status === "Permanent" ? (
                    <div className="border rounded-lg p-4 space-y-2">
                        <InfoRow label="Education:" value={job.prescribed_education} />
                        <InfoRow label="Experience:" value={job.prescribed_experience} />
                        <InfoRow label="Training:" value={job.prescribed_training} />
                        <InfoRow label="Eligibility:" value={job.prescribed_eligibility} />
                    </div>
                    ) : (
                    <div className="border rounded-lg p-4 space-y-2">
                        <InfoRow label="Education:" value={job.preferred_education} />
                        <InfoRow label="Experience:" value={job.preferred_experience} />
                        <InfoRow label="Training:" value={job.preferred_training} />
                        <InfoRow label="Eligibility:" value={job.preferred_eligibility} />
                    </div>
                    )}
                </div>

                <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Requirements</h3>
                    {job.requirements?.length > 0 && (
                    <div className="space-y-2">
                        <div className="border rounded-lg p-4">
                            <ol className="ml-6 list-decimal text-sm font-medium space-y-1">
                                {job.requirements.map((req, idx) => (
                                <li key={idx}>{req.requirement}</li>
                                ))}
                            </ol>
                        </div>
                    </div>
                    )} 
                </div>

                <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Job Summary</h3>
                    <div className="border rounded-lg p-4">
                    <div
                        className="prose prose-sm max-w-none text-sm font-medium
                        [&_.my-bullet-list]:list-disc [&_.my-bullet-list]:pl-6
                        [&_.my-ordered-list]:list-decimal [&_.my-ordered-list]:pl-6
                        [&_.my-list-item]:ml-4"
                        dangerouslySetInnerHTML={{ __html: job.summary }}
                    />
                    </div>
                </div>

                <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Job Output</h3>
                    <div className="border rounded-lg p-4">
                    <div
                        className="prose prose-sm max-w-none text-sm font-medium
                        [&_.my-bullet-list]:list-disc [&_.my-bullet-list]:pl-6
                        [&_.my-ordered-list]:list-decimal [&_.my-ordered-list]:pl-6
                        [&_.my-list-item]:ml-4"
                        dangerouslySetInnerHTML={{ __html: job.output }}
                    />
                    </div>
                </div>

                <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Duties and Responsibilities</h3>
                    <div className="border rounded-lg p-4">
                    <div
                        className="prose prose-sm max-w-none text-sm font-medium
                        [&_.my-bullet-list]:list-disc [&_.my-bullet-list]:pl-6
                        [&_.my-ordered-list]:list-decimal [&_.my-ordered-list]:pl-6
                        [&_.my-list-item]:ml-4"
                        dangerouslySetInnerHTML={{ __html: job.responsibility }}
                    />
                    </div>
                </div>
                {job.appointment_status === "Permanent" && (
                    <div className="space-y-2">
                        <h3 className="text-lg font-semibold">Competencies Required</h3>
                        <div className="border rounded-lg p-4">
                            {Object.entries(job.competencies || {}).map(([compType, compList]) => (
                            <div key={compType} className="mb-4">
                                <h3 className="font-semibold text-[16px] mb-1">
                                {compTypeHeaders[compType] || compType}
                                </h3>
                                <ul className="list-disc ml-6 text-[14px]">
                                {compList.map((comp) => (
                                    <li key={comp.value}>{comp.label}</li>
                                ))}
                                </ul>
                            </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </ScrollArea>
        <ApplicationForm
            open={openAppForm}
            onClose={() => setOpenAppForm(false)}
            job={job}
        />
    </SheetContent>
  )
}

export default JobDescription