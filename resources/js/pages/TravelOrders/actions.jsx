// resources/js/pages/TravelOrders/actions.jsx

export const travelRequestActionMap = {
  Submit: {
    route: "travel-requests.submit",
    needsRemarks: false,
    title: "Confirm Submission",
    description: "Once submitted, you can not edit this travel request unless returned by PRU.",
    note: "If this travel has vehicle request, the request will be forwarded to the next approving authority.",
  },
  Return: {
    route: "travel-requests.return",
    needsRemarks: true,
    title: "Confirm Return",
    description: "This will return the travel request to the creator for revision.",
    note: "The requesting personnel will be notified regarding the returned travel request.",
  },
  Resubmit: {
    route: "travel-requests.resubmit",
    needsRemarks: false,
    title: "Confirm Resubmission",
    description: "This will resubmit the travel request and can not be edited.",
    note: "Make sure everything is correct before resubmitting.",
  },
}

export const vehicleRequestActionMap = {
  Submit: {
    route: "vehicle-requests.submit",
    needsRemarks: false,
    title: "Confirm Submission",
    description: "This will submit the vehicle request for endorsement of next authority.",
    note: "The next approving authority will be notified through email regarding the submission of vehicle request.",
  },
  Endorse: {
    route: "vehicle-requests.endorse",
    needsRemarks: false,
    title: "Confirm Endorsement",
    description: "This will be forwarded to PRU for review and assessment of the vehicle request.",
    note: "The PRU staff will be notified through email for review and assessment of the vehicle request.",
  },
  Review: {
    route: "vehicle-requests.review",
    needsRemarks: false,
    title: "Confirm Review",
    description: "This will be forwarded to the approving authority for appropriate action on the vehicle request.",
    note: "The approving authority will be notified through email for appropriate action on the vehicle request.",
  },
  Approve: {
    route: "vehicle-requests.approve",
    needsRemarks: false,
    title: "Confirm Approval",
    description: "The requesting personnel will be notified through email regarding the approval of the vehicle request.",
    note: "This will be forwarded to PRU for generation of trip ticket.",
  },
  
  Return: {
    route: "vehicle-requests.return",
    needsRemarks: true,
    title: "Confirm Return",
    description: "This will be forwarded to the request creator for editing of the vehicle request.",
    note: "The requesting personnel will be notified through email regarding the return of the vehicle request.",
  },
  Disapprove: {
    route: "vehicle-requests.disapprove",
    needsRemarks: true,
    title: "Confirm Disapproval",
    description: "This will disapprove the vehicle request.",
    note: "The requesting personnel will be notified through email regarding the disapproval of vehicle request.",
  },
  Resubmit: {
    route: "vehicle-requests.resubmit",
    needsRemarks: false,
    title: "Confirm Resubmission",
    description: "This will be forwarded to the returner of this vehicle request.",
    note: "The next approving authority will be notified through email regarding the submission of the vehicle request.",
  },
  "Vehicle Authorized": {
    route: "vehicle-requests.authorize",
    needsRemarks: false,
    title: "Confirm Authorization",
    description: "Are you sure you want to authorize the use of official vehicle?",
    note: "The requesting personnel will be notified through email regarding the authorization of vehicle use.",
  },
}
