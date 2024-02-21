import {
  convertToTitleCase,
  daysBetween,
  initialiseName,
  isDateInFuture,
  calculateReleaseDatesCheckInformationUrl,
} from './utils'

describe('convert to title case', () => {
  it.each([
    [null, null, ''],
    ['empty string', '', ''],
    ['Lower case', 'robert', 'Robert'],
    ['Upper case', 'ROBERT', 'Robert'],
    ['Mixed case', 'RoBErT', 'Robert'],
    ['Multiple words', 'RobeRT SMiTH', 'Robert Smith'],
    ['Leading spaces', '  RobeRT', '  Robert'],
    ['Trailing spaces', 'RobeRT  ', 'Robert  '],
    ['Hyphenated', 'Robert-John SmiTH-jONes-WILSON', 'Robert-John Smith-Jones-Wilson'],
  ])('%s convertToTitleCase(%s, %s)', (_: string, a: string, expected: string) => {
    expect(convertToTitleCase(a)).toEqual(expected)
  })
})

describe('initialise name', () => {
  it.each([
    [null, null, null],
    ['Empty string', '', null],
    ['One word', 'robert', 'r. robert'],
    ['Two words', 'Robert James', 'R. James'],
    ['Three words', 'Robert James Smith', 'R. Smith'],
    ['Double barrelled', 'Robert-John Smith-Jones-Wilson', 'R. Smith-Jones-Wilson'],
  ])('%s initialiseName(%s, %s)', (_: string, a: string, expected: string) => {
    expect(initialiseName(a)).toEqual(expected)
  })
})

describe('Days between dates', () => {
  it.each([
    ['Same day', new Date(2021, 0, 1), new Date(2021, 0, 1), 1],
    ['Multiple days', new Date(2021, 0, 1), new Date(2021, 0, 3), 3],
    ['Spanning months', new Date(2021, 1, 1), new Date(2021, 2, 3), 31],
    ['Spanning February in leap year', new Date(2024, 1, 1), new Date(2024, 2, 3), 32],
  ])('%s', (_: string, a: Date, b: Date, expected: number) => {
    expect(daysBetween(a, b)).toEqual(expected)
  })
})

describe('Future date tests', () => {
  const today = new Date()
  it.each([
    ['Same day', today.getFullYear().toString(), (today.getMonth() + 1).toString(), today.getDate().toString(), false],
    [
      'One day in future',
      today.getFullYear().toString(),
      (today.getMonth() + 1).toString(),
      (today.getDate() + 1).toString(),
      true,
    ],
    [
      'One day in past',
      today.getFullYear().toString(),
      (today.getMonth() + 1).toString(),
      (today.getDate() - 1).toString(),
      false,
    ],
    [
      'One month in future',
      today.getFullYear().toString(),
      (today.getMonth() + 2).toString(),
      today.getDate().toString(),
      true,
    ],
    [
      'One month in past',
      today.getFullYear().toString(),
      today.getMonth().toString(),
      today.getDate().toString(),
      false,
    ],
    [
      'One year in future',
      (today.getFullYear() + 1).toString(),
      (today.getMonth() + 1).toString(),
      today.getDate().toString(),
      true,
    ],
    [
      'One year in past',
      (today.getFullYear() - 1).toString(),
      (today.getMonth() + 1).toString(),
      today.getDate().toString(),
      false,
    ],
  ])('%s', (_: string, year: string, month: string, day: string, expected: boolean) => {
    expect(isDateInFuture(year, month, day)).toEqual(expected)
  })
})

describe('Calculate Release Dates Location', () => {
  it('Check redirection to reason is configured', () => {
    return expect(calculateReleaseDatesCheckInformationUrl('A1234AA')).toContain(
      'http://localhost:8080/calculation/A1234AA/reason',
    )
  })
})
