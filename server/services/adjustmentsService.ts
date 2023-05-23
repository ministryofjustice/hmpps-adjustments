import AdjustmentsClient from '../api/adjustmentsClient'
import { Adjustment, AdjustmentDetails, CreateResponse } from '../@types/adjustments/adjustmentsTypes'

export default class AdjustmentsService {
  public async create(adjustment: AdjustmentDetails, token: string): Promise<CreateResponse> {
    return new AdjustmentsClient(token).create(adjustment)
  }

  public async get(adjustmentId: string, token: string): Promise<AdjustmentDetails> {
    return new AdjustmentsClient(token).get(adjustmentId)
  }

  public async findByPerson(person: string, token: string): Promise<Adjustment[]> {
    return new AdjustmentsClient(token).findByPerson(person)
  }

  public async findByPersonAndSource(person: string, source: 'DPS' | 'NOMIS', token: string): Promise<Adjustment[]> {
    return new AdjustmentsClient(token).findByPersonAndSource(person, source)
  }

  public async update(adjustmentId: string, adjustment: AdjustmentDetails, token: string): Promise<void> {
    return new AdjustmentsClient(token).update(adjustmentId, adjustment)
  }

  public async delete(adjustmentId: string, token: string): Promise<void> {
    return new AdjustmentsClient(token).delete(adjustmentId)
  }
}
