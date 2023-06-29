import Page from './page'

export default class AuthSignInPage extends Page {
  constructor() {
    super('Sign in')
  }

  public skipAxe() {
    return true
  }
}
