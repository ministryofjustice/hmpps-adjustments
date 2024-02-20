import { dataAccess } from '../data'
import AdjustmentsStoreService from './adjustmentsStoreService'
import AdjustmentsService from './adjustmentsService'
import IdentifyRemandPeriodsService from './identifyRemandPeriodsService'
import PrisonerService from './prisonerService'
import UserService from './userService'
import AdditionalDaysAwardedService from './additionalDaysAwardedService'
import AdditionalDaysAwardedStoreService from './additionalDaysApprovalStoreService'
import CalculateReleaseDatesService from './calculateReleaseDatesService'
import UnusedDeductionsService from './unusedDeductionsService'
import PrisonerSearchService from './prisonerSearchService'

export const services = () => {
  const { applicationInfo, hmppsAuthClient, manageUsersApiClient } = dataAccess()

  const prisonerService = new PrisonerService(hmppsAuthClient)
  const userService = new UserService(manageUsersApiClient, prisonerService)
  const adjustmentsService = new AdjustmentsService()
  const identifyRemandPeriodsService = new IdentifyRemandPeriodsService()
  const adjustmentsStoreService = new AdjustmentsStoreService()
  const additionalDaysAwardedStoreService = new AdditionalDaysAwardedStoreService()
  const additionalDaysAwardedService = new AdditionalDaysAwardedService(
    additionalDaysAwardedStoreService,
    adjustmentsService,
  )
  const calculateReleaseDatesService = new CalculateReleaseDatesService()
  const unusedDeductionsService = new UnusedDeductionsService(adjustmentsService, calculateReleaseDatesService)
  const prisonerSearchService = new PrisonerSearchService(hmppsAuthClient)

  return {
    applicationInfo,
    userService,
    prisonerService,
    adjustmentsService,
    identifyRemandPeriodsService,
    adjustmentsStoreService,
    additionalDaysAwardedService,
    additionalDaysAwardedStoreService,
    calculateReleaseDatesService,
    unusedDeductionsService,
    prisonerSearchService,
  }
}

export type Services = ReturnType<typeof services>

export { UserService }
