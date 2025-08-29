import { Request } from 'express'
import { AdaIntercept, AdasToReview, AdasToView, PadasToReview } from '../@types/AdaTypes'
import PadaForm from '../model/padaForm'
import AdditionalDaysAwardedStoreService from './additionalDaysApprovalStoreService'
import AdjustmentsService from './adjustmentsService'
import { Adjustment, AdasByDateCharged } from '../@types/adjustments/adjustmentsTypes'
import { PrisonerSearchApiPrisoner } from '../@types/prisonerSearchApi/prisonerSearchTypes'
import ReviewAndSubmitAdaViewModel from '../model/reviewAndSubmitAdaViewModel'

export default class AdditionalDaysAwardedBackendService {
  constructor(
    private readonly adjustmentsService: AdjustmentsService,
    private readonly additionalDaysAwardedStoreService: AdditionalDaysAwardedStoreService,
  ) {}

  public async viewAdjustments(nomsId: string, username: string, activeCaseLoadId: string): Promise<AdasToView> {
    const response = await this.adjustmentsService.getAdaAdjudicationDetails(nomsId, username, activeCaseLoadId)
    const adjustments = (await this.adjustmentsService.findByPersonOutsideSentenceEnvelope(nomsId, username)).filter(
      it => it.adjustmentType === 'ADDITIONAL_DAYS_AWARDED',
    )
    return {
      ...response,
      adjustments,
    }
  }

  public async getAdasToApprove(
    req: Request,
    nomsId: string,
    username: string,
    activeCaseLoadId: string,
  ): Promise<AdasToReview> {
    const selected = this.additionalDaysAwardedStoreService.getSelectedPadas(req, nomsId)
    const details = await this.adjustmentsService.getAdaAdjudicationDetails(
      nomsId,
      username,
      activeCaseLoadId,
      selected,
    )
    let adjustmentsToRemove: Adjustment[] = []
    if (details.showExistingAdaMessage) {
      adjustmentsToRemove = (
        await this.adjustmentsService.findByPersonOutsideSentenceEnvelope(nomsId, username)
      ).filter(it => it.adjustmentType === 'ADDITIONAL_DAYS_AWARDED')
    }
    let showRecallMessage = false
    if (details.earliestRecallDate) {
      showRecallMessage = details.awaitingApproval.some(it => {
        const isBeforeStandardSentence =
          !details.earliestNonRecallSentenceDate ||
          new Date(it.dateChargeProved) < new Date(details.earliestNonRecallSentenceDate)
        const isAfterRecallDate = new Date(it.dateChargeProved) > new Date(details.earliestRecallDate)
        return isBeforeStandardSentence && isAfterRecallDate
      })
    }
    return { ...details, showRecallMessage, adjustmentsToRemove }
  }

  public async getPadasToApprove(nomsId: string, username: string, activeCaseLoadId: string): Promise<PadasToReview> {
    return this.adjustmentsService.getAdaAdjudicationDetails(nomsId, username, activeCaseLoadId)
  }

  public storeSelectedPadas(req: Request, nomsId: string, padaForm: PadaForm): void {
    this.additionalDaysAwardedStoreService.storeSelectedPadas(req, nomsId, padaForm.getSelectedProspectiveAdas())
  }

  public async shouldIntercept(nomsId: string, username: string, activeCaseLoadId: string): Promise<AdaIntercept> {
    const response = await this.adjustmentsService.getAdaAdjudicationDetails(nomsId, username, activeCaseLoadId)
    return response.intercept
  }

  public async getReviewAndSubmitModel(
    req: Request,
    prisonerDetail: PrisonerSearchApiPrisoner,
    username: string,
    activeCaseLoadId: string,
  ): Promise<ReviewAndSubmitAdaViewModel> {
    const { adjustmentsToCreate, allAdaAdjustments, quashed } = await this.getAdasToSubmitAndDelete(
      req,
      prisonerDetail,
      username,
      activeCaseLoadId,
    )

    const quashedAdjustments = quashed
      .map(it => {
        return allAdaAdjustments.find(adjustment => this.adjustmentMatchesAdjudication(it, adjustment))
      })
      .filter(it => !!it)
    return new ReviewAndSubmitAdaViewModel(adjustmentsToCreate, allAdaAdjustments, quashedAdjustments)
  }

  public async submitAdjustments(
    req: Request,
    prisonerDetail: PrisonerSearchApiPrisoner,
    username: string,
    activeCaseLoadId: string,
  ) {
    const { awarded, adjustmentsToCreate, allAdaAdjustments, prospectiveRejected } =
      await this.getAdasToSubmitAndDelete(req, prisonerDetail, username, activeCaseLoadId)

    const awardedIds = awarded.map(it => it.adjustmentId)
    // Delete all ADAs which were not in the awarded table.
    await Promise.all(
      allAdaAdjustments
        .filter(it => awardedIds.indexOf(it.id) === -1)
        .map(it => {
          return this.adjustmentsService.delete(it.id, username)
        }),
    )
    if (adjustmentsToCreate.length) {
      // Create adjustments
      await this.adjustmentsService.create(adjustmentsToCreate, username)
    }

    await Promise.all(
      awarded
        .filter(it => it.adjustmentId)
        .map(it => {
          return this.adjustmentsService.update(
            it.adjustmentId,
            {
              id: it.adjustmentId,
              ...this.toAdjustment(prisonerDetail, it),
            },
            username,
          )
        }),
    )

    await Promise.all(
      prospectiveRejected.map(it => {
        return this.adjustmentsService.rejectProspectiveAda(
          prisonerDetail.prisonerNumber,
          {
            person: prisonerDetail.prisonerNumber,
            days: it.total,
            dateChargeProved: it.dateChargeProved,
          },
          username,
        )
      }),
    )

    this.additionalDaysAwardedStoreService.clearSelectedPadas(req, prisonerDetail.prisonerNumber)
  }

  private adjustmentMatchesAdjudication(adjudication: AdasByDateCharged, adjustment: Adjustment): boolean {
    return (
      adjudication.total === adjustment.days &&
      adjudication.dateChargeProved === adjustment.fromDate &&
      JSON.stringify(adjudication.charges.map(charge => charge.chargeNumber).sort()) ===
        JSON.stringify(adjustment.additionalDaysAwarded.adjudicationId.sort())
    )
  }

  private async getAdasToSubmitAndDelete(
    req: Request,
    prisonerDetail: PrisonerSearchApiPrisoner,
    username: string,
    activeCaseLoadId: string,
  ): Promise<{
    adjustmentsToCreate: Adjustment[]
    awarded: AdasByDateCharged[]
    allAdaAdjustments: Adjustment[]
    quashed: AdasByDateCharged[]
    prospectiveRejected: AdasByDateCharged[]
  }> {
    const allAdaAdjustments = (
      await this.adjustmentsService.findByPersonOutsideSentenceEnvelope(prisonerDetail.prisonerNumber, username)
    ).filter(it => it.adjustmentType === 'ADDITIONAL_DAYS_AWARDED')

    const selected = this.additionalDaysAwardedStoreService.getSelectedPadas(req, prisonerDetail.prisonerNumber)
    const response = await this.adjustmentsService.getAdaAdjudicationDetails(
      prisonerDetail.prisonerNumber,
      username,
      activeCaseLoadId,
      selected,
    )

    /* Rejected PADAs are not awarded or pending */
    const prospectiveRejected = response.prospective.filter(it => {
      const isAwarded = this.prospectiveAdjudicationMatches(it, response.awarded)
      const isPending = this.prospectiveAdjudicationMatches(it, response.awaitingApproval)
      return !isAwarded && !isPending
    })

    return {
      awarded: response.awarded,
      allAdaAdjustments,
      adjustmentsToCreate: response.awaitingApproval.map(it => this.toAdjustment(prisonerDetail, it)),
      quashed: response.quashed,
      prospectiveRejected,
    }
  }

  private prospectiveAdjudicationMatches(prospective: AdasByDateCharged, adas: AdasByDateCharged[]) {
    return adas.some(
      it => it.dateChargeProved === prospective.dateChargeProved && it.charges[0].status === 'PROSPECTIVE',
    )
  }

  private toAdjustment(prisonerDetail: PrisonerSearchApiPrisoner, it: AdasByDateCharged) {
    return {
      person: prisonerDetail.prisonerNumber,
      bookingId: parseInt(prisonerDetail.bookingId, 10),
      adjustmentType: 'ADDITIONAL_DAYS_AWARDED',
      fromDate: it.dateChargeProved,
      days: it.total,
      prisonId: prisonerDetail.prisonId,
      additionalDaysAwarded: {
        adjudicationId: it.charges.map(charge => charge.chargeNumber),
        prospective: it.charges.some(charge => charge.status === 'PROSPECTIVE'),
      },
    } as Adjustment
  }
}
