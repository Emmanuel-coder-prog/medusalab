import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260811120000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      create table if not exists "hubloft_fulfillment_outbox" (
        "id" text not null,
        "order_id" text not null,
        "reservation_id" text null,
        "delivery_slot_id" text null,
        "status" text not null default 'pending',
        "payload" jsonb null,
        "attempts" int not null default 0,
        "last_error" text null,
        "created_at" timestamptz null,
        "updated_at" timestamptz null,
        "sent_at" timestamptz null,
        "accepted_at" timestamptz null,
        "failed_at" timestamptz null,
        "cancelled_at" timestamptz null,
        "deleted_at" timestamptz null,
        constraint "hubloft_fulfillment_outbox_pkey" primary key ("id")
      );
    `);

    this.addSql(`
      alter table if exists "hubloft_fulfillment_outbox"
      add constraint "hubloft_fulfillment_outbox_status_check"
      check("status" in ('pending', 'accepted', 'failed', 'manual_review', 'cancelled'));
    `);

    this.addSql(`
      create index if not exists "IDX_hubloft_fulfillment_outbox_order_id"
      on "hubloft_fulfillment_outbox" ("order_id")
      where "deleted_at" is null;
    `);

    this.addSql(`
      create unique index if not exists "IDX_hubloft_fulfillment_outbox_order_key"
      on "hubloft_fulfillment_outbox" ("order_id")
      where "deleted_at" is null and "status" = 'pending';
    `);
  }

  override async down(): Promise<void> {
    this.addSql(`drop index if exists "IDX_hubloft_fulfillment_outbox_order_key";`);
    this.addSql(`drop index if exists "IDX_hubloft_fulfillment_outbox_order_id";`);
    this.addSql(`alter table if exists "hubloft_fulfillment_outbox" drop constraint if exists "hubloft_fulfillment_outbox_status_check";`);
    this.addSql(`drop table if exists "hubloft_fulfillment_outbox" cascade;`);
  }
}
