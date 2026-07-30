## ADDED Requirements

### Requirement: Credential registration
The system SHALL register an active user with a normalized unique email address and an Argon2id password hash, and MUST never persist or return the plain-text password.

#### Scenario: New email is registered
- **WHEN** a visitor submits a valid unused email and valid password
- **THEN** the system creates the user and credential and returns the documented identity result

#### Scenario: Email already exists
- **WHEN** a visitor submits an email whose normalized value already exists
- **THEN** the system returns HTTP 409 without revealing credential data

### Requirement: Credential authentication
The system SHALL authenticate active users using normalized email and password and SHALL return the same public failure for unknown users and invalid passwords.

#### Scenario: Credentials are valid
- **WHEN** an active user submits the correct credentials
- **THEN** the system creates a session and issues access and refresh tokens

#### Scenario: Credentials are invalid
- **WHEN** the email is unknown or the password is wrong
- **THEN** the system returns HTTP 401 with the same public error

### Requirement: Short-lived access tokens
The system SHALL sign access tokens with configured key material and lifetime and SHALL include stable user and session identifiers without sensitive profile or permission data.

#### Scenario: Valid access token is presented
- **WHEN** a protected endpoint receives a valid unexpired token for an active session and user
- **THEN** the request identity is made available to authorization controls

#### Scenario: Access token is invalid
- **WHEN** a protected endpoint receives a missing, malformed, expired, or invalidly signed token
- **THEN** the system returns HTTP 401

### Requirement: Rotating refresh sessions
The system SHALL issue opaque refresh tokens, persist only their keyed hashes, and atomically rotate them on successful refresh.

#### Scenario: Current refresh token is used
- **WHEN** a client presents the current valid refresh token for an active session
- **THEN** the system invalidates that token and returns a new access and refresh token pair

#### Scenario: Rotated token is reused
- **WHEN** a client presents a refresh token that was already rotated
- **THEN** the system rejects the request and revokes the affected session or token family

### Requirement: Session management
An authenticated user SHALL be able to list their active sessions, revoke a selected owned session, and log out the current session.

#### Scenario: User lists sessions
- **WHEN** an authenticated user requests their sessions
- **THEN** the system returns safe device and activity metadata without token hashes

#### Scenario: User revokes owned session
- **WHEN** an authenticated user selects one of their active sessions for revocation
- **THEN** subsequent access and refresh attempts for that session are rejected

#### Scenario: User targets another user's session
- **WHEN** an authenticated user attempts to revoke a session they do not own
- **THEN** the system does not reveal or modify that session
