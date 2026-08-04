import { InvalidOrganizationNameError } from '../errors/invalid-organization-name.error'

const MIN_NAME_LENGTH = 2
const MAX_NAME_LENGTH = 120

export class OrganizationName {
  private constructor(readonly value: string) {}

  static create(input: string): OrganizationName {
    const value = input.trim().replace(/\s+/g, ' ')

    if (value.length < MIN_NAME_LENGTH || value.length > MAX_NAME_LENGTH) {
      throw new InvalidOrganizationNameError()
    }

    return new OrganizationName(value)
  }
}
