import { auditService } from '@ministryofjustice/hmpps-audit-client'
import logger from '../../logger'
import AuditAction from '../enumerations/auditType'

export default class AuditService {
  private serviceName = 'adjustments'

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
