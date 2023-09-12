import { dataAccess } from '../data'
import AdjustmentsStoreService from './adjustmentsStoreService'
import AdjustmentsService from './adjustmentsService'
import IdentifyRemandPeriodsService from './identifyRemandPeriodsService'
import PrisonerService from './prisonerService'
import UserService from './userService'
import AdditionalDaysAwardedService from './additionalDaysAwardedService'

export const services = () => {
  const { hmppsAuthClient, applicationInfo } = dataAccess()

  const userService = new UserService(hmppsAuthClient)
  const prisonerService = new PrisonerService(hmppsAuthClient)
  const adjustmentsService = new AdjustmentsService()
  const identifyRemandPeriodsService = new IdentifyRemandPeriodsService()
  const adjustmentsStoreService = new AdjustmentsStoreService()
  const additionalDaysAwardedService = new AdditionalDaysAwardedService()

  return {
    applicationInfo,
    userService,
    prisonerService,
    adjustmentsService,
    identifyRemandPeriodsService,
    adjustmentsStoreService,
    additionalDaysAwardedService,
  }
}

export type Services = ReturnType<typeof services>

export { UserService }
