## ADDED Requirements

### Requirement: Organization creation

An authenticated user SHALL be able to create an organization, and the system SHALL make that user the active owner in the same transaction.

#### Scenario: Organization is created

- **WHEN** an authenticated user submits valid organization data
- **THEN** the organization and owner membership both exist after commit

#### Scenario: Organization creation fails

- **WHEN** either organization or owner membership persistence fails
- **THEN** neither record remains committed

### Requirement: Membership listing

An active organization member with membership-read permission SHALL be able to list active memberships using cursor pagination.

#### Scenario: Authorized member lists memberships

- **WHEN** a member with the required permission requests the organization membership list
- **THEN** the system returns only memberships belonging to that organization

#### Scenario: Unrelated user lists memberships

- **WHEN** a user without an active membership requests the organization membership list
- **THEN** the system rejects the request without exposing membership data

### Requirement: Initial organization roles

The system SHALL provide `owner`, `admin`, and `member` roles mapped to explicit permission constants, with owner retaining complete organization administration permission.

#### Scenario: Role permission is checked

- **WHEN** an organization operation declares a required permission
- **THEN** access is granted only when the active membership role maps to that permission

### Requirement: Membership role management

An authorized organization member SHALL be able to change another membership between supported non-owner roles, while owner changes follow protected ownership rules.

#### Scenario: Admin updates member role

- **WHEN** an admin changes an active member between supported non-owner roles
- **THEN** the membership is updated and subsequent authorization uses the new role

#### Scenario: Unauthorized role change

- **WHEN** a member without role-management permission attempts a role change
- **THEN** the system returns HTTP 403 and leaves the membership unchanged

#### Scenario: Last owner would be removed

- **WHEN** an operation would leave an organization without an active owner
- **THEN** the system rejects the operation

### Requirement: Tenant isolation

Every organization-scoped read and write MUST constrain data access by the requested organization identifier in addition to membership authorization.

#### Scenario: Cross-tenant resource identifier is supplied

- **WHEN** an authorized member of one organization targets a resource belonging to another organization
- **THEN** the system returns no foreign resource and performs no modification

### Requirement: Membership removal

An authorized organization member SHALL be able to remove an eligible membership, subject to ownership invariants.

#### Scenario: Eligible membership is removed

- **WHEN** an authorized actor removes an active non-protected membership
- **THEN** that user loses organization access immediately
