CREATE TABLE "session_refresh_tokens" (
    "token_hash" TEXT NOT NULL,
    "session_id" UUID NOT NULL,
    "issued_at" TIMESTAMPTZ NOT NULL,
    "used_at" TIMESTAMPTZ,

    CONSTRAINT "session_refresh_tokens_pkey" PRIMARY KEY ("token_hash")
);

CREATE INDEX "session_refresh_tokens_session_id_used_at_idx"
ON "session_refresh_tokens"("session_id", "used_at");

ALTER TABLE "session_refresh_tokens"
ADD CONSTRAINT "session_refresh_tokens_session_id_fkey"
FOREIGN KEY ("session_id") REFERENCES "sessions"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "session_refresh_tokens" (
    "token_hash",
    "session_id",
    "issued_at",
    "used_at"
)
SELECT
    "refresh_token_hash",
    "id",
    "created_at",
    NULL
FROM "sessions";
