const specialRemissionType = [
  {
    value: 'MERITORIOUS_CONDUCT',
    text: 'Meritorious (excellent) conduct',
    hint: {
      text: 'The person has been rewarded with automatic release. or consideration for release by the Parole Board at an earlier date. If the person is on licence, their SLED is being brought forward',
    },
  },
  {
    value: 'RELEASE_DATE_CALCULATED_TOO_EARLY',
    text: 'Release date calculated too early',
    hint: {
      text: 'The balance of the sentence to be served to the correct release date has been cancelled out. The person will be released on an earlier date. Release in error',
    },
  },
  {
    value: 'RELEASE_IN_ERROR',
    text: 'Release in error',
    hint: {
      text: "The person was released in error and they're not being returned to custody.",
    },
  },
]

export default specialRemissionType
