## ADDED Requirements

### Requirement: Structured application logs
The system SHALL emit structured JSON logs containing timestamp, severity, service, environment, and event information.

#### Scenario: Application emits a log
- **WHEN** a configured log event occurs
- **THEN** the event is serialized as structured JSON with the baseline fields

### Requirement: Correlated request logs
The system SHALL accept a valid client request identifier or generate one, return it to the client, and include it in request completion logs and downstream request context.

#### Scenario: Request lacks identifier
- **WHEN** an HTTP request arrives without a valid request identifier
- **THEN** the system generates one and returns the same value in the response

#### Scenario: Request completes
- **WHEN** an HTTP response finishes
- **THEN** one completion log records the request identifier, method, route template, status, and duration

### Requirement: Sensitive data redaction
The logging system MUST redact configured credential, token, cookie, authorization, and secret fields before serialization.

#### Scenario: Logged context contains secret field
- **WHEN** a log call includes a configured sensitive path
- **THEN** the output replaces its value with a redaction marker

### Requirement: Liveness endpoint
The system SHALL expose a liveness endpoint that reports whether the application process can serve requests without depending on optional external services.

#### Scenario: Process is alive
- **WHEN** an orchestrator calls the liveness endpoint
- **THEN** the system returns a successful status with minimal process health data

### Requirement: Readiness endpoint
The system SHALL expose a readiness endpoint that verifies required dependencies, including PostgreSQL, within bounded time.

#### Scenario: Required dependencies are available
- **WHEN** every required readiness check succeeds
- **THEN** the endpoint returns a successful ready status

#### Scenario: PostgreSQL is unavailable
- **WHEN** the database readiness check fails or times out
- **THEN** the endpoint returns HTTP 503 with a safe dependency status

### Requirement: Prometheus-compatible metrics
The system SHALL expose process and HTTP metrics in Prometheus text format using bounded labels.

#### Scenario: Metrics are scraped
- **WHEN** an authorized or internally exposed metrics request is made
- **THEN** the response contains process and HTTP count/duration metrics without user, tenant, token, or request identifiers as labels
