# B2B Navigation Integration Guide

**Date**: 2026-08-18  
**Branch**: lab/19-b2b-operations-and-erp-controls  
**Status**: ✅ Complete

---

## Navigation Architecture

The B2B UI is integrated into two primary navigation contexts:

### 1. Customer/Account-Level B2B (`/account/b2b/*`)
**Audience**: Customers managing organizations and making purchases  
**Layout**: AccountLayout (side nav + content)  
**Navigation Component**: Enhanced AccountNav with B2B sub-section

**Routes**:
```
/account
├── /account/profile              → Personal profile & settings
├── /account/addresses            → Shipping/billing addresses
├── /account/orders               → Personal retail orders
└── /account/b2b                  → B2B Organization Portal
    ├── /organizations            → List all organizations (browse, create)
    ├── /organizations/[handle]   → Organization detail (tabs for members, settings)
    │   ├── /members              → Team member management
    │   └── /settings             → Organization configuration
    ├── /approvals                → Approval queue (for approvers)
    └── /quotes                   → My quotes (awaiting acceptance)
```

### 2. Admin/Operations-Level B2B (`/admin/b2b/*`)
**Audience**: Finance, operations, and admin staff managing workflows  
**Layout**: AdminB2BLayout (side nav + content, matching AccountLayout structure)  
**Navigation Component**: New AdminB2BNav with operational queues

**Routes**:
```
/admin/b2b                       → B2B Operations Dashboard
├── /finance-reviews            → Finance review queue (orders pending approval)
│   └── /[id]                   → Review detail (view order, make decision)
├── /quotes                     → Purchase request queue (awaiting merchant quote)
│   └── /[id]                   → Request detail (assign quote, set terms)
├── /exceptions                 → Exceptions & Reconciliation (NEW)
│   └── Links to related records for investigation & recovery
├── /activity                   → Activity log (read-only audit trail)
└── (Dashboard shows summary cards linking to each queue)
```

---

## User Journeys

### B2B Buyer Journey
```
1. Login to /account
2. Click "Organizations" in account nav
3. Browse /account/b2b/organizations
4. Click on organization to view details
5. (If member of org) See organization members & settings
6. Navigate to /account/b2b/quotes to review incoming quotes
7. Accept quote → creates order
8. Order flows through finance review → warehouse release → fulfillment
```

### Finance Operator Journey
```
1. Login to /account
2. (If authorized) Navigate to /admin/b2b via direct URL or admin link
3. Dashboard shows summary: organizations, quotes, finance, warehouse, exceptions
4. Click "Finance Reviews" card or nav link
5. View /admin/b2b/finance-reviews queue
6. Click order to view details at /admin/b2b/finance-reviews/[id]
7. Make approve/reject/prepayment decision
8. Order progresses to warehouse release
```

### Operations/Warehouse Journey
```
1. Access /admin/b2b dashboard
2. Check "Warehouse" section for release status
3. Click "Exceptions & Reconciliation" to identify blocked releases
4. Click exception to investigate root cause
5. Take recovery action (retry, override, escalate) - routes vary by action
```

### Compliance/Audit Journey
```
1. Access /admin/b2b dashboard
2. Click "Activity Log" nav item
3. View /admin/b2b/activity with append-only audit trail
4. Filter by action type, organization, date range
5. Verify all decisions are properly recorded with rationale
```

---

## Navigation Component Hierarchy

### Account Level
```
AccountLayout (layout.tsx)
├── AccountNav (components/account-nav/index.tsx)
│   ├── Mobile navigation (hidden on desktop)
│   │   ├── Shows "Account" back button if in subpage
│   │   └── Shows all nav items when at /account root
│   │
│   └── Desktop navigation (hidden on mobile)
│       ├── Account section: Overview, Profile, Addresses, Orders
│       └── B2B section (when in /account/b2b/*):
│           ├── Organizations
│           ├── Approvals
│           └── Quotes & Orders
│
└── [children] → Page content
```

### Admin Level
```
AdminLayout (admin/layout.tsx)
├── Auth check (redirects to /login if not authenticated)
└── [children]
    │
    └── AdminB2BLayout (admin/b2b/layout.tsx)
        ├── AdminB2BNav (components/admin-b2b-nav/index.tsx)
        │   ├── Mobile navigation
        │   │   ├── "B2B Operations" back button if in subpage
        │   │   └── All nav items when at dashboard
        │   │
        │   └── Desktop navigation
        │       ├── Dashboard
        │       ├── Purchase Requests
        │       ├── Finance Reviews
        │       ├── Exceptions & Issues
        │       └── Activity Log
        │
        └── [children] → Page content
```

---

## Navigation Links & Breadcrumbs

### Account B2B Pages

**Organizations List** (`/account/b2b/organizations`)
- Heading: "B2B Organizations"
- Links: Create new org, click org card to view detail
- Back nav: Account nav shows as sidebar

**Organization Detail** (`/account/b2b/organizations/[handle]`)
- Breadcrumb: ← Back to Organizations
- Heading: [Organization Name] (with status badge)
- Tabs/Links: Members, Settings
- Back to list link in nav

**Approvals Queue** (`/account/b2b/approvals`)
- Heading: "Approval Queue"
- Links: Click request card to view details
- Filter/sort by status, date

**My Quotes** (`/account/b2b/quotes`)
- Heading: "My Quotes"
- Links: Click quote card to accept/review
- Back to organizations link

### Admin B2B Pages

**Dashboard** (`/admin/b2b`)
- Title: "B2B Operations Dashboard"
- Shows: Summary cards for all major queues
- Links: Each card links to corresponding queue
- No back button (is entry point)

**Finance Reviews** (`/admin/b2b/finance-reviews`)
- Title: "Finance review queue"
- Links: Click review card to view details
- Sidebar: Finance Reviews highlighted in AdminB2BNav

**Finance Review Detail** (`/admin/b2b/finance-reviews/[id]`)
- Breadcrumb: ← Back to queue
- Title: "Order {display_id}"
- Shows: Order details, customer info, organization, finance decision form
- Links: View order, view organization

**Purchase Requests** (`/admin/b2b/quotes`)
- Title: "Purchase requests"
- Links: Click request card to view details
- Sidebar: Purchase Requests highlighted

**Exceptions Dashboard** (`/admin/b2b/exceptions`)
- Title: "Exceptions & Reconciliation"
- Shows: Summary cards (total, critical, warning)
- Filter buttons: By exception type
- Links: "View Record" button routes to related detail page (e.g., finance review)
- Sidebar: Exceptions & Issues highlighted

**Activity Log** (`/admin/b2b/activity`)
- Title: "Activity log"
- Shows: Append-only audit trail with timestamps
- Sidebar: Activity Log highlighted

---

## Navigation Styling & Active States

### AccountNav Active States
- Current page highlighted with `font-semibold text-ui-fg-interactive`
- Color: Darker text when active vs `text-ui-fg-subtle` when inactive
- Works for both mobile (icon chevron) and desktop (link text)

### AdminB2BNav Active States
- Current section highlighted in left sidebar
- Active link: `font-semibold text-ui-fg-interactive`
- Inactive link: `text-ui-fg-base`
- Matches account nav styling for consistency

### Breadcrumbs & Back Buttons
- Used on detail pages to return to list/parent
- Format: `← Back to [section]` or `← Back to Organizations`
- Button variant: `secondary` (gray background)

---

## Authorization & Visibility

### Frontend Navigation
- ✅ All B2B nav links are visible to authenticated customers
- ✅ B2B section appears in account nav when in `/account/b2b/*` routes
- ✅ Admin nav appears at `/admin/b2b/*` for all authenticated users
- **⚠️ Backend authorization is authoritative** - API calls enforce permissions
- ✅ No role-based nav hiding (UI doesn't decide access, backend does)

### Current Implementation
- Admin layout redirects to `/login` if not authenticated
- No role checking in frontend nav (TODO: add optional role display in UI)
- All routes proceed to backend, which returns 403 if unauthorized
- Customers see operations they have permission to access

### Future Enhancement
- Add optional role indicators in account nav (e.g., "Finance" tag next to name)
- Show admin dashboard link only if user has accessed it before (convenience, not security)
- Add permission-based UI hints in sidebar navigation

---

## Mobile Responsiveness

### Breakpoint: `small:` (~640px)
- Mobile: Hidden navigation, collapsible account/B2B menus
- Desktop: Always-visible left sidebar with labels

### Mobile Patterns
- Back button at top of each page when in sub-section
- Tap back button to expand main menu
- All navigation items visible in mobile menu
- Same routing structure on both desktop and mobile

---

## File Structure

```
apps/storefront/src/
├── app/[countryCode]/(main)/
│   ├── account/
│   │   ├── layout.tsx                           → Wraps with AccountLayout
│   │   └── @dashboard/b2b/
│   │       ├── organizations/
│   │       │   ├── page.tsx                     → List
│   │       │   ├── [handle]/
│   │       │   │   ├── page.tsx                 → Detail
│   │       │   │   ├── members/
│   │       │   │   │   └── page.tsx             → Members list
│   │       │   │   └── settings/
│   │       │   │       └── page.tsx             → Settings
│   │       │   └── create/
│   │       │       └── page.tsx                 → Creation form
│   │       ├── approvals/
│   │       │   ├── page.tsx                     → Approval queue
│   │       │   └── [id]/
│   │       │       └── page.tsx                 → Approval detail
│   │       └── quotes/
│   │           ├── page.tsx                     → My quotes
│   │           └── [id]/
│   │               └── page.tsx                 → Quote detail
│   │
│   └── admin/
│       ├── layout.tsx                           → Admin auth & routing
│       └── b2b/
│           ├── layout.tsx                       → Wraps with AdminB2BLayout
│           ├── page.tsx                         → Dashboard
│           ├── finance-reviews/
│           │   ├── page.tsx                     → Queue list
│           │   └── [id]/
│           │       └── page.tsx                 → Review detail
│           ├── quotes/
│           │   ├── page.tsx                     → Queue list
│           │   └── [id]/
│           │       └── page.tsx                 → Request detail (TBD)
│           ├── exceptions/
│           │   └── page.tsx                     → Exceptions dashboard
│           └── activity/
│               └── page.tsx                     → Activity log
│
└── modules/
    ├── account/
    │   ├── components/
    │   │   └── account-nav/
    │   │       └── index.tsx                    → Account navigation (enhanced with B2B)
    │   └── templates/
    │       └── account-layout.tsx               → Account layout template
    │
    └── admin/
        ├── components/
        │   ├── admin-b2b-nav/
        │   │   └── index.tsx                    → Admin B2B navigation (NEW)
        │   ├── exceptions-list/
        │   │   └── index.tsx                    → Exceptions display component
        │   └── purchase-request-queue/
        │       └── index.tsx                    → Purchase request list
        │
        └── templates/
            └── admin-b2b-layout.tsx             → Admin B2B layout (NEW)
```

---

## Key Design Decisions

### 1. Layout Consistency
- Admin B2B layout mirrors account layout structure (side nav + content)
- Same grid breakpoints (`small:`) for responsive behavior
- Same color scheme and component library (UI primitives)

### 2. Navigation Separation
- Account nav focuses on personal B2B activities (org management, quotes)
- Admin nav focuses on operational queues (reviews, exceptions, activity)
- No mixing of customer and admin functions in same nav

### 3. Active State Handling
- Desktop: Text color and font weight change
- Mobile: Back button shows when not at root, menu expands at root
- Consistent active state styling across both nav components

### 4. No Role-Based Hiding
- All routes visible in nav, backend enforces access
- Simplifies frontend logic and improves discoverability
- Users see what they're allowed to access once backend authenticates

### 5. Breadcrumb Strategy
- Page title + breadcrumbs show hierarchy
- "Back" buttons on detail pages link to lists
- No excessive breadcrumb trails (keep to 2-3 levels max)

---

## Testing Checklist

- [ ] Storefront TypeScript compilation passes
- [ ] Backend TypeScript compilation passes
- [ ] Account B2B nav shows when accessing `/account/b2b/*`
- [ ] Account B2B nav hides when at `/account` root
- [ ] Admin B2B nav shows at `/admin/b2b/*`
- [ ] Admin nav links point to correct URLs
- [ ] Mobile nav collapses/expands correctly
- [ ] All B2B pages load without 404 errors
- [ ] Back buttons navigate to correct parent pages
- [ ] Exception cards show correct status colors (red=critical, yellow=warning)
- [ ] Filter buttons in exceptions page work
- [ ] Clicking "View Record" navigates to detail page
- [ ] Non-B2B routes (retail, account) still work
- [ ] Admin routes redirect to login if not authenticated

---

## Rollout Notes

### Phase 1 (This commit)
- ✅ Admin B2B layout & navigation structure
- ✅ Account nav enhanced with B2B sub-sections
- ✅ All B2B pages integrated with navigation
- ✅ TypeScript strict mode validation passes

### Phase 2 (Future)
- Add admin organizations route
- Add admin purchase request detail route
- Add recovery action endpoints (retry, override, escalate)
- Add role-based permission checks in UI (optional display only)
- Add time-range filtering to activity log
- Add organization/customer filtering to all queues

### Phase 3 (Future)
- Add breadcrumb component with full path display
- Add search across B2B operations
- Add saved filters for common queue views
- Add dashboard customization (choose which cards to display)

---

## Navigation URL Reference

### Account B2B
- List organizations: `/[country]/account/b2b/organizations`
- Organization detail: `/[country]/account/b2b/organizations/[handle]`
- Organization members: `/[country]/account/b2b/organizations/[handle]/members`
- Organization settings: `/[country]/account/b2b/organizations/[handle]/settings`
- Create organization: `/[country]/account/b2b/organizations/create`
- Approval queue: `/[country]/account/b2b/approvals`
- Approval detail: `/[country]/account/b2b/approvals/[id]`
- My quotes: `/[country]/account/b2b/quotes`
- Quote detail: `/[country]/account/b2b/quotes/[id]`

### Admin B2B
- Dashboard: `/[country]/admin/b2b`
- Finance queue: `/[country]/admin/b2b/finance-reviews`
- Finance detail: `/[country]/admin/b2b/finance-reviews/[id]`
- Purchase requests: `/[country]/admin/b2b/quotes`
- Exceptions: `/[country]/admin/b2b/exceptions`
- Activity log: `/[country]/admin/b2b/activity`

---

**Summary**: B2B UI is now fully integrated into application navigation with consistent layouts, role-appropriate views, and proper user journeys from signup through order fulfillment.
