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
import ParamStoreService from './paramStoreService'
import CourtCasesReleaseDatesService from './courtCasesReleaseDatesService'

export const services = () => {
  const { applicationInfo, hmppsAuthClient, manageUsersApiClient, feComponentsClient } = dataAccess()

  const prisonerService = new PrisonerService(hmppsAuthClient)
  const userService = new UserService(manageUsersApiClient, prisonerService)
  const adjustmentsService = new AdjustmentsService(hmppsAuthClient)
  const identifyRemandPeriodsService = new IdentifyRemandPeriodsService(hmppsAuthClient)
  const adjustmentsStoreService = new AdjustmentsStoreService()
  const paramStoreService = new ParamStoreService()
  const additionalDaysAwardedStoreService = new AdditionalDaysAwardedStoreService()
  const calculateReleaseDatesService = new CalculateReleaseDatesService(hmppsAuthClient)
  const unusedDeductionsService = new UnusedDeductionsService(adjustmentsService, prisonerService)
  const prisonerSearchService = new PrisonerSearchService(hmppsAuthClient)
  const feComponentsService = new FeComponentsService(feComponentsClient)
  const additionalDaysAwardedBackendService = new AdditionalDaysAwardedBackendService(
    adjustmentsService,
    additionalDaysAwardedStoreService,
  )
  const courtCasesReleaseDatesService = new CourtCasesReleaseDatesService()

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
    paramStoreService,
    courtCasesReleaseDatesService,
  }
}

export type Services = ReturnType<typeof services>

export { UserService }
