type ChargeDetails = {
  chargeNumber: number
  toBeServed: string
  heardAt: string
  status: string
  days: number
}

type AdasByDateCharged = {
  dateChargeProved: Date
  charges: Ada[]
}

interface Ada extends ChargeDetails {
  dateChargeProved: Date
}

type AdasToReview = {
  adas: AdasByDateCharged[]
  totalAdas: number
  suspended: AdasByDateCharged[]
  totalSuspended: number
  awaitingApproval: AdasByDateCharged[]
  totalAwaitingApproval: number
}

export { ChargeDetails, AdasByDateCharged, Ada, AdasToReview }
