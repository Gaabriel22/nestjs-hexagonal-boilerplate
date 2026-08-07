## ADDED Requirements

### Requirement: Versioned JSON API

The system SHALL expose business endpoints under a versioned API prefix and SHALL use JSON request and response representations unless an endpoint explicitly documents another media type.

#### Scenario: Client uses supported API version

- **WHEN** a client calls an existing endpoint under the supported version prefix
- **THEN** the system routes the request to that version's handler

### Requirement: Boundary input validation

The system MUST validate path, query, header, and body inputs against declared DTO constraints, reject unknown body properties, and avoid implicit transformations not declared by the DTO.

#### Scenario: Valid input reaches a use case

- **WHEN** a request satisfies the endpoint DTO
- **THEN** the controller invokes the application use case with normalized input

#### Scenario: Invalid input is rejected

- **WHEN** a request violates one or more DTO constraints
- **THEN** the system returns HTTP 400 with safe field-level validation details

### Requirement: Standard Problem Details errors

The system SHALL return known HTTP failures using a Problem Details document containing a stable type or code, title, status, detail, instance, and request identifier where available.

#### Scenario: Known application error occurs

- **WHEN** an application use case raises a mapped error
- **THEN** the response contains the mapped status and stable error identity

#### Scenario: Unexpected error occurs

- **WHEN** an unhandled error reaches the global exception filter
- **THEN** the response uses HTTP 500 with a generic detail and no stack trace or internal secret

### Requirement: Secure HTTP defaults

The system MUST apply configurable CORS, security headers, request body limits, and rate limits using Fastify-compatible integrations.

#### Scenario: Request exceeds a configured limit

- **WHEN** a client exceeds the configured request size or rate policy
- **THEN** the system rejects the request with the documented HTTP failure

### Requirement: Generated OpenAPI contract

The system SHALL generate an OpenAPI document from the running NestJS application and SHALL describe authentication, request DTOs, response DTOs, and standard errors for public endpoints.

#### Scenario: OpenAPI document is requested

- **WHEN** a client requests the configured OpenAPI route
- **THEN** the system returns a valid document containing registered public operations

### Requirement: Scalar API reference

The system SHALL expose Scalar API Reference backed by the generated OpenAPI document through a Fastify-compatible integration.

#### Scenario: Developer opens API reference

- **WHEN** a developer visits the configured reference route
- **THEN** Scalar renders the current OpenAPI operations and schemas
