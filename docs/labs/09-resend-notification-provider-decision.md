# Resend Notification Provider Decision

## Requirement
Send transactional email through a standard Medusa Notification Provider.

## Chosen implementation
A custom Resend Notification Module Provider for the `email` channel.

## Provider responsibility
- Validate provider configuration.
- Render approved transactional templates.
- Send email through Resend.
- Return the provider message ID.
- Throw when delivery fails so the calling workflow can retry.

## Explicitly outside provider scope
- Order event listening.
- Customer communication consent.
- Marketing campaigns.
- Business notification timing.
- Warehouse/ERP synchronization.
- Delivery-slot or order workflow logic.

## Replacement rule
Business workflows send on `channel: "email"` only.
They must not call Resend SDK methods directly.


## Channel ownership

Development:
- local provider owns feed and email.

Production:
- local provider owns feed.
- Resend provider owns email.

## Security rules

- API keys remain server-side environment variables.
- Templates are version-controlled.
- Dynamic HTML values are escaped.
- No arbitrary customer HTML is accepted.

## Reliability limitation

The provider reports a transport result.
It does not provide exactly-once business delivery.

A later outbox/notification-delivery ledger will prevent duplicate customer
messages during event replay and retry.