import { defineConfig } from 'cypress'
import { resetStubs } from './integration_tests/mockApis/wiremock'
import auth from './integration_tests/mockApis/auth'
import manageUsersApi from './integration_tests/mockApis/manageUsersApi'
import tokenVerification from './integration_tests/mockApis/tokenVerification'
import prisonApi from './integration_tests/mockApis/prisonApi'
import adjustmentsApi from './integration_tests/mockApis/adjustmentsApi'
import identifyRemandApi from './integration_tests/mockApis/identifyRemandApi'
import prisonerSearchApi from './integration_tests/mockApis/prisonerSearchApi'
import components from './integration_tests/mockApis/components'
import courtCasesReleaseDatesApi from './integration_tests/mockApis/courtCasesReleaseDatesApi'

export default defineConfig({
  chromeWebSecurity: false,
  fixturesFolder: 'integration_tests/fixtures',
  screenshotsFolder: 'integration_tests/screenshots',
  videosFolder: 'integration_tests/videos',
  reporter: 'cypress-multi-reporters',
  reporterOptions: {
    configFile: 'reporter-config.json',
  },
  taskTimeout: 60000,
  e2e: {
    setupNodeEvents(on) {
      on('task', {
        reset: resetStubs,
        ...auth,
        ...manageUsersApi,
        ...tokenVerification,
        ...prisonApi,
        ...adjustmentsApi,
        ...identifyRemandApi,
        ...prisonerSearchApi,
        ...courtCasesReleaseDatesApi,
        ...components,
      })
    },
    baseUrl: 'http://localhost:3007',
    excludeSpecPattern: '**/!(*.cy).ts',
    specPattern: 'integration_tests/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'integration_tests/support/index.ts',
  },
})
