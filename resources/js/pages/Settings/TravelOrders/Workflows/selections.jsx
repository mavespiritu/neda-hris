export const processOptions = [
  { label: "Travel Request", value: "travel_request" },
  { label: "Vehicle Request", value: "vehicle_request" },
  { label: "Trip Ticket", value: "trip_ticket" },
]

export const stateOptions = [
  { label: "Draft", value: "Draft" },
  { label: "Submitted", value: "Submitted" },
  { label: "Endorsed", value: "Endorsed" },
  { label: "Reviewed", value: "Reviewed" },
  { label: "Approved", value: "Approved" },
  { label: "Vehicle Authorized", value: "Vehicle Authorized" },
  { label: "Returned", value: "Returned" },
  { label: "Resubmitted", value: "Resubmitted" },
  { label: "Disapproved", value: "Disapproved" },
]

export const actorTypeOptions = [
  { label: "Creator", value: "Creator" },
  { label: "Recommending_VR", value: "Recommending_VR" },
  { label: "Approver_VR", value: "Approver_VR" },
  { label: "Reviewer_VR", value: "Reviewer_VR" },
  { label: "Approver_TT", value: "Approver_TT" },
  { label: "Custom", value: "Custom" },
]

export const scopeTypeOptions = [
  { label: "Creator", value: "creator" },
  { label: "Division", value: "division" },
  { label: "Unit", value: "unit" },
  { label: "Office", value: "office" },
  { label: "Department", value: "department" },
  { label: "Global", value: "global" },
  { label: "Custom", value: "custom" },
]

export const scopeSourceOptions = [
  { label: "Creator", value: "creator" },
  { label: "Request", value: "request" },
  { label: "Current Actor", value: "current_actor" },
  { label: "Fixed Value", value: "fixed" },
]

export const scopeMatchOptions = [
  { label: "Exact", value: "exact" },
  { label: "Ancestor", value: "ancestor" },
  { label: "Descendant", value: "descendant" },
  { label: "Contains", value: "contains" },
]

export const actionOptions = [
  { label: "Submit", value: "submit" },
  { label: "Endorse", value: "endorse" },
  { label: "Review", value: "review" },
  { label: "Approve", value: "approve" },
  { label: "Authorize", value: "authorize" },
  { label: "Return", value: "return" },
  { label: "Resubmit", value: "resubmit" },
  { label: "Disapprove", value: "disapprove" },
]

export const recipientRoleOptions = [
  { label: "Next Actor", value: "next_actor" },
  { label: "Creator", value: "creator" },
  { label: "FYI Creator", value: "fyi_creator" },
  { label: "Signatory Group", value: "signatory_group" },
  { label: "All Assignees", value: "all_assignees" },
]
