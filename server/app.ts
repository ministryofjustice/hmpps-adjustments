import express from 'express'

import createError from 'http-errors'

import nunjucksSetup from './utils/nunjucksSetup'
import errorHandler from './errorHandler'
import authorisationMiddleware from './middleware/authorisationMiddleware'
import { metricsMiddleware } from './monitoring/metricsApp'

import setUpAuthentication from './middleware/setUpAuthentication'
import setUpCsrf from './middleware/setUpCsrf'
import setUpCurrentUser from './middleware/setUpCurrentUser'
import setUpHealthChecks from './middleware/setUpHealthChecks'
import setUpStaticResources from './middleware/setUpStaticResources'
import setUpWebRequestParsing from './middleware/setupRequestParsing'
import setUpWebSecurity from './middleware/setUpWebSecurity'
import setUpWebSession from './middleware/setUpWebSession'

import routes from './routes'
import type { Services } from './services'
import populateCurrentPrisoner from './middleware/populateCurrentPrisoner'
import getFrontendComponents from './middleware/getFeComponents'
import supportUserReadonlyMiddleware from './middleware/supportUserReadonlyMiddleware'

export default function createApp(services: Services): express.Application {
  const app = express()

  app.set('json spaces', 2)
  app.set('trust proxy', true)
  app.set('port', process.env.PORT || 3000)

  app.use(metricsMiddleware)
  app.use(setUpHealthChecks(services.applicationInfo))
  app.use(setUpWebSecurity())
  app.use(setUpWebSession())
  app.use(setUpWebRequestParsing())
  app.use(setUpStaticResources())
  nunjucksSetup(app, services.applicationInfo)
  app.use(setUpAuthentication())
  app.use(authorisationMiddleware(['ROLE_RELEASE_DATES_CALCULATOR']))
  app.use(setUpCsrf())
  app.use(setUpCurrentUser(services))

  app.use((req, res, next) => {
    if (req.method === 'GET') return getFrontendComponents(services)(req, res, next)
    if (req.method === 'POST') return supportUserReadonlyMiddleware()(req, res, next)
    return next()
  })

  app.use('/:nomsId', populateCurrentPrisoner(services.prisonerSearchService))

  app.use(routes(services))

  app.use((req, res, next) => next(createError(404, 'Not found')))
  app.use(errorHandler(process.env.NODE_ENV === 'production'))

  return app
}
