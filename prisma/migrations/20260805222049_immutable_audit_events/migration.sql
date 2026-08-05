-- CreateTable
CREATE TABLE "audit_events" (
    "id" UUID NOT NULL,
    "actor_user_id" UUID NOT NULL,
    "organization_id" UUID,
    "action" VARCHAR(100) NOT NULL,
    "target_type" VARCHAR(50) NOT NULL,
    "target_id" UUID NOT NULL,
    "request_identifier" VARCHAR(128),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "occurred_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "audit_events_action_not_blank" CHECK (length(btrim("action")) > 0),
    CONSTRAINT "audit_events_target_type_not_blank" CHECK (length(btrim("target_type")) > 0),
    CONSTRAINT "audit_events_metadata_object" CHECK (jsonb_typeof("metadata") = 'object')
);

-- CreateIndex
CREATE INDEX "audit_events_organization_id_occurred_at_id_idx" ON "audit_events"("organization_id", "occurred_at", "id");

-- CreateIndex
CREATE INDEX "audit_events_actor_user_id_occurred_at_idx" ON "audit_events"("actor_user_id", "occurred_at");

-- CreateIndex
CREATE INDEX "audit_events_action_occurred_at_idx" ON "audit_events"("action", "occurred_at");

-- CreateIndex
CREATE INDEX "audit_events_target_type_target_id_idx" ON "audit_events"("target_type", "target_id");

-- Audit events are append-only, including for the owning application role.
CREATE FUNCTION "reject_audit_event_mutation"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION 'audit events are immutable' USING ERRCODE = '55000';
END;
$$;

CREATE TRIGGER "audit_events_reject_update_delete"
BEFORE UPDATE OR DELETE ON "audit_events"
FOR EACH ROW
EXECUTE FUNCTION "reject_audit_event_mutation"();
