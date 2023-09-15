import AdjudicationClient from '../api/adjudicationsClient'
import { AdjudicationSearchResponse, Sanction } from '../@types/adjudications/adjudicationTypes'
import { HmppsAuthClient } from '../data'

type ChargeDetails = {
  chargeNumber: number
  toBeServed: string
  heardAt: string
  status: string
  days: number
}

type AdasByDateCharged = {
  dateChargeProved: Date
  charges: FlatAda[]
}

interface FlatAda extends ChargeDetails {
  dateChargeProved: Date
}

type AdasToReview = {
  awardedAdas: AdasByDateCharged[]
  totalAwardedAdas: number
  suspendedAdas: AdasByDateCharged[]
  totalSuspendedAdas: number
}

const sanctionIsProspective = (s: Sanction) => s.status === 'Prospective' || s.status === 'Suspended and Prospective'
const sanctionIsAda = (s: Sanction) => s.sanctionType === 'Additional Days Added'

const isSanctionedAda = (s: Sanction) => sanctionIsAda(s) && !sanctionIsProspective(s)

export default class AdditionalDaysAwardedService {
  constructor(private readonly hmppsAuthClient: HmppsAuthClient) {}

  public async getAdjudications(nomsId: string, username: string) {
    const systemToken = await this.hmppsAuthClient.getSystemClientToken(username)
    const adjudicationClient = new AdjudicationClient(systemToken)
    const adjudications: AdjudicationSearchResponse = await adjudicationClient.getAdjudications(nomsId)
    // console.log(JSON.stringify(adjudications))
    // const individualAdjudications: IndividualAdjudication[] = []
    const individualAdjudications = await Promise.all(
      adjudications.results.content.map(async it => {
        return adjudicationClient.getAdjudication(nomsId, it.adjudicationNumber)
      }),
    )

    // console.log(JSON.stringify(adjudications))

    const sanctionedAdasToTransform = individualAdjudications.filter(ad =>
      ad.hearings.some(h =>
        // h.hearingTime >= earliest sentence date && ############  TODO add this condition
        h.results.some(r => r.sanctions.some(s => isSanctionedAda(s))),
      ),
    )

    // console.log(JSON.stringify(immediateAdjudications))
    // const sanctionedAdas = sanctionedAdasToTransform.map(a => {
    //   const hearing = a.hearings.find(h =>
    //     // h.hearingTime >= earliest sentence date && ############  TODO add this condition
    //     h.results.some(r => r.sanctions.some(s => isSanctionedAda(s))),
    //   )
    //   const result = hearing.results.find(r => r.sanctions.some(s => isSanctionedAda(s)))
    //   const sanction = result.sanctions.find(s => isSanctionedAda(s))
    //   return {
    //     dateChargeProved: hearing.hearingTime,
    //     chargeNumber: a.adjudicationNumber,
    //     toBeServed: 'TODO',
    //     heardAt: hearing.establishment,
    //     status: sanction.status,
    //     days: sanction.sanctionDays,
    //   } as FlatAda
    // })
    const sanctionedAdas = sanctionedAdasToTransform.reduce((acc, cur) => {
      cur.hearings
        .filter(h =>
          // h.hearingTime >= earliest sentence date && ############  TODO add this condition
          h.results.some(r => r.sanctions.some(s => isSanctionedAda(s))),
        )
        .forEach(hearing => {
          const result = hearing.results.find(r => r.sanctions.some(s => isSanctionedAda(s)))
          result.sanctions
            .filter(s => isSanctionedAda(s))
            .forEach(sanction => {
              const ada = {
                dateChargeProved: new Date(hearing.hearingTime.substring(0, 10)),
                chargeNumber: cur.adjudicationNumber,
                toBeServed: 'TODO',
                heardAt: hearing.establishment,
                status: sanction.status,
                days: sanction.sanctionDays,
              } as FlatAda
              acc.push(ada)
            })
        })
      return acc
    }, [])

    // console.log('###########################')
    // console.log('###########################')
    // console.log('###########################')
    // console.log('JSON.stringify(res)')
    // console.log(JSON.stringify(flattenedAdas))

    const awardedAdas = sanctionedAdas.reduce((acc: AdasByDateCharged[], cur) => {
      if (acc.some(it => it.dateChargeProved.getTime() === cur.dateChargeProved.getTime())) {
        const record = acc.find(it => it.dateChargeProved.getTime() === cur.dateChargeProved.getTime())
        record.charges.push(cur)
        // const charges = record.charges.push(cur)
        // acc.push({ dateChargeProved: cur.dateChargeProved, charges } as AdasByDateCharged)
      } else {
        acc.push({ dateChargeProved: cur.dateChargeProved, charges: [cur] } as AdasByDateCharged)
      }

      console.log('acc iteration')
      console.log(JSON.stringify(acc))
      return acc
    }, [])

    console.log(`xxxxx${JSON.stringify(awardedAdas)}`)
    const totalDays = sanctionedAdas.reduce((acc, cur) => acc + cur.days, 0)
    const x = { totalAwardedAdas: totalDays, awardedAdas } as AdasToReview
    console.log(`yyyy${JSON.stringify(x)}`)
    return { totalAwardedAdas: totalDays, awardedAdas } as AdasToReview
  }
}
