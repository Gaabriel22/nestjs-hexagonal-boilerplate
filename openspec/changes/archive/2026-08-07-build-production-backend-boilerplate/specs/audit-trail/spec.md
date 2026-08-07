## ADDED Requirements

### Requirement: Immutable audit recording

The system SHALL append immutable audit events for defined security-sensitive and organization-administrative actions.

#### Scenario: Audited action commits

- **WHEN** an audited use case completes successfully
- **THEN** an audit event describing the actor, action, target, context, and timestamp is committed with the business change

#### Scenario: Audited action rolls back

- **WHEN** an audited business change fails and rolls back
- **THEN** no success audit event remains committed for that change

### Requirement: Safe audit contents

Audit events MUST exclude passwords, credential hashes, access tokens, refresh tokens, authorization headers, cookies, and unrestricted request bodies.

#### Scenario: Sensitive request is audited

- **WHEN** an audited action receives sensitive input
- **THEN** the stored audit metadata contains only explicitly allowlisted safe fields

### Requirement: Tenant-scoped audit retrieval

An active organization member with audit-read permission SHALL be able to retrieve that organization's audit events using cursor pagination and supported filters.

#### Scenario: Authorized audit query

- **WHEN** an authorized member requests audit events for their organization
- **THEN** the system returns matching events only from that organization in deterministic order

#### Scenario: Unauthorized audit query

- **WHEN** a user without audit-read permission requests organization audit events
- **THEN** the system returns HTTP 403 without exposing event existence

### Requirement: Request correlation in audit events

The system SHALL attach the current request identifier to an audit event when the action originates from an HTTP request.

#### Scenario: HTTP action is audited

- **WHEN** an audited use case runs within an identified request
- **THEN** its audit event contains the same request identifier used in operational logs
