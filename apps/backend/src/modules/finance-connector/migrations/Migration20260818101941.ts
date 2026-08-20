import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260818101941 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "finance_sync_outbox" drop constraint if exists "finance_sync_outbox_idempotency_key_unique";`);
    this.addSql(`alter table if exists "finance_event_receipt" drop constraint if exists "finance_event_receipt_source_event_id_unique";`);
    this.addSql(`create table if not exists "finance_event_receipt" ("id" text not null, "source" text not null, "event_id" text not null, "event_type" text not null, "payload_hash" text not null, "subject_type" text null, "subject_id" text null, "occurred_at" timestamptz not null, "received_at" timestamptz not null, "processed_at" timestamptz null, "processing_status" text not null, "error_code" text null, "error_message" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "finance_event_receipt_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_finance_event_receipt_event_type" ON "finance_event_receipt" ("event_type") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_finance_event_receipt_subject_id" ON "finance_event_receipt" ("subject_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_finance_event_receipt_occurred_at" ON "finance_event_receipt" ("occurred_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_finance_event_receipt_received_at" ON "finance_event_receipt" ("received_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_finance_event_receipt_processing_status" ON "finance_event_receipt" ("processing_status") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_finance_event_receipt_deleted_at" ON "finance_event_receipt" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_finance_event_receipt_source_event_id_unique" ON "finance_event_receipt" ("source", "event_id") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "finance_sync_outbox" ("id" text not null, "operation" text not null, "aggregate_type" text not null, "aggregate_id" text not null, "organization_id" text null, "idempotency_key" text not null, "payload" jsonb not null, "status" text check ("status" in ('pending', 'in_progress', 'accepted', 'failed', 'manual_review', 'cancelled')) not null default 'pending', "external_reference" text null, "attempt_count" integer not null default 0, "next_attempt_at" timestamptz not null, "last_attempted_at" timestamptz null, "accepted_at" timestamptz null, "error_code" text null, "error_message" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "finance_sync_outbox_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_finance_sync_outbox_operation" ON "finance_sync_outbox" ("operation") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_finance_sync_outbox_aggregate_type" ON "finance_sync_outbox" ("aggregate_type") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_finance_sync_outbox_aggregate_id" ON "finance_sync_outbox" ("aggregate_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_finance_sync_outbox_organization_id" ON "finance_sync_outbox" ("organization_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_finance_sync_outbox_idempotency_key_unique" ON "finance_sync_outbox" ("idempotency_key") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_finance_sync_outbox_next_attempt_at" ON "finance_sync_outbox" ("next_attempt_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_finance_sync_outbox_deleted_at" ON "finance_sync_outbox" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_finance_sync_outbox_status_next_attempt_at" ON "finance_sync_outbox" ("status", "next_attempt_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "finance_event_receipt" cascade;`);

    this.addSql(`drop table if exists "finance_sync_outbox" cascade;`);
  }

}
