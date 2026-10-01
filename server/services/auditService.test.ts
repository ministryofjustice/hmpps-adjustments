import { AuditServiceFactory } from '@ministryofjustice/hmpps-audit-client'
import AuditService from './auditService'
import AuditAction from '../enumerations/auditType'
import logger from '../../logger'

jest.mock('@ministryofjustice/hmpps-audit-client')
jest.mock('../../logger')

describe('AuditService', () => {
  let auditService: AuditService
  let logAuditEvent: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    logAuditEvent = jest.fn().mockResolvedValue(undefined)
    ;(AuditServiceFactory.configureFromEnv as jest.Mock).mockReturnValue({ logAuditEvent })
    auditService = new AuditService()
  })

  describe('getAuditAction', () => {
    const cases: [string, 'CREATE' | 'UPDATE' | 'DELETE', AuditAction][] = [
      ['TAGGED_BAIL', 'CREATE', AuditAction.TAGGED_BAIL_ADD],
      ['TAGGED_BAIL', 'UPDATE', AuditAction.TAGGED_BAIL_EDIT],
      ['TAGGED_BAIL', 'DELETE', AuditAction.TAGGED_BAIL_DELETE],
      ['LAWFULLY_AT_LARGE', 'CREATE', AuditAction.LAWFULLY_AT_LARGE_ADD],
      ['LAWFULLY_AT_LARGE', 'UPDATE', AuditAction.LAWFULLY_AT_LARGE_EDIT],
      ['LAWFULLY_AT_LARGE', 'DELETE', AuditAction.LAWFULLY_AT_LARGE_DELETE],
      ['UNLAWFULLY_AT_LARGE', 'CREATE', AuditAction.UNLAWFULLY_AT_LARGE_ADD],
      ['UNLAWFULLY_AT_LARGE', 'UPDATE', AuditAction.UNLAWFULLY_AT_LARGE_EDIT],
      ['UNLAWFULLY_AT_LARGE', 'DELETE', AuditAction.UNLAWFULLY_AT_LARGE_DELETE],
      ['REMAND', 'CREATE', AuditAction.REMAND_ADD],
      ['REMAND', 'UPDATE', AuditAction.REMAND_EDIT],
      ['REMAND', 'DELETE', AuditAction.REMAND_DELETE],
      ['RESTORATION_OF_ADDITIONAL_DAYS_AWARDED', 'CREATE', AuditAction.RESTORATION_OF_ADDITIONAL_DAYS_AWARDED_ADD],
      ['RESTORATION_OF_ADDITIONAL_DAYS_AWARDED', 'UPDATE', AuditAction.RESTORATION_OF_ADDITIONAL_DAYS_AWARDED_EDIT],
      ['RESTORATION_OF_ADDITIONAL_DAYS_AWARDED', 'DELETE', AuditAction.RESTORATION_OF_ADDITIONAL_DAYS_AWARDED_DELETE],
    ]

    it.each(cases)('returns the correct action for %s %s', (adjustmentType, operation, expected) => {
      expect(auditService.getAuditAction(adjustmentType, operation)).toEqual(expected)
    })

    it('returns undefined for an unknown adjustment type', () => {
      expect(auditService.getAuditAction('UNKNOWN_TYPE', 'CREATE')).toBeUndefined()
    })

    it('returns undefined for an unrecognised operation on a known adjustment type', () => {
      expect(
        auditService.getAuditAction('TAGGED_BAIL', 'UNKNOWN' as unknown as 'CREATE' | 'UPDATE' | 'DELETE'),
      ).toBeUndefined()
    })

    it('returns undefined and logs an error if an unexpected error is thrown', () => {
      const brokenAdjustmentType = {
        toString: () => {
          throw new Error('boom')
        },
      }
      const result = auditService.getAuditAction(brokenAdjustmentType as unknown as string, 'CREATE')
      expect(result).toBeUndefined()
    })
  })

  describe('sendAuditMessage', () => {
    it('sends an audit message with the expected payload', async () => {
      await auditService.sendAuditMessage(AuditAction.TAGGED_BAIL_ADD, 'some-user', 'A1234BC', 'adjustment-1')

      expect(logAuditEvent).toHaveBeenCalledWith({
        what: AuditAction.TAGGED_BAIL_ADD,
        who: 'some-user',
        subjectId: 'A1234BC',
        subjectType: 'NOT_APPLICABLE',
        details: {
          nomisId: 'A1234BC',
          adjustmentId: 'adjustment-1',
        },
      })
    })

    it('defaults adjustmentId details to NOT_APPLICABLE when not provided', async () => {
      await auditService.sendAuditMessage(AuditAction.REMAND_DELETE, 'some-user', 'A1234BC', undefined)

      expect(logAuditEvent).toHaveBeenCalledWith({
        what: AuditAction.REMAND_DELETE,
        who: 'some-user',
        subjectId: 'A1234BC',
        subjectType: 'NOT_APPLICABLE',
        details: {
          nomisId: 'A1234BC',
          adjustmentId: 'NOT_APPLICABLE',
        },
      })
    })

    it('logs an error and does not throw when the underlying client rejects', async () => {
      logAuditEvent.mockRejectedValue(new Error('network error'))

      await expect(
        auditService.sendAuditMessage(AuditAction.TAGGED_BAIL_ADD, 'some-user', 'A1234BC', 'adjustment-1'),
      ).resolves.toBeUndefined()

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to publish audit event A1234BC - CREATE_TAGGED_BAIL - adjustment-1'),
      )
    })
  })
})
