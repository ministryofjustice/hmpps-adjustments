import { Request } from 'express'
import {
  AdaAdjudicationDetails,
  AdasByDateCharged,
  Adjustment,
  ProspectiveAdaRejection,
} from '../@types/adjustments/adjustmentsTypes'
import AdditionalDaysAwardedStoreService from './additionalDaysApprovalStoreService'
import AdjustmentsService from './adjustmentsService'
import { PrisonerSearchApiPrisoner } from '../@types/prisonerSearchApi/prisonerSearchTypes'
import AdditionalDaysAwardedBackendService from './additionalDaysAwardedBackendService'

jest.mock('../data/hmppsAuthClient')
jest.mock('./additionalDaysApprovalStoreService')
jest.mock('./adjustmentsService')

const storeService = new AdditionalDaysAwardedStoreService() as jest.Mocked<AdditionalDaysAwardedStoreService>
const adjustmentsService = new AdjustmentsService() as jest.Mocked<AdjustmentsService>
const adaService = new AdditionalDaysAwardedBackendService(adjustmentsService, storeService)

const token = 'token'

const adjudicationOneAdjustment = {
  id: '8569b6d4-9c6f-48d2-83db-bb5091f1011e',
  adjustmentType: 'ADDITIONAL_DAYS_AWARDED',
  additionalDaysAwarded: { adjudicationId: [1525916] },
} as Adjustment
const adjudicationTwoAdjustment = {
  id: 'd8069e08-5334-4f90-b59d-1748afbcfa6f',
  adjustmentType: 'ADDITIONAL_DAYS_AWARDED',
  additionalDaysAwarded: { adjudicationId: [1525917] },
} as Adjustment
const adjudicationThreeAdjustment = {
  id: 'a44b3d0b-3c56-4035-86d2-5ff75a85adfa',
  adjustmentType: 'ADDITIONAL_DAYS_AWARDED',
  additionalDaysAwarded: { adjudicationId: [1525918] },
} as Adjustment

const adjustmentResponsesWithChargeNumber = [
  adjudicationOneAdjustment,
  adjudicationTwoAdjustment,
  adjudicationThreeAdjustment,
]

describe('ADA submit functionality', () => {
  it('Approve ADAs where a mix of consecutive and concurrent charges exist', async () => {
    const nomsId = 'AA1234A'
    const bookingId = '1234'

    adjustmentsService.findByPersonOutsideSentenceEnvelope.mockResolvedValue(adjustmentResponsesWithChargeNumber)

    adjustmentsService.getAdaAdjudicationDetails.mockResolvedValue({
      awaitingApproval: [
        {
          dateChargeProved: '2023-08-03',
          charges: [
            {
              chargeNumber: 1525916,
              dateChargeProved: '2023-08-03',
              days: 5,
              heardAt: 'Moorland (HMP & YOI)',
              status: 'AWARDED_OR_PENDING',
              toBeServed: 'Forthwith',
              sequence: 15,
            },
            {
              chargeNumber: 1525917,
              dateChargeProved: '2023-08-03',
              days: 5,
              heardAt: 'Moorland (HMP & YOI)',
              status: 'AWARDED_OR_PENDING',
              toBeServed: 'Consecutive to 1525916',
              sequence: 16,
              consecutiveToSequence: 15,
            },
            {
              chargeNumber: 1525918,
              dateChargeProved: '2023-08-03',
              days: 5,
              heardAt: 'Moorland (HMP & YOI)',
              status: 'AWARDED_OR_PENDING',
              toBeServed: 'Concurrent',
              sequence: 17,
            },
          ],
          total: 10,
          status: 'PENDING_APPROVAL',
          adjustmentId: null,
        },
      ] as AdasByDateCharged[],
      suspended: [] as AdasByDateCharged[],
      quashed: [] as AdasByDateCharged[],
      awarded: [] as AdasByDateCharged[],
      prospective: [] as AdasByDateCharged[],
      totalProspective: 0,
      totalAwarded: 0,
      totalQuashed: 0,
      totalAwaitingApproval: 10,
      totalSuspended: 0,
      intercept: {
        number: 0,
        type: 'NONE',
        anyProspective: false,
      },
      showExistingAdaMessage: false,
      totalExistingAdas: 10,
    } as AdaAdjudicationDetails)

    const request = {} as jest.Mocked<Request>
    await adaService.submitAdjustments(
      request,
      {
        prisonerNumber: nomsId,
        bookingId,
      } as PrisonerSearchApiPrisoner,
      token,
    )
    expect(adjustmentsService.delete).toHaveBeenCalledTimes(3)
    expect(adjustmentsService.create).toHaveBeenCalledTimes(1)
  })

  it('Approve ADAs where only prospective rejected', async () => {
    const nomsId = 'AA1234A'
    const bookingId = '1234'

    adjustmentsService.findByPersonOutsideSentenceEnvelope.mockResolvedValue(adjustmentResponsesWithChargeNumber)

    adjustmentsService.getAdaAdjudicationDetails.mockResolvedValue({
      prospective: [
        {
          dateChargeProved: '2023-08-03',
          charges: [
            {
              chargeNumber: 1525916,
              dateChargeProved: '2023-08-03',
              days: 5,
              heardAt: 'Moorland (HMP & YOI)',
              status: 'AWARDED_OR_PENDING',
              toBeServed: 'Forthwith',
              sequence: 15,
            },
            {
              chargeNumber: 1525917,
              dateChargeProved: '2023-08-03',
              days: 5,
              heardAt: 'Moorland (HMP & YOI)',
              status: 'AWARDED_OR_PENDING',
              toBeServed: 'Consecutive to 1525916',
              sequence: 16,
              consecutiveToSequence: 15,
            },
            {
              chargeNumber: 1525918,
              dateChargeProved: '2023-08-03',
              days: 5,
              heardAt: 'Moorland (HMP & YOI)',
              status: 'AWARDED_OR_PENDING',
              toBeServed: 'Concurrent',
              sequence: 17,
            },
          ],
          total: 10,
          status: 'PROSPECTIVE',
          adjustmentId: null,
        },
      ] as AdasByDateCharged[],
      suspended: [] as AdasByDateCharged[],
      quashed: [] as AdasByDateCharged[],
      awarded: [] as AdasByDateCharged[],
      awaitingApproval: [] as AdasByDateCharged[],
      totalProspective: 10,
      totalAwarded: 0,
      totalQuashed: 0,
      totalAwaitingApproval: 0,
      totalSuspended: 0,
      intercept: {
        number: 1,
        type: 'PADA',
        anyProspective: true,
      },
      showExistingAdaMessage: false,
      totalExistingAdas: 10,
    } as AdaAdjudicationDetails)

    const request = {} as jest.Mocked<Request>
    await adaService.submitAdjustments(
      request,
      {
        prisonerNumber: nomsId,
        bookingId,
      } as PrisonerSearchApiPrisoner,
      token,
    )

    expect(adjustmentsService.rejectProspectiveAda).toHaveBeenCalledWith(
      nomsId,
      {
        dateChargeProved: '2023-08-03',
        person: nomsId,
        days: 10,
      } as ProspectiveAdaRejection,
      token,
    )
  })
})
