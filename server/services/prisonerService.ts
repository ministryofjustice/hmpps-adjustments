import PrisonApiClient from '../api/prisonApiClient'
import {
  PrisonApiBookingAndSentenceAdjustments,
  PrisonApiCourtDateResult,
  PrisonApiOffence,
  PrisonApiOffenderSentenceAndOffences,
  PrisonApiUserCaseloads,
} from '../@types/prisonApi/prisonClientTypes'
import FullPageError from '../model/FullPageError'

export default class PrisonerService {
  constructor() {}

  async getSentencesAndOffencesFilteredForRemand(
    bookingId: string,
    token: string,
  ): Promise<PrisonApiOffenderSentenceAndOffences[]> {
    return (await this.getSentencesAndOffences(bookingId, token))
      .map(it => {
        return { ...it, offences: it.offences.filter(off => !this.aFineCantHaveRemand(it, off)) }
      })
      .filter(it => {
        return (
          it.offences.length &&
          !this.dtoCantHaveRemand(it) &&
          !this.sentenceTypeCantHaveRemand(it.sentenceCalculationType)
        )
      })
  }

  async getSentencesAndOffences(bookingId: string, token: string): Promise<PrisonApiOffenderSentenceAndOffences[]> {
    const sentencesAndOffences = (await new PrisonApiClient(token).getSentencesAndOffences(bookingId)).filter(
      it => it.sentenceStatus === 'A',
    )
    if (sentencesAndOffences.length === 0) {
      throw FullPageError.noSentences()
    }
    return sentencesAndOffences
  }

  public async getCourtDateResults(nomsId: string, token: string): Promise<PrisonApiCourtDateResult[]> {
    return new PrisonApiClient(token).getCourtDateResults(nomsId)
  }

  async getUsersCaseloads(token: string): Promise<PrisonApiUserCaseloads[]> {
    return new PrisonApiClient(token).getUsersCaseloads()
  }

  async getBookingAndSentenceAdjustments(
    bookingId: string,
    token: string,
  ): Promise<PrisonApiBookingAndSentenceAdjustments> {
    return new PrisonApiClient(token).getBookingAndSentenceAdjustments(bookingId)
  }

  async getStartOfSentenceEnvelope(
    bookingId: string,
    token: string,
  ): Promise<{ earliestExcludingRecalls: Date; earliestSentence: Date }> {
    const sentencesAndOffences = await this.getSentencesAndOffences(bookingId, token)
    return {
      earliestExcludingRecalls: this.findStartOfSentenceEvelope(
        sentencesAndOffences.filter(it => !PrisonerService.recallTypes.includes(it.sentenceCalculationType)),
      ),
      earliestSentence: this.findStartOfSentenceEvelope(sentencesAndOffences),
    }
  }

  private findStartOfSentenceEvelope(sentences: PrisonApiOffenderSentenceAndOffences[]): Date {
    if (sentences.length) {
      return new Date(
        Math.min.apply(
          null,
          sentences.filter(it => it.sentenceStatus === 'A').map(it => new Date(it.sentenceDate)),
        ),
      )
    }
    return null
  }

  private sentenceTypeCantHaveRemand(sentenceType: string) {
    return ['BOTUS', 'CIVIL'].includes(sentenceType)
  }

  private dtoCantHaveRemand(sentence: PrisonApiOffenderSentenceAndOffences) {
    return (
      ['DTO', 'DTO_ORA'].includes(sentence.sentenceCalculationType) &&
      new Date('2022-06-28') > new Date(sentence.sentenceDate)
    )
  }

  private aFineCantHaveRemand(sentence: PrisonApiOffenderSentenceAndOffences, offence: PrisonApiOffence) {
    return sentence.sentenceCalculationType === 'A/FINE' && offence.offenceStatute === 'ZZ01'
  }

  public static recallTypes = [
    'LR',
    'LR_ORA',
    'LR_YOI_ORA',
    'LR_SEC91_ORA',
    'LRSEC250_ORA',
    'LR_EDS18',
    'LR_EDS21',
    'LR_EDSU18',
    'LR_LASPO_AR',
    'LR_LASPO_DR',
    'LR_SEC236A',
    'LR_SOPC18',
    'LR_SOPC21',
    '14FTR_ORA',
    'FTR',
    'FTR_ORA',
    'FTR_SCH15',
    'FTRSCH15_ORA',
    'FTRSCH18',
    'FTRSCH18_ORA',
    '14FTRHDC_ORA',
  ]
}
