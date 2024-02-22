import AdjustmentsClient from '../api/adjustmentsClient'
import {
  Adjustment,
  AdjustmentStatus,
  CreateResponse,
  RestoreAdjustments,
  ValidationMessage,
} from '../@types/adjustments/adjustmentsTypes'

export default class AdjustmentsService {
  public async create(adjustments: Adjustment[], token: string): Promise<CreateResponse> {
    return new AdjustmentsClient(token).create(adjustments)
  }

  public async get(adjustmentId: string, token: string): Promise<Adjustment> {
    return new AdjustmentsClient(token).get(adjustmentId)
  }

  public async findByPerson(person: string, earliestSentenceDate: Date, token: string): Promise<Adjustment[]> {
    return new AdjustmentsClient(token).findByPerson(person, earliestSentenceDate.toISOString().substring(0, 10))
  }

  public async findByPersonOutsideSentenceEnvelope(person: string, token: string): Promise<Adjustment[]> {
    return new AdjustmentsClient(token).findByPerson(person)
  }

  public async findByPersonAndStatus(person: string, status: AdjustmentStatus, token: string): Promise<Adjustment[]> {
    return new AdjustmentsClient(token).findByPersonAndStatus(person, status)
  }

  public async update(adjustmentId: string, adjustment: Adjustment, token: string): Promise<void> {
    return new AdjustmentsClient(token).update(adjustmentId, adjustment)
  }

  public async delete(adjustmentId: string, token: string): Promise<void> {
    return new AdjustmentsClient(token).delete(adjustmentId)
  }

  public async validate(adjustment: Adjustment, token: string): Promise<ValidationMessage[]> {
    return new AdjustmentsClient(token).validate(adjustment)
  }

  public async restore(restore: RestoreAdjustments, token: string): Promise<void> {
    return new AdjustmentsClient(token).restore(restore)
  }

  public async getAdjustmentsExceptOneBeingEdited(
    sessionAdjustment: Record<string, Adjustment>,
    nomsId: string,
    token: string,
  ) {
    // When editing there is only one session adjustment
    const id = Object.keys(sessionAdjustment)[0]
    return (await this.findByPersonOutsideSentenceEnvelope(nomsId, token)).filter(it => it.id !== id)
  }
}
