CREATE TYPE "membership_role" AS ENUM ('owner', 'admin', 'member');

CREATE TABLE "organizations" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "memberships" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "membership_role" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "memberships_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "organizations_is_active_name_idx"
ON "organizations"("is_active", "name");

CREATE INDEX "memberships_organization_id_is_active_idx"
ON "memberships"("organization_id", "is_active");

CREATE INDEX "memberships_organization_id_role_is_active_idx"
ON "memberships"("organization_id", "role", "is_active");

CREATE INDEX "memberships_user_id_is_active_idx"
ON "memberships"("user_id", "is_active");

CREATE UNIQUE INDEX "memberships_organization_id_user_id_key"
ON "memberships"("organization_id", "user_id");

ALTER TABLE "memberships"
ADD CONSTRAINT "memberships_organization_id_fkey"
FOREIGN KEY ("organization_id") REFERENCES "organizations"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "memberships"
ADD CONSTRAINT "memberships_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
