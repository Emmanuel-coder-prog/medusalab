# Multi-Market Context Decision

## Core rule

A cart has one commercial context:

- one Region
- one transactional currency
- one Sales Channel
- one resulting payment and fulfillment context

## Market switch rule

If the customer changes Region or Sales Channel after items have been
added, create a replacement cart.

Do not silently convert an existing cart between currencies or markets.

## Language rule

All markets use English storefront content.

Market selection must not automatically translate product or editorial content.
Localized English SEO remains an editorial/PIM/Strapi concern.

## USD rule

USD is always displayed as a reference/base currency.

The cart and order use the Region's transactional currency.
USD display values must never be used to calculate tax, shipping, payment,
or the final order total.