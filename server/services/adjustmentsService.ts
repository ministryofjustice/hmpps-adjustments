import AdjustmentsClient from '../api/adjustmentsClient'
import {
  AdaAdjudicationDetails,
  Adjustment,
  AdjustmentStatus,
  CreateResponse,
  ProspectiveAdaRejection,
  RestoreAdjustments,
  UnusedDeductionsCalculationResult,
  ValidationMessage,
} from '../@types/adjustments/adjustmentsTypes'
import { HmppsAuthClient } from '../data'

export default class AdjustmentsService {
  constructor(private readonly hmppsAuthClient: HmppsAuthClient) {}

  public async create(adjustments: Adjustment[], username: string): Promise<CreateResponse> {
    return new AdjustmentsClient(await this.getSystemClientToken(username)).create(adjustments)
  }

  public async get(adjustmentId: string, username: string): Promise<Adjustment> {
    return new AdjustmentsClient(await this.getSystemClientToken(username)).get(adjustmentId)
  }

  public async setUnusedDaysManually(person: string, days: number, username: string) {
    return new AdjustmentsClient(await this.getSystemClientToken(username)).setUnusedDaysManually(person, { days })
  }

  public async getUnusedDeductionsCalculationResult(
    person: string,
    username: string,
  ): Promise<UnusedDeductionsCalculationResult> {
    return new AdjustmentsClient(await this.getSystemClientToken(username)).getUnusedDeductionsCalculationResult(person)
  }

  public async findByPerson(person: string, earliestSentenceDate: Date, username: string): Promise<Adjustment[]> {
    return new AdjustmentsClient(await this.getSystemClientToken(username)).findByPerson(
      person,
      earliestSentenceDate.toISOString().substring(0, 10),
    )
  }

  public async findByPersonOutsideSentenceEnvelope(person: string, username: string): Promise<Adjustment[]> {
    return new AdjustmentsClient(await this.getSystemClientToken(username)).findByPerson(person)
  }

  public async findByPersonAndStatus(
    person: string,
    status: AdjustmentStatus,
    username: string,
  ): Promise<Adjustment[]> {
    return new AdjustmentsClient(await this.getSystemClientToken(username)).findByPersonAndStatus(person, status)
  }

  public async update(adjustmentId: string, adjustment: Adjustment, username: string): Promise<void> {
    return new AdjustmentsClient(await this.getSystemClientToken(username)).update(adjustmentId, adjustment)
  }

  public async delete(adjustmentId: string, username: string): Promise<void> {
    return new AdjustmentsClient(await this.getSystemClientToken(username)).delete(adjustmentId)
  }

  public async validate(adjustment: Adjustment, username: string): Promise<ValidationMessage[]> {
    return new AdjustmentsClient(await this.getSystemClientToken(username)).validate(adjustment)
  }

  public async restore(restore: RestoreAdjustments, username: string): Promise<void> {
    return new AdjustmentsClient(await this.getSystemClientToken(username)).restore(restore)
  }

  public async getAdjustmentsExceptOneBeingEdited(
    sessionAdjustment: Record<string, Adjustment>,
    nomsId: string,
    username: string,
  ) {
    // When editing there is only one session adjustment
    const id = Object.keys(sessionAdjustment)[0]
    return (await this.findByPersonOutsideSentenceEnvelope(nomsId, username)).filter(it => it.id !== id)
  }

  public async getAdaAdjudicationDetails(
    person: string,
    username: string,
    activeCaseLoadId: string,
    selectedPadas: string[] = [],
  ): Promise<AdaAdjudicationDetails> {
    return new AdjustmentsClient(await this.getSystemClientToken(username)).getAdaAdjudicationDetails(
      person,
      selectedPadas,
      activeCaseLoadId,
    )
  }

  public async rejectProspectiveAda(
    person: string,
    prospectiveAdaRejection: ProspectiveAdaRejection,
    username: string,
  ) {
    return new AdjustmentsClient(await this.getSystemClientToken(username)).rejectProspectiveAda(
      person,
      prospectiveAdaRejection,
    )
  }

  private async getSystemClientToken(username: string): Promise<string> {
    return this.hmppsAuthClient.getSystemClientToken(username)
  }
}
