import { dataAccess } from '../data'
import AdjustmentsStoreService from './adjustmentsStoreService'
import AdjustmentsService from './adjustmentsService'
import IdentifyRemandPeriodsService from './identifyRemandPeriodsService'
import PrisonerService from './prisonerService'
import UserService from './userService'
import AdditionalDaysAwardedStoreService from './additionalDaysApprovalStoreService'
import CalculateReleaseDatesService from './calculateReleaseDatesService'
import UnusedDeductionsService from './unusedDeductionsService'
import PrisonerSearchService from './prisonerSearchService'
import FeComponentsService from './feComponentsService'
import AdditionalDaysAwardedBackendService from './additionalDaysAwardedBackendService'

export const services = () => {
  const { applicationInfo, hmppsAuthClient, manageUsersApiClient, feComponentsClient } = dataAccess()

  const prisonerService = new PrisonerService()
  const userService = new UserService(manageUsersApiClient, prisonerService)
  const adjustmentsService = new AdjustmentsService()
  const identifyRemandPeriodsService = new IdentifyRemandPeriodsService()
  const adjustmentsStoreService = new AdjustmentsStoreService()
  const additionalDaysAwardedStoreService = new AdditionalDaysAwardedStoreService()
  const calculateReleaseDatesService = new CalculateReleaseDatesService()
  const unusedDeductionsService = new UnusedDeductionsService(adjustmentsService, calculateReleaseDatesService)
  const prisonerSearchService = new PrisonerSearchService(hmppsAuthClient)
  const feComponentsService = new FeComponentsService(feComponentsClient)
  const additionalDaysAwardedBackendService = new AdditionalDaysAwardedBackendService(
    adjustmentsService,
    additionalDaysAwardedStoreService,
  )

  return {
    applicationInfo,
    userService,
    prisonerService,
    adjustmentsService,
    identifyRemandPeriodsService,
    adjustmentsStoreService,
    additionalDaysAwardedStoreService,
    calculateReleaseDatesService,
    unusedDeductionsService,
    prisonerSearchService,
    feComponentsService,
    additionalDaysAwardedBackendService,
  }
}

export type Services = ReturnType<typeof services>

export { UserService }
