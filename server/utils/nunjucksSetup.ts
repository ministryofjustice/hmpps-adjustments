/* eslint-disable no-param-reassign */
import path from 'path'
import express from 'express'
import nunjucks from 'nunjucks'
import dayjs from 'dayjs'
import { personProfileName, personDateOfBirth, personStatus } from 'hmpps-design-system-frontend/hmpps/utils/utils'
import { initialiseName } from './utils'
import { ApplicationInfo } from '../applicationInfo'
import config from '../config'

const production = process.env.NODE_ENV === 'production'

export default function nunjucksSetup(app: express.Express, applicationInfo: ApplicationInfo): void {
  app.set('view engine', 'njk')

  app.locals.asset_path = '/assets/'
  app.locals.applicationName = 'Adjustments'

  // Cachebusting version string
  if (production) {
    // Version only changes with new commits
    app.locals.version = applicationInfo.gitShortHash
  } else {
    // Version changes every request
    app.use((req, res, next) => {
      res.locals.version = Date.now().toString()
      return next()
    })
  }

  const njkEnv = nunjucks.configure(
    [
      path.join(__dirname, '../../server/views'),
      'node_modules/govuk-frontend/',
      'node_modules/govuk-frontend/components/',
      'node_modules/@ministryofjustice/frontend/',
      'node_modules/@ministryofjustice/frontend/moj/components/',
      'node_modules/hmpps-design-system-frontend/',
      'node_modules/hmpps-design-system-frontend/hmpps/components/',
    ],
    {
      autoescape: true,
      express: app,
    },
  )

  // Expose the google tag manager container ID to the nunjucks environment
  const {
    analytics: { tagManagerContainerId },
  } = config

  njkEnv.addGlobal('tagManagerContainerId', tagManagerContainerId)

  njkEnv.addGlobal('digitalPrisonServicesUrl', config.services.digitalPrisonServices.url)

  njkEnv.addFilter('initialiseName', initialiseName)

  njkEnv.addFilter('formatListAsString', (list?: string[]) => {
    return list ? `[${list.map(i => `'${i}'`).join(',')}]` : '[]'
  })

  njkEnv.addFilter('date', (date, format) => dayjs(date).format(format))
  njkEnv.addFilter('personProfileName', personProfileName)
  njkEnv.addFilter('personDateOfBirth', personDateOfBirth)
  njkEnv.addFilter('personStatus', personStatus)
}
