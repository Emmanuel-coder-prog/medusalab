# Brand Linked Model Decision

## Requirement
Products need a structured, queryable brand association.

## Chosen implementation
A custom Brand Module linked to Medusa Product records.

## Relationship
One Brand can be linked to many Products.
A Product has one Brand in this lab.

## Why not metadata
Brand needs a reusable record, stable identity, uniqueness, querying,
product association, and future integration capability.

## Ownership in this lab
Medusa owns Brand records.

## Production ownership rule
For Retail Global and Wholesale Global, the PIM should normally own
canonical brand data. Medusa should receive an approved commerce projection.

## Explicitly not owned by this module
- Editorial brand story
- Campaign content
- Buying guides
- Brand blog posts
- Marketing SEO copy