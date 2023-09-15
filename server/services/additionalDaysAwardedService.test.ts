import { when } from 'jest-when'
import nock from 'nock'
import { Offence } from '../@types/manageOffences/manageOffencesClientTypes'
import HmppsAuthClient from '../data/hmppsAuthClient'
import { PageOffenceDto } from '../@types/prisonApi/prisonApiTypes'
import AdditionalDaysAwardedService from './additionalDaysAwardedService'
import TokenStore from '../data/tokenStore'
import AdjudicationClient from '../api/adjudicationsClient'
import config from '../config'
import FullPageErrorType from '../model/FullPageErrorType'
import { PrisonApiPrisoner } from '../@types/prisonApi/prisonClientTypes'
import { AdjudicationSearchResponse, IndividualAdjudication } from '../@types/adjudications/adjudicationTypes'

jest.mock('../data/hmppsAuthClient')

const hmppsAuthClient = new HmppsAuthClient({} as TokenStore) as jest.Mocked<HmppsAuthClient>
const adaService = new AdditionalDaysAwardedService(hmppsAuthClient)

const user = { token: 'some token' } as Express.User

const stubbedPrisonerData = {
  offenderNo: 'A1234AA',
  firstName: 'Anon',
  lastName: 'Nobody',
  latestLocationId: 'LEI',
  locationDescription: 'Inside - Leeds HMP',
  dateOfBirth: '24/06/2000',
  age: 21,
  activeFlag: true,
  legalStatus: 'REMAND',
  category: 'Cat C',
  imprisonmentStatus: 'LIFE',
  imprisonmentStatusDescription: 'Serving Life Imprisonment',
  religion: 'Christian',
  agencyId: 'MDI',
} as PrisonApiPrisoner

// const a = JSON.parse(
//   '{"results":{"content":[{"adjudicationNumber":1526021,"reportTime":"2023-09-13T11:57:00","agencyIncidentId":1503338,"agencyId":"MDI","partySeq":1,"adjudicationCharges":[{"oicChargeId":"1526021/1","offenceCode":"51:1F","offenceDescription":"Commits any assault - all assault on other person","findingCode":"NOT_PROCEED"}]},{"adjudicationNumber":1526019,"reportTime":"2023-09-13T09:14:00","agencyIncidentId":1503336,"agencyId":"MDI","partySeq":1,"adjudicationCharges":[{"oicChargeId":"1526019/1","offenceCode":"51:2B","offenceDescription":"Detains any person against his will - detention against will -non offr/staff/inmate"}]},{"adjudicationNumber":1526017,"reportTime":"2023-09-12T08:16:00","agencyIncidentId":1503334,"agencyId":"MDI","partySeq":1,"adjudicationCharges":[{"oicChargeId":"1526017/1","offenceCode":"51:1F","offenceDescription":"Commits any assault - all assault on other person"}]},{"adjudicationNumber":1526014,"reportTime":"2023-09-08T11:43:00","agencyIncidentId":1503333,"agencyId":"MDI","partySeq":1,"adjudicationCharges":[{"oicChargeId":"1526014/1","offenceCode":"51:16","offenceDescription":"Intentionally or recklessly sets fire to any part of a prison or any other property, whether or not his own","findingCode":"PROVED"}]},{"adjudicationNumber":1525991,"reportTime":"2023-08-29T10:25:00","agencyIncidentId":1503283,"agencyId":"MDI","partySeq":1,"adjudicationCharges":[{"oicChargeId":"1525991/1","offenceCode":"51:12A","offenceDescription":"Has in his possession - (a) any unauthorised article, or (b) a greater quantity of any article than he is authorised to have - possession of unauthorised items","findingCode":"D"}]},{"adjudicationNumber":1525989,"reportTime":"2023-08-23T15:24:00","agencyIncidentId":1503281,"agencyId":"MDI","partySeq":1,"adjudicationCharges":[{"oicChargeId":"1525989/1","offenceCode":"51:20","offenceDescription":"Uses threatening, abusive or insulting words or behaviour","findingCode":"NOT_PROCEED"}]},{"adjudicationNumber":1525986,"reportTime":"2023-08-21T10:09:00","agencyIncidentId":1503278,"agencyId":"MDI","partySeq":1,"adjudicationCharges":[{"oicChargeId":"1525986/1","offenceCode":"51:1F","offenceDescription":"Commits any assault - all assault on other person","findingCode":"PROVED"}]},{"adjudicationNumber":1525984,"reportTime":"2023-08-21T09:34:00","agencyIncidentId":1503276,"agencyId":"MDI","partySeq":1,"adjudicationCharges":[{"oicChargeId":"1525984/1","offenceCode":"51:22","offenceDescription":"Disobeys any lawful order"}]},{"adjudicationNumber":1525973,"reportTime":"2023-08-17T10:42:00","agencyIncidentId":1503265,"agencyId":"MDI","partySeq":1,"adjudicationCharges":[{"oicChargeId":"1525973/1","offenceCode":"55:17","offenceDescription":"Intentionally or recklessly sets fire to any part of a young offender institution or any other property, whether or not his own"}]},{"adjudicationNumber":1525952,"reportTime":"2023-08-15T09:03:00","agencyIncidentId":1503252,"agencyId":"MDI","partySeq":1,"adjudicationCharges":[{"oicChargeId":"1525952/1","offenceCode":"51:1F","offenceDescription":"Commits any assault - all assault on other person","findingCode":"PROVED"}]},{"adjudicationNumber":1525950,"reportTime":"2023-08-14T14:15:00","agencyIncidentId":1503250,"agencyId":"MDI","partySeq":1,"adjudicationCharges":[{"oicChargeId":"1525950/1","offenceCode":"51:1F","offenceDescription":"Commits any assault - all assault on other person"}]},{"adjudicationNumber":1525941,"reportTime":"2023-08-08T15:49:00","agencyIncidentId":1503241,"agencyId":"MDI","partySeq":1,"adjudicationCharges":[{"oicChargeId":"1525941/1","offenceCode":"55:25","offenceDescription":"Disobeys any lawful order"}]},{"adjudicationNumber":1525938,"reportTime":"2023-08-08T09:08:00","agencyIncidentId":1503240,"agencyId":"MDI","partySeq":1,"adjudicationCharges":[{"oicChargeId":"1525938/1","offenceCode":"51:16","offenceDescription":"Intentionally or recklessly sets fire to any part of a prison or any other property, whether or not his own"}]},{"adjudicationNumber":1525932,"reportTime":"2023-08-04T16:28:00","agencyIncidentId":1503233,"agencyId":"MDI","partySeq":1,"adjudicationCharges":[{"oicChargeId":"1525932/1","offenceCode":"51:25F","offenceDescription":"(a) Attempts to commit, (b) incites another inmate to commit, or (c) assists another inmate to commit or to attempt to commit, any of the foregoing offences - att, incite, assist ass on prison officer","findingCode":"PROVED"}]},{"adjudicationNumber":1525930,"reportTime":"2023-08-04T14:53:00","agencyIncidentId":1503231,"agencyId":"MDI","partySeq":1,"adjudicationCharges":[{"oicChargeId":"1525930/1","offenceCode":"51:16","offenceDescription":"Intentionally or recklessly sets fire to any part of a prison or any other property, whether or not his own","findingCode":"REF_POLICE"}]},{"adjudicationNumber":1525929,"reportTime":"2023-08-04T14:49:00","agencyIncidentId":1503230,"agencyId":"MDI","partySeq":1,"adjudicationCharges":[{"oicChargeId":"1525929/1","offenceCode":"51:15","offenceDescription":"Takes improperly any article belonging to another person or to a prison","findingCode":"QUASHED"},{"oicChargeId":"1525929/1","offenceCode":"51:15","offenceDescription":"Takes improperly any article belonging to another person or to a prison","findingCode":"PROVED"}]},{"adjudicationNumber":1525919,"reportTime":"2023-08-02T10:02:00","agencyIncidentId":1503218,"agencyId":"MDI","partySeq":1,"adjudicationCharges":[{"oicChargeId":"1525919/1","offenceCode":"51:24A","offenceDescription":"Displays, attaches or draws on any part of a prison, or on any other property, threatening, abusive or insulting racist words, drawings, symbols or other material"}]},{"adjudicationNumber":1525918,"reportTime":"2023-08-02T10:01:00","agencyIncidentId":1503217,"agencyId":"MDI","partySeq":1,"adjudicationCharges":[{"oicChargeId":"1525918/1","offenceCode":"51:16","offenceDescription":"Intentionally or recklessly sets fire to any part of a prison or any other property, whether or not his own","findingCode":"PROVED"}]},{"adjudicationNumber":1525916,"reportTime":"2023-08-02T09:09:00","agencyIncidentId":1503215,"agencyId":"MDI","partySeq":1,"adjudicationCharges":[{"oicChargeId":"1525916/1","offenceCode":"51:16","offenceDescription":"Intentionally or recklessly sets fire to any part of a prison or any other property, whether or not his own","findingCode":"PROVED"}]},{"adjudicationNumber":1525913,"reportTime":"2023-08-01T16:30:04","agencyIncidentId":1503212,"agencyId":"MDI","partySeq":1,"adjudicationCharges":[{"oicChargeId":"1525913/1","offenceCode":"51:15","offenceDescription":"Takes improperly any article belonging to another person or to a prison"}]},{"adjudicationNumber":1525890,"reportTime":"2023-07-27T09:46:00","agencyIncidentId":1503223,"agencyId":"MDI","partySeq":1,"adjudicationCharges":[{"oicChargeId":"1525890/1","offenceCode":"51:25C","offenceDescription":"(a) Attempts to commit, (b) incites another inmate to commit, or (c) assists another inmate to commit or to attempt to commit, any of the foregoing offences - at incite or assist to set fire to prison or prop","findingCode":"PROVED"}]},{"adjudicationNumber":1525889,"reportTime":"2023-07-27T09:43:28","agencyIncidentId":1503165,"agencyId":"MDI","partySeq":1,"adjudicationCharges":[{"oicChargeId":"1525889/1","offenceCode":"51:16","offenceDescription":"Intentionally or recklessly sets fire to any part of a prison or any other property, whether or not his own"}]},{"adjudicationNumber":1525867,"reportTime":"2023-07-25T15:19:37","agencyIncidentId":1503166,"agencyId":"MDI","partySeq":1,"adjudicationCharges":[{"oicChargeId":"1525867/1","offenceCode":"51:16","offenceDescription":"Intentionally or recklessly sets fire to any part of a prison or any other property, whether or not his own"}]},{"adjudicationNumber":1525817,"reportTime":"2023-06-28T09:53:15","agencyIncidentId":1503160,"agencyId":"MDI","partySeq":1,"adjudicationCharges":[{"oicChargeId":"1525817/1","offenceCode":"51:19A","offenceDescription":"Is disrespectful to any officer, or any person (other than a prisoner) who is at the prison for the purpose of working there, or any person visiting a prison - disrespect to other persons visiting prison"}]},{"adjudicationNumber":1525816,"reportTime":"2023-06-27T13:31:57","agencyIncidentId":1503167,"agencyId":"MDI","partySeq":1,"adjudicationCharges":[{"oicChargeId":"1525816/1","offenceCode":"55:1E","offenceDescription":"Commits any assault - all assault on other person"}]},{"adjudicationNumber":1525762,"reportTime":"2023-06-15T15:37:50","agencyIncidentId":1503085,"agencyId":"MDI","partySeq":1,"adjudicationCharges":[{"oicChargeId":"1525762/1","offenceCode":"51:10","offenceDescription":"Is intoxicated as a consequence of knowingly consuming any alcoholic beverage"}]},{"adjudicationNumber":1525730,"reportTime":"2023-06-07T10:57:12","agencyIncidentId":1503061,"agencyId":"MDI","partySeq":1,"adjudicationCharges":[{"oicChargeId":"1525730/1","offenceCode":"51:16","offenceDescription":"Intentionally or recklessly sets fire to any part of a prison or any other property, whether or not his own"}]},{"adjudicationNumber":1525692,"reportTime":"2023-05-30T13:34:12","agencyIncidentId":1503039,"agencyId":"MDI","partySeq":1,"adjudicationCharges":[{"oicChargeId":"1525692/1","offenceCode":"51:7","offenceDescription":"Escapes or absconds from prison or from legal custody"}]},{"adjudicationNumber":1525685,"reportTime":"2023-05-24T16:16:23","agencyIncidentId":1503037,"agencyId":"MDI","partySeq":1,"adjudicationCharges":[{"oicChargeId":"1525685/1","offenceCode":"51:25W","offenceDescription":"(a) Attempts to commit, (b) incites another inmate to commit, or (c) assists another inmate to commit or to attempt to commit, any of the foregoing offences - incite or assist the disobeying of an order"}]},{"adjudicationNumber":1525609,"reportTime":"2023-04-28T13:16:59","agencyIncidentId":1502963,"agencyId":"MDI","partySeq":1,"adjudicationCharges":[{"oicChargeId":"1525609/1","offenceCode":"51:2C","offenceDescription":"Detains any person against his will - detention against will of prison officer grade","findingCode":"PROVED"}]},{"adjudicationNumber":1525606,"reportTime":"2023-04-27T09:42:30","agencyIncidentId":1502959,"agencyId":"MDI","partySeq":1,"adjudicationCharges":[{"oicChargeId":"1525606/1","offenceCode":"51:21","offenceDescription":"Intentionally fails to work properly or, being required to work, refuses to do so","findingCode":"PROVED"},{"oicChargeId":"1525606/1","offenceCode":"51:21","offenceDescription":"Intentionally fails to work properly or, being required to work, refuses to do so","findingCode":"QUASHED"}]},{"adjudicationNumber":1525543,"reportTime":"2023-03-23T14:43:44","agencyIncidentId":1502834,"agencyId":"MDI","partySeq":1,"adjudicationCharges":[{"oicChargeId":"1525543/1","offenceCode":"51:24","offenceDescription":"Receives any controlled drug, or, without the consent of an officer, any other article, during the course of a visit (not being an interview such as is mentioned in rule 38)"}]},{"adjudicationNumber":1525542,"reportTime":"2023-03-23T13:18:26","agencyIncidentId":1502833,"agencyId":"MDI","partySeq":1,"adjudicationCharges":[{"oicChargeId":"1525542/1","offenceCode":"51:24","offenceDescription":"Receives any controlled drug, or, without the consent of an officer, any other article, during the course of a visit (not being an interview such as is mentioned in rule 38)"}]},{"adjudicationNumber":1525535,"reportTime":"2023-03-23T09:53:49","agencyIncidentId":1502826,"agencyId":"MDI","partySeq":1,"adjudicationCharges":[{"oicChargeId":"1525535/1","offenceCode":"51:10","offenceDescription":"Is intoxicated as a consequence of knowingly consuming any alcoholic beverage"}]},{"adjudicationNumber":1525529,"reportTime":"2023-03-22T09:43:23","agencyIncidentId":1502820,"agencyId":"MDI","partySeq":1,"adjudicationCharges":[{"oicChargeId":"1525529/1","offenceCode":"51:25Z","offenceDescription":"(a) Attempts to commit, (b) incites another inmate to commit, or (c) assists another inmate to commit or to attempt to commit, any of the foregoing offences - incite or assist refusal to provide a sample"}]},{"adjudicationNumber":1525480,"reportTime":"2023-03-20T16:08:35","agencyIncidentId":1502816,"agencyId":"MDI","partySeq":1,"adjudicationCharges":[{"oicChargeId":"1525480/1","offenceCode":"51:10","offenceDescription":"Is intoxicated as a consequence of knowingly consuming any alcoholic beverage"}]},{"adjudicationNumber":1525478,"reportTime":"2023-03-20T15:30:39","agencyIncidentId":1502814,"agencyId":"MDI","partySeq":1,"adjudicationCharges":[{"oicChargeId":"1525478/1","offenceCode":"51:19A","offenceDescription":"Is disrespectful to any officer, or any person (other than a prisoner) who is at the prison for the purpose of working there, or any person visiting a prison - disrespect to other persons visiting prison"}]},{"adjudicationNumber":1525477,"reportTime":"2023-03-20T15:00:30","agencyIncidentId":1502813,"agencyId":"MDI","partySeq":1,"adjudicationCharges":[{"oicChargeId":"1525477/1","offenceCode":"51:10","offenceDescription":"Is intoxicated as a consequence of knowingly consuming any alcoholic beverage"}]},{"adjudicationNumber":1525474,"reportTime":"2023-03-17T15:23:03","agencyIncidentId":1502810,"agencyId":"MDI","partySeq":1,"adjudicationCharges":[{"oicChargeId":"1525474/1","offenceCode":"51:19A","offenceDescription":"Is disrespectful to any officer, or any person (other than a prisoner) who is at the prison for the purpose of working there, or any person visiting a prison - disrespect to other persons visiting prison"}]},{"adjudicationNumber":1525471,"reportTime":"2023-03-16T10:37:54","agencyIncidentId":1502806,"agencyId":"MDI","partySeq":1,"adjudicationCharges":[{"oicChargeId":"1525471/1","offenceCode":"51:18A","offenceDescription":"Absents himself from any place he is required to be or is present at any place where he is not authorised to be - absence without permission"}]},{"adjudicationNumber":1525454,"reportTime":"2023-03-06T13:52:23","agencyIncidentId":1502792,"agencyId":"MDI","partySeq":1,"adjudicationCharges":[{"oicChargeId":"1525454/1","offenceCode":"51:19A","offenceDescription":"Is disrespectful to any officer, or any person (other than a prisoner) who is at the prison for the purpose of working there, or any person visiting a prison - disrespect to other persons visiting prison"}]},{"adjudicationNumber":1525452,"reportTime":"2023-03-06T09:39:56","agencyIncidentId":1502789,"agencyId":"MDI","partySeq":1,"adjudicationCharges":[{"oicChargeId":"1525452/1","offenceCode":"51:24A","offenceDescription":"Displays, attaches or draws on any part of a prison, or on any other property, threatening, abusive or insulting racist words, drawings, symbols or other material"}]},{"adjudicationNumber":1525449,"reportTime":"2023-03-01T10:00:16","agencyIncidentId":1502786,"agencyId":"MDI","partySeq":1,"adjudicationCharges":[{"oicChargeId":"1525449/1","offenceCode":"51:19A","offenceDescription":"Is disrespectful to any officer, or any person (other than a prisoner) who is at the prison for the purpose of working there, or any person visiting a prison - disrespect to other persons visiting prison"}]},{"adjudicationNumber":1525442,"reportTime":"2023-02-27T09:52:41","agencyIncidentId":1502779,"agencyId":"MDI","partySeq":1,"adjudicationCharges":[{"oicChargeId":"1525442/1","offenceCode":"51:21","offenceDescription":"Intentionally fails to work properly or, being required to work, refuses to do so"}]},{"adjudicationNumber":1525440,"reportTime":"2023-02-24T15:38:50","agencyIncidentId":1502778,"agencyId":"MDI","partySeq":1,"adjudicationCharges":[{"oicChargeId":"1525440/1","offenceCode":"51:1B","offenceDescription":"Commits any assault - assault on inmate"}]},{"adjudicationNumber":1525437,"reportTime":"2023-02-23T15:34:26","agencyIncidentId":1502773,"agencyId":"MDI","partySeq":1,"adjudicationCharges":[{"oicChargeId":"1525437/1","offenceCode":"51:3","offenceDescription":"Denies access to any part of the prison to any officer or any person (other than a prisoner) who is at the prison for the purpose of working there"}]},{"adjudicationNumber":1525432,"reportTime":"2023-02-22T10:15:03","agencyIncidentId":1502764,"agencyId":"MDI","partySeq":1,"adjudicationCharges":[{"oicChargeId":"1525432/1","offenceCode":"51:2B","offenceDescription":"Detains any person against his will - detention against will -non offr/staff/inmate"}]},{"adjudicationNumber":1525431,"reportTime":"2023-02-22T10:13:04","agencyIncidentId":1502763,"agencyId":"MDI","partySeq":1,"adjudicationCharges":[{"oicChargeId":"1525431/1","offenceCode":"51:22","offenceDescription":"Disobeys any lawful order"}]},{"adjudicationNumber":1525410,"reportTime":"2023-02-15T11:56:02","agencyIncidentId":1502737,"agencyId":"MDI","partySeq":1,"adjudicationCharges":[{"oicChargeId":"1525410/1","offenceCode":"51:1B","offenceDescription":"Commits any assault - assault on inmate"}]},{"adjudicationNumber":1525400,"reportTime":"2023-01-30T16:37:26","agencyIncidentId":1502715,"agencyId":"MDI","partySeq":1,"adjudicationCharges":[{"oicChargeId":"1525400/1","offenceCode":"51:18B","offenceDescription":"Absents himself from any place he is required to be or is present at any place where he is not authorised to be - presence in unauthorised place"}]},{"adjudicationNumber":1525398,"reportTime":"2023-01-24T15:19:41","agencyIncidentId":1502753,"agencyId":"MDI","partySeq":1,"adjudicationCharges":[{"oicChargeId":"1525398/1","offenceCode":"51:1F","offenceDescription":"Commits any assault - all assault on other person"}]},{"adjudicationNumber":1525395,"reportTime":"2023-01-24T14:29:00","agencyIncidentId":1502749,"agencyId":"MDI","partySeq":1,"adjudicationCharges":[{"oicChargeId":"1525395/1","offenceCode":"51:1B","offenceDescription":"Commits any assault - assault on inmate"}]},{"adjudicationNumber":1525383,"reportTime":"2023-01-18T11:36:26","agencyIncidentId":1502693,"agencyId":"MDI","partySeq":1,"adjudicationCharges":[{"offenceCode":"51:25K","offenceDescription":"(a) Attempts to commit, (b) incites another inmate to commit, or (c) assists another inmate to commit or to attempt to commit, any of the foregoing offences - attempt,incite or assist detention of an inmate"}]},{"adjudicationNumber":1525371,"reportTime":"2023-01-03T09:44:10","agencyIncidentId":1502645,"agencyId":"MDI","partySeq":1,"adjudicationCharges":[{"offenceCode":"55:1A","offenceDescription":"Commits any assault - assault on inmate"}]},{"adjudicationNumber":1525366,"reportTime":"2022-12-15T11:52:15","agencyIncidentId":1502643,"agencyId":"MDI","partySeq":1,"adjudicationCharges":[{"offenceCode":"51:2B","offenceDescription":"Detains any person against his will - detention against will -non offr/staff/inmate"}]},{"adjudicationNumber":1525317,"reportTime":"2022-11-10T14:22:14","agencyIncidentId":1502609,"agencyId":"MDI","partySeq":1,"adjudicationCharges":[{"offenceCode":"51:18A","offenceDescription":"Absents himself from any place he is required to be or is present at any place where he is not authorised to be - absence without permission"}]},{"adjudicationNumber":1525308,"reportTime":"2022-11-08T11:25:18","agencyIncidentId":1502599,"agencyId":"MDI","partySeq":1,"adjudicationCharges":[{"offenceCode":"51:21","offenceDescription":"Intentionally fails to work properly or, being required to work, refuses to do so"}]},{"adjudicationNumber":1525301,"reportTime":"2022-11-07T10:23:08","agencyIncidentId":1502596,"agencyId":"MDI","partySeq":1,"adjudicationCharges":[{"offenceCode":"51:18A","offenceDescription":"Absents himself from any place he is required to be or is present at any place where he is not authorised to be - absence without permission"}]}],"pageable":{"pageNumber":0,"pageSize":1000,"sort":{"empty":true,"unsorted":true,"sorted":false},"offset":0,"paged":true,"unpaged":false},"totalPages":1,"totalElements":58,"last":true,"size":1000,"number":0,"sort":{"empty":true,"unsorted":true,"sorted":false},"first":true,"numberOfElements":58,"empty":false},"offences":[{"id":"101","code":"51:25C","description":"(a) Attempts to commit, (b) incites another inmate to commit, or (c) assists another inmate to commit or to attempt to commit, any of the foregoing offences - at incite or assist to set fire to prison or prop"},{"id":"104","code":"51:25F","description":"(a) Attempts to commit, (b) incites another inmate to commit, or (c) assists another inmate to commit or to attempt to commit, any of the foregoing offences - att, incite, assist ass on prison officer"},{"id":"109","code":"51:25K","description":"(a) Attempts to commit, (b) incites another inmate to commit, or (c) assists another inmate to commit or to attempt to commit, any of the foregoing offences - attempt,incite or assist detention of an inmate"},{"id":"124","code":"51:25Z","description":"(a) Attempts to commit, (b) incites another inmate to commit, or (c) assists another inmate to commit or to attempt to commit, any of the foregoing offences - incite or assist refusal to provide a sample"},{"id":"121","code":"51:25W","description":"(a) Attempts to commit, (b) incites another inmate to commit, or (c) assists another inmate to commit or to attempt to commit, any of the foregoing offences - incite or assist the disobeying of an order"},{"id":"92","code":"51:18A","description":"Absents himself from any place he is required to be or is present at any place where he is not authorised to be - absence without permission"},{"id":"93","code":"51:18B","description":"Absents himself from any place he is required to be or is present at any place where he is not authorised to be - presence in unauthorised place"},{"id":"200","code":"55:1E","description":"Commits any assault - all assault on other person"},{"id":"79","code":"51:1F","description":"Commits any assault - all assault on other person"},{"id":"78","code":"51:1B","description":"Commits any assault - assault on inmate"},{"id":"158","code":"55:1A","description":"Commits any assault - assault on inmate"},{"id":"4","code":"51:3","description":"Denies access to any part of the prison to any officer or any person (other than a prisoner) who is at the prison for the purpose of working there"},{"id":"83","code":"51:2B","description":"Detains any person against his will - detention against will -non offr/staff/inmate"},{"id":"84","code":"51:2C","description":"Detains any person against his will - detention against will of prison officer grade"},{"id":"36","code":"55:25","description":"Disobeys any lawful order"},{"id":"48","code":"51:22","description":"Disobeys any lawful order"},{"id":"50","code":"51:24A","description":"Displays, attaches or draws on any part of a prison, or on any other property, threatening, abusive or insulting racist words, drawings, symbols or other material"},{"id":"8","code":"51:7","description":"Escapes or absconds from prison or from legal custody"},{"id":"88","code":"51:12A","description":"Has in his possession - (a) any unauthorised article, or (b) a greater quantity of any article than he is authorised to have - possession of unauthorised items"},{"id":"17","code":"51:21","description":"Intentionally fails to work properly or, being required to work, refuses to do so"},{"id":"13","code":"51:16","description":"Intentionally or recklessly sets fire to any part of a prison or any other property, whether or not his own"},{"id":"30","code":"55:17","description":"Intentionally or recklessly sets fire to any part of a young offender institution or any other property, whether or not his own"},{"id":"94","code":"51:19A","description":"Is disrespectful to any officer, or any person (other than a prisoner) who is at the prison for the purpose of working there, or any person visiting a prison - disrespect to other persons visiting prison"},{"id":"10","code":"51:10","description":"Is intoxicated as a consequence of knowingly consuming any alcoholic beverage"},{"id":"18","code":"51:24","description":"Receives any controlled drug, or, without the consent of an officer, any other article, during the course of a visit (not being an interview such as is mentioned in rule 38)"},{"id":"44","code":"51:15","description":"Takes improperly any article belonging to another person or to a prison"},{"id":"16","code":"51:20","description":"Uses threatening, abusive or insulting words or behaviour"}],"agencies":[{"agencyId":"MDI","description":"Moorland (HMP & YOI)","active":true},{"agencyId":"BXI","description":"Brixton (HMP)","active":true}]}',
// ) as AdjudicationSearchResponse
//
const singleAdjudicationSummary = JSON.parse(
  '{"results":' +
    '     {"content":' +
    '       [' +
    '         {' +
    '           "adjudicationNumber":1525916,"reportTime":"2023-08-02T09:09:00","agencyIncidentId":1503215,"agencyId":"MDI","partySeq":1,' +
    '           "adjudicationCharges":' +
    '             [' +
    '                {"oicChargeId":"1525916/1","offenceCode":"51:16","offenceDescription":"Intentionally or recklessly sets fire to any part of a prison or any other property, whether or not his own","findingCode":"PROVED"}' +
    '             ]' +
    '         }' +
    '       ]' +
    '     }' +
    '  }',
) as AdjudicationSearchResponse

const twoAdjudicationSummary = JSON.parse(
  '{"results":' +
    '     {"content":' +
    '       [' +
    '         {' +
    '           "adjudicationNumber":1525916,"reportTime":"2023-08-02T09:09:00","agencyIncidentId":1503215,"agencyId":"MDI","partySeq":1,' +
    '           "adjudicationCharges":' +
    '             [' +
    '                {"oicChargeId":"1525916/1","offenceCode":"51:16","offenceDescription":"Intentionally or recklessly sets fire to any part of a prison or any other property, whether or not his own","findingCode":"PROVED"}' +
    '             ]' +
    '         },' +
    '         {' +
    '             "adjudicationNumber":1525917,"reportTime":"2023-08-02T09:09:00","agencyIncidentId":1503215,"agencyId":"MDI","partySeq":1,' +
    '             "adjudicationCharges":' +
    '               [' +
    '                  {"oicChargeId":"1525917/1","offenceCode":"51:16","offenceDescription":"Intentionally or recklessly sets fire to any part of a prison or any other property, whether or not his own","findingCode":"PROVED"}' +
    '               ]' +
    '           }' +
    '       ]' +
    '     }' +
    '  }',
) as AdjudicationSearchResponse

const threeAdjudicationSummary = JSON.parse(
  '{"results":' +
    '     {"content":' +
    '       [' +
    '         {' +
    '           "adjudicationNumber":1525916,"reportTime":"2023-08-02T09:09:00","agencyIncidentId":1503215,"agencyId":"MDI","partySeq":1,' +
    '           "adjudicationCharges":' +
    '             [' +
    '                {"oicChargeId":"1525916/1","offenceCode":"51:16","offenceDescription":"Intentionally or recklessly sets fire to any part of a prison or any other property, whether or not his own","findingCode":"PROVED"}' +
    '             ]' +
    '         },' +
    '         {' +
    '             "adjudicationNumber":1525917,"reportTime":"2023-08-02T09:09:00","agencyIncidentId":1503215,"agencyId":"MDI","partySeq":1,' +
    '             "adjudicationCharges":' +
    '               [' +
    '                  {"oicChargeId":"1525917/1","offenceCode":"51:16","offenceDescription":"Intentionally or recklessly sets fire to any part of a prison or any other property, whether or not his own","findingCode":"PROVED"}' +
    '               ]' +
    '           },' +
    '         {' +
    '             "adjudicationNumber":1525918,"reportTime":"2023-08-02T09:09:00","agencyIncidentId":1503215,"agencyId":"MDI","partySeq":1,' +
    '             "adjudicationCharges":' +
    '               [' +
    '                  {"oicChargeId":"1525917/1","offenceCode":"51:16","offenceDescription":"Intentionally or recklessly sets fire to any part of a prison or any other property, whether or not his own","findingCode":"PROVED"}' +
    '               ]' +
    '           }' +
    '       ]' +
    '     }' +
    '  }',
) as AdjudicationSearchResponse

const adjudicationOne = JSON.parse(
  '{"adjudicationNumber":1525916,"incidentTime":"2023-08-01T09:00:00","establishment":"Moorland (HMP & YOI)","interiorLocation":"Circuit","incidentDetails":"some details","reportNumber":1503215,"reportType":"Governor\'s Report","reporterFirstName":"TIM","reporterLastName":"WRIGHT","reportTime":"2023-08-02T09:09:00","hearings":[{"oicHearingId":2012687,"hearingType":"Governor\'s Hearing Adult","hearingTime":"2023-08-03T16:45:00","establishment":"Moorland (HMP & YOI)","location":"Adj","heardByFirstName":"JOHN","heardByLastName":"FERGUSON","results":[{"oicOffenceCode":"51:16","offenceType":"Prison Rule 51","offenceDescription":"Intentionally or recklessly sets fire to any part of a prison or any other property, whether or not his own","plea":"Guilty","finding":"Charge Proved","sanctions":[{"sanctionType":"Additional Days Added","sanctionDays":5,"effectiveDate":"2023-08-09T00:00:00","status":"Immediate","sanctionSeq":15}]}]}]}',
) as IndividualAdjudication

const adjudicationTwo = JSON.parse(
  '{"adjudicationNumber":1525917,"incidentTime":"2023-08-01T09:00:00","establishment":"Moorland (HMP & YOI)","interiorLocation":"Circuit","incidentDetails":"some details","reportNumber":1503215,"reportType":"Governor\'s Report","reporterFirstName":"TIM","reporterLastName":"WRIGHT","reportTime":"2023-08-02T09:09:00","hearings":[{"oicHearingId":2012687,"hearingType":"Governor\'s Hearing Adult","hearingTime":"2023-08-03T16:45:00","establishment":"Moorland (HMP & YOI)","location":"Adj","heardByFirstName":"JOHN","heardByLastName":"FERGUSON","results":[{"oicOffenceCode":"51:16","offenceType":"Prison Rule 51","offenceDescription":"Intentionally or recklessly sets fire to any part of a prison or any other property, whether or not his own","plea":"Guilty","finding":"Charge Proved","sanctions":[{"sanctionType":"Additional Days Added","sanctionDays":5,"effectiveDate":"2023-08-09T00:00:00","status":"Immediate","sanctionSeq":15}]}]}]}',
) as IndividualAdjudication

const adjudicationThree = JSON.parse(
  '{"adjudicationNumber":1525918,"incidentTime":"2023-08-01T09:00:00","establishment":"Moorland (HMP & YOI)","interiorLocation":"Circuit","incidentDetails":"some details","reportNumber":1503215,"reportType":"Governor\'s Report","reporterFirstName":"TIM","reporterLastName":"WRIGHT","reportTime":"2023-08-02T09:09:00","hearings":[{"oicHearingId":2012687,"hearingType":"Governor\'s Hearing Adult","hearingTime":"2023-08-04T16:45:00","establishment":"Moorland (HMP & YOI)","location":"Adj","heardByFirstName":"JOHN","heardByLastName":"FERGUSON","results":[{"oicOffenceCode":"51:16","offenceType":"Prison Rule 51","offenceDescription":"Intentionally or recklessly sets fire to any part of a prison or any other property, whether or not his own","plea":"Guilty","finding":"Charge Proved","sanctions":[{"sanctionType":"Additional Days Added","sanctionDays":5,"effectiveDate":"2023-08-09T00:00:00","status":"Immediate","sanctionSeq":15}]}]}]}',
) as IndividualAdjudication

const adjudicationThreeWithTwoSanctions = JSON.parse(
  '{"adjudicationNumber":1525918,"incidentTime":"2023-08-01T09:00:00","establishment":"Moorland (HMP & YOI)","interiorLocation":"Circuit","incidentDetails":"some details","reportNumber":1503215,"reportType":"Governor\'s Report","reporterFirstName":"TIM","reporterLastName":"WRIGHT","reportTime":"2023-08-02T09:09:00","hearings":[{"oicHearingId":2012687,"hearingType":"Governor\'s Hearing Adult","hearingTime":"2023-08-04T16:45:00","establishment":"Moorland (HMP & YOI)","location":"Adj","heardByFirstName":"JOHN","heardByLastName":"FERGUSON","results":[{"oicOffenceCode":"51:16","offenceType":"Prison Rule 51","offenceDescription":"Intentionally or recklessly sets fire to any part of a prison or any other property, whether or not his own","plea":"Guilty","finding":"Charge Proved","sanctions":[{"sanctionType":"Additional Days Added","sanctionDays":5,"effectiveDate":"2023-08-09T00:00:00","status":"Immediate","sanctionSeq":15}, {"sanctionType":"Additional Days Added","sanctionDays":99,"effectiveDate":"2023-08-09T00:00:00","status":"Immediate","sanctionSeq":16}]}]}]}',
) as IndividualAdjudication

describe('Additional Days Added Service', () => {
  let adjudicationsApi: nock.Scope

  beforeEach(() => {
    config.apis.adjudications.url = 'http://localhost:8100'
    adjudicationsApi = nock(config.apis.adjudications.url)
  })

  afterEach(() => {
    nock.cleanAll()
  })
  describe('Prisoner detail', () => {
    it('Get prisoner detail', async () => {
      adjudicationsApi.get('/adjudications/AA1234A/adjudications?size=1000', '').reply(200, threeAdjudicationSummary)
      adjudicationsApi.get('/adjudications/AA1234A/charge/1525916', '').reply(200, adjudicationOne)
      adjudicationsApi.get('/adjudications/AA1234A/charge/1525917', '').reply(200, adjudicationTwo)
      adjudicationsApi.get('/adjudications/AA1234A/charge/1525918', '').reply(200, adjudicationThreeWithTwoSanctions)
      const data = await adaService.getAdjudications('AA1234A', 'username')
      expect(nock.isDone()).toBe(true)
    })
  })
})
