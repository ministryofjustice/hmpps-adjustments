import AdjustmentsClient from '../api/adjustmentsClient'
import { Adjustment, CreateResponse, ValidationMessage } from '../@types/adjustments/adjustmentsTypes'

export default class AdjustmentsService {
  public async create(adjustment: Adjustment, token: string): Promise<CreateResponse> {
    return new AdjustmentsClient(token).create(adjustment)
  }

  public async get(adjustmentId: string, token: string): Promise<Adjustment> {
    return new AdjustmentsClient(token).get(adjustmentId)
  }

  public async findByPerson(person: string, token: string): Promise<Adjustment[]> {
    return new AdjustmentsClient(token).findByPerson(person)
  }

  public async findByPersonAndSource(person: string, source: 'DPS' | 'NOMIS', token: string): Promise<Adjustment[]> {
    return new AdjustmentsClient(token).findByPersonAndSource(person, source)
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
}
