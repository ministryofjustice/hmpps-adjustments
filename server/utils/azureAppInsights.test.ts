import { DataTelemetry, EnvelopeTelemetry } from 'applicationinsights/out/Declarations/Contracts'
import jwt from 'jsonwebtoken'
import { addCustomDataToRequests, ContextObject } from './azureAppInsights'

const userUuid = '11111111-2222-3333-4444-555555555555'
const token = jwt.sign({ user_uuid: userUuid }, 'secret')

const user = {
  username: 'test-user',
  user_uuid: userUuid,
}

const createEnvelope = (properties: Record<string, string | boolean>, baseType = 'RequestData') =>
  ({
    data: {
      baseType,
      baseData: { properties },
    } as DataTelemetry,
  }) as EnvelopeTelemetry

const createContext = (username: string, userToken?: string) =>
  ({
    'http.ServerRequest': {
      res: {
        locals: {
          user: {
            username,
            token: userToken,
          },
        },
      },
    },
  }) as ContextObject

const context = createContext(user.username, token)

describe('azureAppInsights', () => {
  describe('addUserDataToRequests', () => {
    it('adds user data to properties when present', () => {
      const envelope = createEnvelope({ other: 'things' })

      addCustomDataToRequests(envelope, context)

      expect(envelope.data.baseData.properties).toStrictEqual({
        ...user,
        other: 'things',
      })
    })

    it('handles absent user data', () => {
      const envelope = createEnvelope({})

      addCustomDataToRequests(envelope, context)

      expect(envelope.data.baseData.properties).toStrictEqual({
        ...user,
      })
    })

    it('returns true when not RequestData type', () => {
      const envelope = createEnvelope({}, 'NOT_REQUEST_DATA')

      const response = addCustomDataToRequests(envelope, context)

      expect(response).toStrictEqual(true)
    })

    it('handles when no properties have been set', () => {
      const envelope = createEnvelope(undefined)

      addCustomDataToRequests(envelope, context)

      expect(envelope.data.baseData.properties).toStrictEqual(user)
    })

    it('omits userUuid when token is missing or invalid', () => {
      ;[undefined, 'not-a-jwt'].forEach(badToken => {
        const envelope = createEnvelope({})

        addCustomDataToRequests(envelope, createContext('test-user', badToken))

        expect(envelope.data.baseData.properties).toStrictEqual({ username: 'test-user' })
      })
    })

    it('handles missing user details', () => {
      const envelope = createEnvelope({ other: 'things' })

      addCustomDataToRequests(envelope, {
        'http.ServerRequest': {},
      } as ContextObject)

      expect(envelope.data.baseData.properties).toEqual({
        other: 'things',
      })
    })
  })
})
