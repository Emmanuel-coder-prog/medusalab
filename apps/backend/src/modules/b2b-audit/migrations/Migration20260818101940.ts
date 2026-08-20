import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260818101940 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "b2b_audit_event" drop constraint if exists "b2b_audit_event_event_id_unique";`);
    this.addSql(`create table if not exists "b2b_audit_event" ("id" text not null, "event_id" text not null, "action" text not null, "outcome" text check ("outcome" in ('success', 'denied', 'failure')) not null default 'success', "entity_type" text not null, "entity_id" text not null, "organization_id" text null, "actor_type" text check ("actor_type" in ('customer', 'admin', 'service', 'external_system')) not null default 'service', "actor_id" text null, "actor_display" text null, "correlation_id" text null, "causation_id" text null, "reason_code" text null, "note" text null, "metadata" jsonb null, "occurred_at" timestamptz not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "b2b_audit_event_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_b2b_audit_event_event_id_unique" ON "b2b_audit_event" ("event_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_b2b_audit_event_action" ON "b2b_audit_event" ("action") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_b2b_audit_event_entity_type" ON "b2b_audit_event" ("entity_type") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_b2b_audit_event_entity_id" ON "b2b_audit_event" ("entity_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_b2b_audit_event_organization_id" ON "b2b_audit_event" ("organization_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_b2b_audit_event_correlation_id" ON "b2b_audit_event" ("correlation_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_b2b_audit_event_occurred_at" ON "b2b_audit_event" ("occurred_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_b2b_audit_event_deleted_at" ON "b2b_audit_event" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_b2b_audit_event_entity_type_entity_id_occurred_at" ON "b2b_audit_event" ("entity_type", "entity_id", "occurred_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_b2b_audit_event_organization_id_occurred_at" ON "b2b_audit_event" ("organization_id", "occurred_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_b2b_audit_event_action_outcome_occurred_at" ON "b2b_audit_event" ("action", "outcome", "occurred_at") WHERE deleted_at IS NULL;`);
    
    // Enforce append-only constraint at database level
    this.addSql(`CREATE OR REPLACE FUNCTION reject_b2b_audit_event_mutation() RETURNS trigger AS $$BEGIN RAISE EXCEPTION 'b2b_audit_event is append-only'; END;$$ LANGUAGE plpgsql;`);
    this.addSql(`CREATE TRIGGER b2b_audit_event_no_update_delete BEFORE UPDATE OR DELETE ON b2b_audit_event FOR EACH ROW EXECUTE FUNCTION reject_b2b_audit_event_mutation();`);
  }

  override async down(): Promise<void> {
    this.addSql(`DROP TRIGGER IF EXISTS b2b_audit_event_no_update_delete ON b2b_audit_event;`);
    this.addSql(`DROP FUNCTION IF EXISTS reject_b2b_audit_event_mutation();`);
    this.addSql(`drop table if exists "b2b_audit_event" cascade;`);
  }

}
