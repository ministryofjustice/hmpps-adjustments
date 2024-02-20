import { components } from './index'
import { components as adjudicationComponents } from '../adjudications/index'

export type PrisonApiUserCaseloads = components['schemas']['CaseLoad']
export type PrisonApiCourtDateResult = components['schemas']['CourtDateResult']
export type PrisonApiBookingAndSentenceAdjustments = components['schemas']['BookingAndSentenceAdjustments']
export type PrisonApiSentenceAdjustments = components['schemas']['SentenceAdjustmentValues']
export type PrisonApiOffenderSentenceAndOffences = components['schemas']['OffenderSentenceAndOffences']
export type PrisonApiOffence = components['schemas']['OffenderOffence']

/*
Temporarily using prison api. The prison-api endpoint is deprecated and docs are hidden. The types are the same as the gateway from adjudications.
*/
interface adjudicationTypes {
  AdjudicationSearchResponse: {
    results?: adjudicationComponents['schemas']['Adjudication'][]
    /** @description A complete list of the type of offences that this offender has had adjudications for */
    offences: adjudicationComponents['schemas']['AdjudicationOffence'][]
    /** @description Complete list of agencies where this offender has had adjudications */
    agencies: adjudicationComponents['schemas']['Prison'][]
  }
  IndividualAdjudication: adjudicationComponents['schemas']['IndividualAdjudication']
}

export type PrisonApiAdjudicationSearchResponse = adjudicationTypes['AdjudicationSearchResponse']
export type PrisonApiIndividualAdjudication = adjudicationTypes['IndividualAdjudication']
export type PrisonApiSanction = adjudicationComponents['schemas']['Sanction']
