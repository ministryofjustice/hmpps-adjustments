import { auditService } from '@ministryofjustice/hmpps-audit-client'
import logger from '../../logger'
import AuditAction from '../enumerations/auditType'

export default class AuditService {
  private serviceName = 'adjustments'

  getAuditAction(adjustmentType: string, operation: 'CREATE' | 'UPDATE' | 'DELETE'): AuditAction | undefined {
    try {
      switch (adjustmentType) {
        case 'TAGGED_BAIL':
          switch (operation) {
            case 'CREATE':
              return AuditAction.TAGGED_BAIL_ADD
            case 'UPDATE':
              return AuditAction.TAGGED_BAIL_EDIT
            case 'DELETE':
              return AuditAction.TAGGED_BAIL_DELETE
            default:
              return undefined
          }
          break

        case 'LAWFULLY_AT_LARGE':
          switch (operation) {
            case 'CREATE':
              return AuditAction.LAWFULLY_AT_LARGE_ADD
            case 'UPDATE':
              return AuditAction.LAWFULLY_AT_LARGE_EDIT
            case 'DELETE':
              return AuditAction.LAWFULLY_AT_LARGE_DELETE
            default:
              return undefined
          }
          break

        case 'UNLAWFULLY_AT_LARGE':
          switch (operation) {
            case 'CREATE':
              return AuditAction.UNLAWFULLY_AT_LARGE_ADD
            case 'UPDATE':
              return AuditAction.UNLAWFULLY_AT_LARGE_EDIT
            case 'DELETE':
              return AuditAction.UNLAWFULLY_AT_LARGE_DELETE
            default:
              return undefined
          }
          break

        case 'REMAND':
          switch (operation) {
            case 'CREATE':
              return AuditAction.REMAND_ADD
            case 'UPDATE':
              return AuditAction.REMAND_EDIT
            case 'DELETE':
              return AuditAction.REMAND_DELETE
            default:
              return undefined
          }

        case 'RESTORATION_OF_ADDITIONAL_DAYS_AWARDED':
          switch (operation) {
            case 'CREATE':
              return AuditAction.RESTORATION_OF_ADDITIONAL_DAYS_AWARDED_ADD
            case 'UPDATE':
              return AuditAction.RESTORATION_OF_ADDITIONAL_DAYS_AWARDED_EDIT
            case 'DELETE':
              return AuditAction.RESTORATION_OF_ADDITIONAL_DAYS_AWARDED_DELETE
            default:
              return undefined
          }
          break

        default:
          return undefined
      }
    } catch (error) {
      logger.error(`Failed to get audit action for adjustment type ${adjustmentType}: ${error.message}`)
      return undefined
    }
  }

  async sendAuditMessage(action: AuditAction, user: string, subjectId: string, adjustmentId: string) {
    try {
      const details = JSON.stringify({
        nomisId: subjectId,
        adjustmentId: adjustmentId ?? 'NOT_APPLICABLE',
      })
      const subjectType: string = 'NOT_APPLICABLE'
      await auditService.sendAuditMessage({
        action,
        who: user,
        subjectId,
        subjectType,
        service: this.serviceName,
        details,
      })
    } catch (error) {
      logger.error(`Failed to publish audit event ${subjectId} - ${action} - ${adjustmentId} : ${error.message}`)
    }
  }
}
