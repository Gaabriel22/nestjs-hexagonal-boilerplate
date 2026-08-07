# user-management Specification

## Purpose

TBD - created by archiving change build-production-backend-boilerplate. Update Purpose after archive.

## Requirements

### Requirement: Current user profile

An authenticated active user SHALL be able to retrieve their own safe profile representation.

#### Scenario: User retrieves profile

- **WHEN** an authenticated user requests the current-user endpoint
- **THEN** the response contains public profile fields and excludes credentials, token data, and internal persistence fields

### Requirement: Current user profile update

An authenticated active user SHALL be able to update the supported mutable fields of their own profile.

#### Scenario: Valid profile update

- **WHEN** an authenticated user submits valid supported profile changes
- **THEN** the system persists and returns the updated safe profile

#### Scenario: Unsupported or invalid profile update

- **WHEN** an authenticated user submits immutable, unknown, or invalid fields
- **THEN** the system returns HTTP 400 without changing the profile

### Requirement: User activation state enforcement

The system MUST reject protected operations for a deactivated user even when the presented access token has not expired.

#### Scenario: Deactivated user sends protected request

- **WHEN** a validly signed token identifies a user who is no longer active
- **THEN** the system rejects the request and does not execute the protected use case
