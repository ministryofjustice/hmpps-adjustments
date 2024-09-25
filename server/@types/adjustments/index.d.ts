/**
 * This file was auto-generated by openapi-typescript.
 * Do not make direct changes to the file.
 */

export interface paths {
  '/queue-admin/retry-dlq/{dlqName}': {
    put: operations['retryDlq']
  }
  '/queue-admin/retry-all-dlqs': {
    put: operations['retryAllDlqs']
  }
  '/queue-admin/purge-queue/{queueName}': {
    put: operations['purgeQueue']
  }
  '/legacy/adjustments/{adjustmentId}': {
    /**
     * Get an adjustments
     * @description Get details of an adjustment in the NOMIS system format.
     */
    get: operations['get']
    /**
     * Update an adjustments
     * @description Synchronise an update from NOMIS into adjustments API.
     */
    put: operations['update']
    /**
     * Delete an adjustments
     * @description Synchronise a deletion from NOMIS into adjustments API.
     */
    delete: operations['delete']
  }
  '/adjustments/{adjustmentId}': {
    /**
     * Get an adjustments
     * @description Get details of an adjustment
     */
    get: operations['get_1']
    /**
     * Update an adjustments
     * @description Update an adjustment.
     */
    put: operations['update_1']
    /**
     * Delete an adjustments
     * @description Delete an adjustment.
     */
    delete: operations['delete_1']
  }
  '/legacy/adjustments': {
    /**
     * Create an adjustments
     * @description Synchronise a creation from NOMIS into adjustments API.
     */
    post: operations['create']
  }
  '/legacy/adjustments/migration': {
    /**
     * Create an adjustment from the migration job
     * @description Synchronise a creation from NOMIS into adjustments API. This endpoint is used for initial migration of data from NOMIS without raising any events.
     */
    post: operations['migration']
  }
  '/adjustments': {
    /**
     * Get current adjustments by person
     * @description Get current adjustments for a given person.
     */
    get: operations['findByPerson']
    /**
     * Create adjustments
     * @description Create adjustment.
     */
    post: operations['create_1']
  }
  '/adjustments/{adjustmentId}/effective-days': {
    /**
     * Update the effective calculable days for and adjustment
     * @description Update an adjustment's effective days.
     */
    post: operations['updateEffectiveDays']
  }
  '/adjustments/validate': {
    /**
     * Validate an adjustments
     * @description Validate an adjustment.
     */
    post: operations['validate']
  }
  '/adjustments/restore': {
    /**
     * Restore a deleted adjustment
     * @description Restore a deleted adjustment
     */
    post: operations['restore']
  }
  '/adjustments/person/{person}/manual-unused-deductions': {
    /**
     * Update the unused deduction days for a person
     * @description Update the unused deduction days for a person
     */
    post: operations['setUnusedDaysManually']
  }
  '/adjustments/additional-days/{person}/reject-prospective-ada': {
    /** Reject prospective ADA. */
    post: operations['rejectProspectiveAda']
  }
  '/queue-admin/get-dlq-messages/{dlqName}': {
    get: operations['getDlqMessages']
  }
  '/adjustments/person/{person}/unused-deductions-result': {
    /**
     * Get the unused deductions result
     * @description Get the unused deductions result
     */
    get: operations['getUnusedDeductionsResult']
  }
  '/adjustments/additional-days/{person}/adjudication-details': {
    /** Get all details of adjudications and associated adjustments */
    get: operations['getAdaAdjudicationDetails']
  }
}

export type webhooks = Record<string, never>

export interface components {
  schemas: {
    RetryDlqResult: {
      /** Format: int32 */
      messagesFoundCount: number
    }
    PurgeQueueResult: {
      /** Format: int32 */
      messagesFoundCount: number
    }
    /** @description An adjustment structured for synchronising with the NOMIS system */
    LegacyAdjustment: {
      /**
       * Format: int64
       * @description The NOMIS booking ID of the adjustment
       */
      bookingId: number
      /**
       * Format: int32
       * @description The NOMIS sentence sequence of the adjustment
       */
      sentenceSequence?: number
      /** @description The NOMIS offender number aka nomsId, prisonerId of the person this adjustment applies to */
      offenderNo: string
      /**
       * @description The NOMIS adjustment type
       * @enum {string}
       */
      adjustmentType: 'ADA' | 'RADA' | 'UAL' | 'LAL' | 'SREM' | 'RSR' | 'RST' | 'RX' | 'S240A' | 'UR'
      /**
       * Format: date
       * @description The NOMIS date of adjustment
       */
      adjustmentDate?: string
      /**
       * Format: date
       * @description The NOMIS from date of adjustment
       */
      adjustmentFromDate?: string
      /**
       * Format: int32
       * @description The NOMIS adjustment days
       */
      adjustmentDays: number
      /** @description The NOMIS comment for this adjustment */
      comment?: string
      /** @description The NOMIS active or inactive flag */
      active: boolean
      /** @description Has the prisoner been released from the NOMIS booking */
      bookingReleased: boolean
      /** @description The ID of the agency the prisoner is located */
      agencyId?: string
    }
    /** @description The details of an additional days awarded (ADA) adjustment */
    AdditionalDaysAwardedDto: {
      /** @description The id of the adjudication that resulted in the ADA */
      adjudicationId: string[]
      prospective: boolean
    }
    /** @description The adjustment and its identifier */
    AdjustmentDto: {
      /**
       * Format: uuid
       * @description The ID of the adjustment
       */
      id?: string
      /**
       * Format: int64
       * @description The NOMIS booking ID of the adjustment
       */
      bookingId: number
      /** @description The NOMIS ID of the person this adjustment applies to */
      person: string
      /**
       * @description The type of adjustment
       * @enum {string}
       */
      adjustmentType:
        | 'REMAND'
        | 'TAGGED_BAIL'
        | 'UNLAWFULLY_AT_LARGE'
        | 'LAWFULLY_AT_LARGE'
        | 'ADDITIONAL_DAYS_AWARDED'
        | 'RESTORATION_OF_ADDITIONAL_DAYS_AWARDED'
        | 'SPECIAL_REMISSION'
        | 'UNUSED_DEDUCTIONS'
      /**
       * Format: date
       * @description The end date of the adjustment
       */
      toDate?: string
      /**
       * Format: date
       * @description The start date of the adjustment
       */
      fromDate?: string
      /**
       * Format: int32
       * @description The number of days of the adjustment
       */
      days?: number
      remand?: components['schemas']['RemandDto']
      additionalDaysAwarded?: components['schemas']['AdditionalDaysAwardedDto']
      unlawfullyAtLarge?: components['schemas']['UnlawfullyAtLargeDto']
      lawfullyAtLarge?: components['schemas']['LawfullyAtLargeDto']
      taggedBail?: components['schemas']['TaggedBailDto']
      /**
       * Format: int32
       * @description The NOMIS sentence sequence of the adjustment
       */
      sentenceSequence?: number
      /** @description Human readable text for type of adjustment */
      adjustmentTypeText?: string
      /**
       * @description Indicates whether the adjustment was an addition or deduction
       * @enum {string}
       */
      adjustmentArithmeticType?: 'ADDITION' | 'DEDUCTION' | 'NONE'
      /**
       * @description The name name of the prison where the prisoner was located at the time the adjustment was created
       * @example Leeds
       */
      prisonName?: string
      /**
       * @description The prison where the prisoner was located at the time the adjustment was created (a 3 character code identifying the prison)
       * @example LDS
       */
      prisonId?: string
      /** @description The person last updating this adjustment */
      lastUpdatedBy?: string
      /**
       * @description The status of this adjustment
       * @enum {string}
       */
      status?: 'ACTIVE' | 'INACTIVE' | 'DELETED' | 'INACTIVE_WHEN_DELETED'
      /**
       * Format: date-time
       * @description The date and time this adjustment was last updated
       */
      lastUpdatedDate?: string
      /**
       * Format: date-time
       * @description The date and time this adjustment was last created
       */
      createdDate?: string
      /**
       * Format: int32
       * @description The number of days effective in a calculation. (for example remand minus any unused deductions)
       */
      effectiveDays?: number
      /**
       * @description Where was the adjustment last changed
       * @enum {string}
       */
      source?: 'NOMIS' | 'DPS'
    }
    /** @description The details of a LAL adjustment */
    LawfullyAtLargeDto: {
      /**
       * @description The type of LAL
       * @enum {string}
       */
      affectsDates?: 'YES' | 'NO'
    }
    /** @description The details of remand adjustment */
    RemandDto: {
      /** @description The id of the charges this remand applies to */
      chargeId: number[]
    }
    /** @description The details of the tagged bail adjustment */
    TaggedBailDto: {
      /**
       * Format: int32
       * @description The case sequence number this tagged-bail was associated with
       */
      caseSequence: number
    }
    /** @description The details of a UAL adjustment */
    UnlawfullyAtLargeDto: {
      /**
       * @description The type of UAL
       * @enum {string}
       */
      type?: 'RECALL' | 'ESCAPE' | 'SENTENCED_IN_ABSENCE' | 'RELEASE_IN_ERROR' | 'IMMIGRATION_DETENTION'
    }
    LegacyAdjustmentCreatedResponse: {
      /** Format: uuid */
      adjustmentId: string
    }
    CreateResponseDto: {
      adjustmentIds: string[]
    }
    /** @description Details of the adjustment and the number of effective days within a calculation. */
    AdjustmentEffectiveDaysDto: {
      /**
       * Format: uuid
       * @description The ID of the adjustment
       */
      id: string
      /**
       * Format: int32
       * @description The number of days effective in a calculation. (for example remand minus any unused deductions)
       */
      effectiveDays: number
      /** @description The NOMIS ID of the person this adjustment applies to */
      person: string
    }
    /** @description Validation message details */
    ValidationMessage: {
      /**
       * @description Validation code details
       * @enum {string}
       */
      code:
        | 'RADA_FROM_DATE_NOT_NULL'
        | 'RADA_REDUCES_BY_MORE_THAN_HALF'
        | 'MORE_RADAS_THAN_ADAS'
        | 'RADA_DATE_CANNOT_BE_FUTURE'
        | 'RADA_DATA_MUST_BE_AFTER_SENTENCE_DATE'
        | 'RADA_DAYS_MUST_BE_POSTIVE'
        | 'UAL_FROM_DATE_NOT_NULL'
        | 'UAL_TO_DATE_NOT_NULL'
        | 'UAL_FROM_DATE_AFTER_TO_DATE'
        | 'UAL_TYPE_NOT_NULL'
        | 'UAL_FIRST_DATE_CANNOT_BE_FUTURE'
        | 'UAL_LAST_DATE_CANNOT_BE_FUTURE'
        | 'UAL_DATE_MUST_BE_AFTER_SENTENCE_DATE'
        | 'LAL_FROM_DATE_NOT_NULL'
        | 'LAL_TO_DATE_NOT_NULL'
        | 'LAL_FROM_DATE_AFTER_TO_DATE'
        | 'LAL_AFFECTS_DATES_NOT_NULL'
        | 'LAL_FIRST_DATE_CANNOT_BE_FUTURE'
        | 'LAL_LAST_DATE_CANNOT_BE_FUTURE'
        | 'LAL_DATE_MUST_BE_AFTER_SENTENCE_DATE'
      arguments: string[]
      message: string
      /** @enum {string} */
      type: 'VALIDATION' | 'WARNING'
    }
    /** @description The adjustment UUID */
    RestoreAdjustmentsDto: {
      /** @description The IDs of the adjustments to restore */
      ids: string[]
    }
    /** @description Details of the number of unused days */
    ManualUnusedDeductionsDto: {
      /**
       * Format: int32
       * @description The number of unused days
       */
      days: number
    }
    /** @description The DTO representing the PADAs rejected */
    ProspectiveAdaRejectionDto: {
      /** @description The NOMIS ID of the person this pada is rejected applies to */
      person: string
      /**
       * Format: int32
       * @description The number of days that were rejected
       */
      days: number
      /**
       * Format: date
       * @description The date of the charges proved that were rejected
       */
      dateChargeProved: string
    }
    DlqMessage: {
      body: {
        [key: string]: Record<string, never>
      }
      messageId: string
    }
    GetDlqResult: {
      /** Format: int32 */
      messagesFoundCount: number
      /** Format: int32 */
      messagesReturnedCount: number
      messages: components['schemas']['DlqMessage'][]
    }
    UnusedDeductionsCalculationResultDto: {
      person: string
      /** Format: date-time */
      calculationAt: string
      /** @enum {string} */
      status: 'NOMIS_ADJUSTMENT' | 'VALIDATION' | 'UNSUPPORTED' | 'RECALL' | 'UNKNOWN' | 'CALCULATED' | 'IN_PROGRESS'
    }
    Ada: {
      /** Format: date */
      dateChargeProved: string
      chargeNumber: string
      toBeServed?: string
      heardAt?: string
      /** @enum {string} */
      status: 'AWARDED_OR_PENDING' | 'SUSPENDED' | 'QUASHED' | 'PROSPECTIVE'
      /** Format: int32 */
      days: number
      consecutiveToChargeNumber?: string
    }
    AdaAdjudicationDetails: {
      awarded: components['schemas']['AdasByDateCharged'][]
      /** Format: int32 */
      totalAwarded: number
      suspended: components['schemas']['AdasByDateCharged'][]
      /** Format: int32 */
      totalSuspended: number
      quashed: components['schemas']['AdasByDateCharged'][]
      /** Format: int32 */
      totalQuashed: number
      awaitingApproval: components['schemas']['AdasByDateCharged'][]
      /** Format: int32 */
      totalAwaitingApproval: number
      prospective: components['schemas']['AdasByDateCharged'][]
      /** Format: int32 */
      totalProspective: number
      intercept: components['schemas']['AdaIntercept']
      /** Format: int32 */
      totalExistingAdas: number
      showExistingAdaMessage: boolean
      recallWithMissingOutcome: boolean
      /** Format: date */
      earliestNonRecallSentenceDate?: string
      /** Format: date */
      earliestRecallDate?: string
    }
    AdaIntercept: {
      /** @enum {string} */
      type: 'NONE' | 'FIRST_TIME' | 'UPDATE' | 'PADA'
      /** Format: int32 */
      number: number
      anyProspective: boolean
      messageArguments: string[]
      message?: string
    }
    AdasByDateCharged: {
      /** Format: date */
      dateChargeProved: string
      charges: components['schemas']['Ada'][]
      /** Format: int32 */
      total?: number
      /** @enum {string} */
      status?: 'AWARDED' | 'PENDING_APPROVAL' | 'SUSPENDED' | 'QUASHED' | 'PROSPECTIVE'
      /** Format: uuid */
      adjustmentId?: string
    }
  }
  responses: never
  parameters: never
  requestBodies: never
  headers: never
  pathItems: never
}

export type $defs = Record<string, never>

export type external = Record<string, never>

export interface operations {
  retryDlq: {
    parameters: {
      path: {
        dlqName: string
      }
    }
    responses: {
      /** @description OK */
      200: {
        content: {
          '*/*': components['schemas']['RetryDlqResult']
        }
      }
    }
  }
  retryAllDlqs: {
    responses: {
      /** @description OK */
      200: {
        content: {
          '*/*': components['schemas']['RetryDlqResult'][]
        }
      }
    }
  }
  purgeQueue: {
    parameters: {
      path: {
        queueName: string
      }
    }
    responses: {
      /** @description OK */
      200: {
        content: {
          '*/*': components['schemas']['PurgeQueueResult']
        }
      }
    }
  }
  /**
   * Get an adjustments
   * @description Get details of an adjustment in the NOMIS system format.
   */
  get: {
    parameters: {
      path: {
        /** @description The adjustment UUID */
        adjustmentId: string
      }
    }
    responses: {
      /** @description Adjustment found */
      200: {
        content: {
          'application/json': components['schemas']['LegacyAdjustment']
        }
      }
      /** @description Unauthorised, requires a valid Oauth2 token */
      401: {
        content: {
          'application/json': components['schemas']['LegacyAdjustment']
        }
      }
      /** @description Adjustment not found */
      404: {
        content: {
          'application/json': components['schemas']['LegacyAdjustment']
        }
      }
    }
  }
  /**
   * Update an adjustments
   * @description Synchronise an update from NOMIS into adjustments API.
   */
  update: {
    parameters: {
      path: {
        /** @description The adjustment UUID */
        adjustmentId: string
      }
    }
    requestBody: {
      content: {
        'application/vnd.nomis-offence+json': components['schemas']['LegacyAdjustment']
      }
    }
    responses: {
      /** @description Adjustment update */
      200: {
        content: never
      }
      /** @description Unauthorised, requires a valid Oauth2 token */
      401: {
        content: never
      }
      /** @description Adjustment not found */
      404: {
        content: never
      }
    }
  }
  /**
   * Delete an adjustments
   * @description Synchronise a deletion from NOMIS into adjustments API.
   */
  delete: {
    parameters: {
      path: {
        /** @description The adjustment UUID */
        adjustmentId: string
      }
    }
    responses: {
      /** @description Adjustment deleted */
      200: {
        content: never
      }
      /** @description Unauthorised, requires a valid Oauth2 token */
      401: {
        content: never
      }
      /** @description Adjustment not found */
      404: {
        content: never
      }
    }
  }
  /**
   * Get an adjustments
   * @description Get details of an adjustment
   */
  get_1: {
    parameters: {
      path: {
        /** @description The adjustment UUID */
        adjustmentId: string
      }
    }
    responses: {
      /** @description Adjustment found */
      200: {
        content: {
          'application/json': components['schemas']['AdjustmentDto']
        }
      }
      /** @description Unauthorised, requires a valid Oauth2 token */
      401: {
        content: {
          'application/json': components['schemas']['AdjustmentDto']
        }
      }
      /** @description Adjustment not found */
      404: {
        content: {
          'application/json': components['schemas']['AdjustmentDto']
        }
      }
    }
  }
  /**
   * Update an adjustments
   * @description Update an adjustment.
   */
  update_1: {
    parameters: {
      path: {
        /** @description The adjustment UUID */
        adjustmentId: string
      }
    }
    requestBody: {
      content: {
        'application/json': components['schemas']['AdjustmentDto']
      }
    }
    responses: {
      /** @description Adjustment update */
      200: {
        content: never
      }
      /** @description Unauthorised, requires a valid Oauth2 token */
      401: {
        content: never
      }
      /** @description Adjustment not found */
      404: {
        content: never
      }
    }
  }
  /**
   * Delete an adjustments
   * @description Delete an adjustment.
   */
  delete_1: {
    parameters: {
      path: {
        /** @description The adjustment UUID */
        adjustmentId: string
      }
    }
    responses: {
      /** @description Adjustment deleted */
      200: {
        content: never
      }
      /** @description Unauthorised, requires a valid Oauth2 token */
      401: {
        content: never
      }
      /** @description Adjustment not found */
      404: {
        content: never
      }
    }
  }
  /**
   * Create an adjustments
   * @description Synchronise a creation from NOMIS into adjustments API.
   */
  create: {
    requestBody: {
      content: {
        'application/vnd.nomis-offence+json': components['schemas']['LegacyAdjustment']
      }
    }
    responses: {
      /** @description Adjustment created */
      201: {
        content: {
          'application/json': components['schemas']['LegacyAdjustmentCreatedResponse']
        }
      }
      /** @description Unauthorised, requires a valid Oauth2 token */
      401: {
        content: {
          'application/json': components['schemas']['LegacyAdjustmentCreatedResponse']
        }
      }
    }
  }
  /**
   * Create an adjustment from the migration job
   * @description Synchronise a creation from NOMIS into adjustments API. This endpoint is used for initial migration of data from NOMIS without raising any events.
   */
  migration: {
    requestBody: {
      content: {
        'application/vnd.nomis-offence+json': components['schemas']['LegacyAdjustment']
      }
    }
    responses: {
      /** @description Adjustment created */
      201: {
        content: {
          'application/json': components['schemas']['LegacyAdjustmentCreatedResponse']
        }
      }
      /** @description Unauthorised, requires a valid Oauth2 token */
      401: {
        content: {
          'application/json': components['schemas']['LegacyAdjustmentCreatedResponse']
        }
      }
    }
  }
  /**
   * Get current adjustments by person
   * @description Get current adjustments for a given person.
   */
  findByPerson: {
    parameters: {
      query: {
        /** @description The noms ID of the person */
        person: string
        /** @description The status of adjustments. Defaults to ACTIVE */
        status?: 'ACTIVE' | 'INACTIVE' | 'DELETED' | 'INACTIVE_WHEN_DELETED'
        /** @description The earliest sentence date to filter adjustments by. Defaults to earliest active sentence date */
        sentenceEnvelopeDate?: string
      }
    }
    responses: {
      /** @description Adjustment found */
      200: {
        content: {
          'application/json': components['schemas']['AdjustmentDto'][]
        }
      }
      /** @description Unauthorised, requires a valid Oauth2 token */
      401: {
        content: {
          'application/json': components['schemas']['AdjustmentDto'][]
        }
      }
      /** @description Adjustment not found */
      404: {
        content: {
          'application/json': components['schemas']['AdjustmentDto'][]
        }
      }
    }
  }
  /**
   * Create adjustments
   * @description Create adjustment.
   */
  create_1: {
    requestBody: {
      content: {
        'application/json': components['schemas']['AdjustmentDto'][]
      }
    }
    responses: {
      /** @description Adjustments created */
      201: {
        content: {
          'application/json': components['schemas']['CreateResponseDto']
        }
      }
      /** @description Unauthorised, requires a valid Oauth2 token */
      401: {
        content: {
          'application/json': components['schemas']['CreateResponseDto']
        }
      }
    }
  }
  /**
   * Update the effective calculable days for and adjustment
   * @description Update an adjustment's effective days.
   */
  updateEffectiveDays: {
    parameters: {
      path: {
        /** @description The adjustment UUID */
        adjustmentId: string
      }
    }
    requestBody: {
      content: {
        'application/json': components['schemas']['AdjustmentEffectiveDaysDto']
      }
    }
    responses: {
      /** @description Adjustment update */
      200: {
        content: never
      }
      /** @description Unauthorised, requires a valid Oauth2 token */
      401: {
        content: never
      }
      /** @description Adjustment not found */
      404: {
        content: never
      }
    }
  }
  /**
   * Validate an adjustments
   * @description Validate an adjustment.
   */
  validate: {
    requestBody: {
      content: {
        'application/json': components['schemas']['AdjustmentDto']
      }
    }
    responses: {
      /** @description Adjustment validation returned */
      200: {
        content: {
          'application/json': components['schemas']['ValidationMessage'][]
        }
      }
      /** @description Unauthorised, requires a valid Oauth2 token */
      401: {
        content: {
          'application/json': components['schemas']['ValidationMessage'][]
        }
      }
    }
  }
  /**
   * Restore a deleted adjustment
   * @description Restore a deleted adjustment
   */
  restore: {
    requestBody: {
      content: {
        'application/json': components['schemas']['RestoreAdjustmentsDto']
      }
    }
    responses: {
      /** @description Adjustment restored */
      200: {
        content: never
      }
      /** @description Unauthorised, requires a valid Oauth2 token */
      401: {
        content: never
      }
      /** @description Adjustment not found */
      404: {
        content: never
      }
    }
  }
  /**
   * Update the unused deduction days for a person
   * @description Update the unused deduction days for a person
   */
  setUnusedDaysManually: {
    parameters: {
      path: {
        /** @description The person */
        person: string
      }
    }
    requestBody: {
      content: {
        'application/json': components['schemas']['ManualUnusedDeductionsDto']
      }
    }
    responses: {
      /** @description Adjustment update */
      200: {
        content: never
      }
      /** @description Unauthorised, requires a valid Oauth2 token */
      401: {
        content: never
      }
      /** @description Adjustment not found */
      404: {
        content: never
      }
    }
  }
  /** Reject prospective ADA. */
  rejectProspectiveAda: {
    parameters: {
      path: {
        /**
         * @description The noms ID of the person
         * @example AA1256A
         */
        person: string
      }
    }
    requestBody: {
      content: {
        'application/json': components['schemas']['ProspectiveAdaRejectionDto']
      }
    }
    responses: {
      /** @description Reject a prospective ADA */
      200: {
        content: never
      }
      /** @description Unauthorised, requires a valid Oauth2 token */
      401: {
        content: never
      }
      /** @description Adjustment not found */
      404: {
        content: never
      }
    }
  }
  getDlqMessages: {
    parameters: {
      query?: {
        maxMessages?: number
      }
      path: {
        dlqName: string
      }
    }
    responses: {
      /** @description OK */
      200: {
        content: {
          '*/*': components['schemas']['GetDlqResult']
        }
      }
    }
  }
  /**
   * Get the unused deductions result
   * @description Get the unused deductions result
   */
  getUnusedDeductionsResult: {
    parameters: {
      path: {
        /** @description The person */
        person: string
      }
    }
    responses: {
      /** @description Returns result */
      200: {
        content: {
          'application/json': components['schemas']['UnusedDeductionsCalculationResultDto']
        }
      }
      /** @description Unauthorised, requires a valid Oauth2 token */
      401: {
        content: {
          'application/json': components['schemas']['UnusedDeductionsCalculationResultDto']
        }
      }
      /** @description Person not found */
      404: {
        content: {
          'application/json': components['schemas']['UnusedDeductionsCalculationResultDto']
        }
      }
    }
  }
  /** Get all details of adjudications and associated adjustments */
  getAdaAdjudicationDetails: {
    parameters: {
      query?: {
        /**
         * @description The dates of selected prospective adas
         * @example 2022-01-10,2022-02-11
         */
        selectedProspectiveAdaDates?: string[]
      }
      path: {
        /**
         * @description The noms ID of the person
         * @example AA1256A
         */
        person: string
      }
    }
    responses: {
      /** @description Details of adjudications and adjustments returned */
      200: {
        content: {
          'application/json': components['schemas']['AdaAdjudicationDetails']
        }
      }
      /** @description Unauthorised, requires a valid Oauth2 token */
      401: {
        content: {
          'application/json': components['schemas']['AdaAdjudicationDetails']
        }
      }
      /** @description Adjustment not found */
      404: {
        content: {
          'application/json': components['schemas']['AdaAdjudicationDetails']
        }
      }
    }
  }
}
