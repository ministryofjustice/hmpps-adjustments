const production = process.env.NODE_ENV === 'production'

function get<T>(name: string, fallback: T, options = { requireInProduction: false }): T | string {
  if (process.env[name]) {
    return process.env[name]
  }
  if (fallback !== undefined && (!production || !options.requireInProduction)) {
    return fallback
  }
  throw new Error(`Missing env var ${name}`)
}

const requiredInProduction = { requireInProduction: true }

export class AgentConfig {
  // Sets the working socket to timeout after timeout milliseconds of inactivity on the working socket.
  timeout: number

  constructor(timeout = 8000) {
    this.timeout = timeout
  }
}

export interface ApiConfig {
  url: string
  timeout: {
    // sets maximum time to wait for the first byte to arrive from the server, but it does not limit how long the
    // entire download can take.
    response: number
    // sets a deadline for the entire request (including all uploads, redirects, server processing time) to complete.
    // If the response isn't fully downloaded within that time, the request will be aborted.
    deadline: number
  }
  agent: AgentConfig
}

export default {
  buildNumber: get('BUILD_NUMBER', '1_0_0', requiredInProduction),
  productId: get('PRODUCT_ID', 'UNASSIGNED', requiredInProduction),
  gitRef: get('GIT_REF', 'xxxxxxxxxxxxxxxxxxx', requiredInProduction),
  branchName: get('GIT_BRANCH', 'xxxxxxxxxxxxxxxxxxx', requiredInProduction),
  production,
  https: production,
  staticResourceCacheDuration: '1h',
  redis: {
    enabled: get('REDIS_ENABLED', 'false', requiredInProduction) === 'true',
    host: get('REDIS_HOST', 'localhost', requiredInProduction),
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_AUTH_TOKEN,
    tls_enabled: get('REDIS_TLS_ENABLED', 'false'),
  },
  session: {
    secret: get('SESSION_SECRET', 'app-insecure-default-session', requiredInProduction),
    expiryMinutes: Number(get('WEB_SESSION_TIMEOUT_IN_MINUTES', 20)),
  },
  apis: {
    hmppsAuth: {
      url: get('HMPPS_AUTH_URL', 'http://localhost:9090/auth', requiredInProduction),
      externalUrl: get('HMPPS_AUTH_EXTERNAL_URL', get('HMPPS_AUTH_URL', 'http://localhost:9090/auth')),
      timeout: {
        response: Number(get('HMPPS_AUTH_TIMEOUT_RESPONSE', 10000)),
        deadline: Number(get('HMPPS_AUTH_TIMEOUT_DEADLINE', 10000)),
      },
      agent: new AgentConfig(Number(get('HMPPS_AUTH_TIMEOUT_RESPONSE', 10000))),
      apiClientId: get('API_CLIENT_ID', 'clientid', requiredInProduction),
      apiClientSecret: get('API_CLIENT_SECRET', 'clientsecret', requiredInProduction),
      systemClientId: get('SYSTEM_CLIENT_ID', 'clientid', requiredInProduction),
      systemClientSecret: get('SYSTEM_CLIENT_SECRET', 'clientsecret', requiredInProduction),
    },
    manageUsersApi: {
      url: get('MANAGE_USERS_API_URL', 'http://localhost:9091', requiredInProduction),
      timeout: {
        response: Number(get('MANAGE_USERS_API_TIMEOUT_RESPONSE', 10000)),
        deadline: Number(get('MANAGE_USERS_API_TIMEOUT_DEADLINE', 10000)),
      },
      agent: new AgentConfig(Number(get('MANAGE_USERS_API_TIMEOUT_RESPONSE', 10000))),
    },
    tokenVerification: {
      url: get('TOKEN_VERIFICATION_API_URL', 'http://localhost:8100', requiredInProduction),
      timeout: {
        response: Number(get('TOKEN_VERIFICATION_API_TIMEOUT_RESPONSE', 5000)),
        deadline: Number(get('TOKEN_VERIFICATION_API_TIMEOUT_DEADLINE', 5000)),
      },
      agent: new AgentConfig(Number(get('TOKEN_VERIFICATION_API_TIMEOUT_RESPONSE', 5000))),
      enabled: get('TOKEN_VERIFICATION_ENABLED', 'false') === 'true',
    },
    prisonApi: {
      url: get('PRISON_API_URL', 'http://localhost:8080', requiredInProduction),
      timeout: {
        response: get('PRISON_API_TIMEOUT_RESPONSE', 10000),
        deadline: get('PRISON_API_TIMEOUT_DEADLINE', 10000),
      },
      agent: new AgentConfig(Number(get('PRISON_API_AGENT_TIMEOUT', 20000))),
    },
    identifyRemandPeriods: {
      url: get('IDENTIFY_REMAND_PERIODS_API_URL', 'http://localhost:8080', requiredInProduction),
      timeout: {
        response: get('IDENTIFY_REMAND_PERIODS_API_TIMEOUT_RESPONSE', 10000),
        deadline: get('IDENTIFY_REMAND_PERIODS_API_TIMEOUT_DEADLINE', 10000),
      },
      agent: new AgentConfig(),
    },
    adjustments: {
      url: get('ADJUSTMENTS_API_URL', 'http://localhost:8080', requiredInProduction),
      timeout: {
        response: get('ADJUSTMENTS_API_TIMEOUT_RESPONSE', 10000),
        deadline: get('ADJUSTMENTS_API_TIMEOUT_DEADLINE', 10000),
      },
      agent: new AgentConfig(),
    },
    courtCasesReleaseDatesApi: {
      url: get('COURT_CASES_RELEASE_DATES_API_URL', 'http://localhost:8083', requiredInProduction),
      timeout: {
        response: Number(get('COURT_CASES_RELEASE_DATES_API_TIMEOUT_RESPONSE', 10000)),
        deadline: Number(get('COURT_CASES_RELEASE_DATES_API_TIMEOUT_DEADLINE', 10000)),
      },
      agent: new AgentConfig(Number(get('COURT_CASES_RELEASE_DATES_API_TIMEOUT_RESPONSE', 10000))),
    },
    adjudications: {
      url: get('ADJUDICATIONS_API_URL', 'http://localhost:8080', requiredInProduction),
      timeout: {
        response: get('ADJUDICATIONS_API_TIMEOUT_RESPONSE', 10000),
        deadline: get('ADJUDICATIONS_API_TIMEOUT_DEADLINE', 10000),
      },
      agent: new AgentConfig(Number(get('ADJUDICATIONS_API_AGENT_TIMEOUT', 20000))),
    },
    calculateReleaseDates: {
      url: get('CALCULATE_RELEASE_DATES_API_URL', 'http://localhost:8089', requiredInProduction),
      timeout: {
        response: Number(get('CALCULATE_RELEASE_DATES_API_TIMEOUT_RESPONSE', 10000)),
        deadline: Number(get('CALCULATE_RELEASE_DATES_API_TIMEOUT_DEADLINE', 10000)),
      },
      agent: new AgentConfig(Number(get('CALCULATE_RELEASE_DATES_API_TIMEOUT', 10000))),
    },
    prisonerSearchApi: {
      url: get('PRISONER_SEARCH_API_URL', 'http://localhost:8110', requiredInProduction),
      timeout: {
        response: Number(get('PRISONER_SEARCH_API_TIMEOUT_RESPONSE', 10000)),
        deadline: Number(get('PRISONER_SEARCH_API_TIMEOUT_DEADLINE', 10000)),
      },
      agent: new AgentConfig(Number(get('PRISONER_SEARCH_API_TIMEOUT', 10000))),
    },
    frontendComponents: {
      url: get('COMPONENT_API_URL', 'http://localhost:8082', requiredInProduction),
      timeout: {
        response: Number(get('COMPONENT_API_TIMEOUT_SECONDS', 10000)),
        deadline: Number(get('COMPONENT_API_TIMEOUT_SECONDS', 10000)),
      },
      agent: new AgentConfig(Number(get('COMPONENT_API_TIMEOUT_SECONDS', 10000))),
      enabled: get('COMMON_COMPONENTS_ENABLED', 'false') === 'true',
    },
  },
  services: {
    recallsUI: {
      url: get('RECALLS_URL', 'http://localhost:8080', requiredInProduction),
    },
    calculateReleaseDatesUI: {
      url: get('CALCULATE_RELEASE_DATES_URL', 'http://localhost:8080', requiredInProduction),
    },
    digitalPrisonServices: {
      url: get('DIGITAL_PRISON_SERVICES_URL', 'http://localhost:3000/dps', requiredInProduction),
    },
    identifyRemandPeriods: {
      url: get('IDENTIFY_REMAND_PERIODS_URL', 'http://localhost:3000/iden', requiredInProduction),
    },
  },
  domain: get('INGRESS_URL', 'http://localhost:3000', requiredInProduction),
  environmentName: get('ENVIRONMENT_NAME', ''),
  analytics: {
    tagManagerContainerId: get('TAG_MANAGER_CONTAINER_ID', false),
    appInsightsConnectionString: get('APPLICATIONINSIGHTS_CONNECTION_STRING', '', requiredInProduction),
  },
  featureToggles: {
    timeSpentInCustodyAbroadEnabled: get('TIME_SPENT_IN_CUSTODY_ABROAD_ENABLED', 'true') === 'true',
    timeSpentAsAnAppealApplicantEnabled: get('TIME_SPENT_AS_AN_APPEAL_APPLICANT_ENABLED', 'true') === 'true',
  },
  blockSupportUsersFromEdit: get('BLOCK_SUPPORT_USERS_FROM_EDIT', 'true') === 'true',
}
