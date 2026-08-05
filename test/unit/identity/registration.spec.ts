import { verify } from 'argon2'

import { EmailAlreadyRegisteredError } from '../../../src/identity/application/errors/email-already-registered.error'
import type { PasswordHasher } from '../../../src/identity/application/ports/password-hasher'
import type { RegistrationRepository } from '../../../src/identity/application/ports/registration.repository'
import { RegisterUser } from '../../../src/identity/application/use-cases/register-user'
import { Credential } from '../../../src/identity/domain/entities/credential'
import { InvalidCredentialError } from '../../../src/identity/domain/errors/invalid-credential.error'
import { InvalidEmailError } from '../../../src/identity/domain/errors/invalid-email.error'
import { WeakPasswordError } from '../../../src/identity/domain/errors/weak-password.error'
import { PasswordPolicy } from '../../../src/identity/domain/services/password-policy'
import { NormalizedEmail } from '../../../src/identity/domain/value-objects/normalized-email'
import { Argon2idPasswordHasher } from '../../../src/identity/infrastructure/security/argon2id-password-hasher'
import type { Clock } from '../../../src/shared/application/ports/clock'
import type { IdentifierGenerator } from '../../../src/shared/application/ports/identifier-generator'

const USER_ID = '00000000-0000-4000-8000-000000000001'
const AUDIT_EVENT_ID = '00000000-0000-4000-8000-000000000002'
const CURRENT_TIME = new Date('2026-01-01T10:00:00.000Z')
const VALID_PASSWORD = 'Registration password 1!'

describe('registration domain behavior', () => {
  it('normalizes email casing and surrounding whitespace', () => {
    expect(NormalizedEmail.create(' Person@Example.COM ').value).toBe('person@example.com')
  })

  it('rejects malformed email', () => {
    expect(() => NormalizedEmail.create('not-an-email')).toThrow(InvalidEmailError)
  })

  it.each(['short', 'x'.repeat(129)])('rejects password outside policy bounds', (password) => {
    expect(() => PasswordPolicy.assertValid(password)).toThrow(WeakPasswordError)
  })

  it('rejects an empty persisted credential hash', () => {
    expect(() =>
      Credential.create({ userId: USER_ID, passwordHash: ' ', currentTime: CURRENT_TIME }),
    ).toThrow(InvalidCredentialError)
  })
})

describe('RegisterUser', () => {
  let passwordHasher: jest.Mocked<PasswordHasher>
  let registrationRepository: jest.Mocked<RegistrationRepository>
  let identifierGenerator: jest.Mocked<IdentifierGenerator>
  let clock: jest.Mocked<Clock>
  let registerUser: RegisterUser

  beforeEach(() => {
    passwordHasher = { hash: jest.fn().mockResolvedValue('argon2id-hash') }
    registrationRepository = {
      createUserWithCredential: jest.fn().mockResolvedValue('created'),
    }
    identifierGenerator = {
      generate: jest.fn().mockReturnValueOnce(USER_ID).mockReturnValue(AUDIT_EVENT_ID),
    }
    clock = { now: jest.fn().mockReturnValue(CURRENT_TIME) }
    registerUser = new RegisterUser(
      passwordHasher,
      registrationRepository,
      identifierGenerator,
      clock,
    )
  })

  it('hashes the password and persists normalized identity records', async () => {
    await expect(
      registerUser.execute({ email: ' Person@Example.COM ', password: VALID_PASSWORD }),
    ).resolves.toEqual({
      id: USER_ID,
      email: 'person@example.com',
      isActive: true,
      createdAt: CURRENT_TIME,
    })
    expect(passwordHasher.hash.mock.calls).toEqual([[VALID_PASSWORD]])
    const persistenceCall = registrationRepository.createUserWithCredential.mock.calls[0]

    expect(persistenceCall).toBeDefined()
    if (persistenceCall === undefined) {
      throw new Error('Expected registration persistence call')
    }

    const [persistedUser, persistedCredential, auditEvent] = persistenceCall
    expect(persistedUser).toMatchObject({
      id: USER_ID,
      normalizedEmail: 'person@example.com',
    })
    expect(persistedCredential).toMatchObject({
      userId: USER_ID,
      passwordHash: 'argon2id-hash',
    })
    expect(auditEvent.toPrimitives()).toEqual({
      id: AUDIT_EVENT_ID,
      actorUserId: USER_ID,
      organizationId: null,
      action: 'identity.user_registered',
      targetType: 'user',
      targetId: USER_ID,
      requestIdentifier: null,
      metadata: {},
      occurredAt: CURRENT_TIME,
    })
  })

  it('maps persistence email conflicts to a stable application error', async () => {
    registrationRepository.createUserWithCredential.mockResolvedValue('email_conflict')

    await expect(
      registerUser.execute({ email: 'person@example.com', password: VALID_PASSWORD }),
    ).rejects.toThrow(EmailAlreadyRegisteredError)
  })

  it('does not persist when password hashing fails', async () => {
    passwordHasher.hash.mockRejectedValue(new Error('hash failed'))

    await expect(
      registerUser.execute({ email: 'person@example.com', password: VALID_PASSWORD }),
    ).rejects.toThrow('hash failed')
    expect(registrationRepository.createUserWithCredential.mock.calls).toHaveLength(0)
  })

  it('does not return an identity when the registration transaction rolls back', async () => {
    registrationRepository.createUserWithCredential.mockRejectedValue(
      new Error('transaction rolled back'),
    )

    await expect(
      registerUser.execute({ email: 'person@example.com', password: VALID_PASSWORD }),
    ).rejects.toThrow('transaction rolled back')
  })
})

describe('Argon2idPasswordHasher', () => {
  it('creates a verifiable Argon2id hash', async () => {
    const passwordHasher = new Argon2idPasswordHasher()

    const passwordHash = await passwordHasher.hash(VALID_PASSWORD)

    expect(passwordHash.startsWith('$argon2id$')).toBe(true)
    await expect(verify(passwordHash, VALID_PASSWORD)).resolves.toBe(true)
  })
})
