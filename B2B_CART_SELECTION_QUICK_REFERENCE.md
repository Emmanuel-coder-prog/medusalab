# B2B Organization Selection - Quick Reference

## What Was Built

A complete B2B organization selection and cart context system that allows authenticated customers to:
1. View their B2B organizations
2. Select an organization to attach to their cart
3. See their selected organization in the cart
4. Safely switch organizations (only when cart is not yet assigned)

## Key Files & Their Purpose

```
Frontend (Storefront)
├── 📁 lib/
│   ├── 📁 data/
│   │   ├── b2b.ts          ← Server functions to call backend APIs
│   │   └── cookies.ts       ← Cookie functions for B2B context
│   ├── 📁 hooks/
│   │   └── use-b2b-cart-context.tsx  ← React hook + context provider
│   ├── 📁 api/types/
│   │   └── b2b.ts          ← TypeScript type definitions (updated)
│   └── 📁 api/components/
│       └── *               ← Uses existing UI components
├── 📁 app/api/b2b/
│   └── carts/[cartId]/organization/route.ts  ← API route handler
├── 📁 modules/
│   ├── account/components/
│   │   └── b2b-organization-selector/  ← Organization selector UI
│   └── cart/templates/
│       └── b2b-cart-wrapper.tsx        ← Cart page wrapper
└── 📁 app/[countryCode]/(main)/cart/
    └── page.tsx            ← Cart page (updated to use wrapper)
```

## How It Works (User Flow)

```
1. Customer authenticates
   └─→ JWT token in _medusa_jwt cookie

2. Customer visits /cart page
   └─→ Server fetches: listB2BOrganizations()
   └─→ Server fetches: getB2BCartContextFromCookie()
   └─→ Page wrapped with B2BCartWrapper

3. OrganizationSelector component renders
   └─→ If no orgs: nothing shown
   └─→ If 1 org: shows org name + "Select Organization" button
   └─→ If 2+ orgs: shows selected org + "Switch" button

4. Customer clicks "Select Organization"
   └─→ Modal opens showing available orgs

5. Customer clicks org in modal
   └─→ selectOrganization() from useB2BCartContext hook called
   └─→ Sends: POST /api/b2b/carts/{cartId}/organization
   └─→ API route calls: selectOrganizationForCart() server function
   └─→ Server function calls: POST /store/customers/me/b2b/carts/{id}/organization
   └─→ Backend validates everything (auth, membership, status, etc.)
   └─→ Backend returns: { context, action: "selected"|"already_selected" }
   └─→ API route saves to cookie: _medusa_b2b_cart_context
   └─→ Hook updates state
   └─→ Component re-renders showing selected org

6. Context persists
   └─→ On page reload: cookie is read
   └─→ Organization is restored from state
   └─→ No need to re-select
```

## Component Hierarchy

```
B2BCartWrapper (Server Component)
  ├─ Receives: organizations[], cartId, currentCartContext
  └─ Renders:
      └─ B2BCartContextWrapper (Client Context Provider)
          └─ B2BCartWrapperContent (Client Component)
              ├─ OrganizationSelector
              │   └─ Modal when clicked (with useB2BCartContext)
              └─ CartTemplate (existing)
```

## Key Types

```typescript
// What useB2BCartContext provides
{
  selectedOrganization: B2BOrganizationWithRole | null
  cartContext: B2BCartContext | null
  isLoading: boolean
  error: string | null
  selectOrganization: (org, cartId) => Promise<{context, action}>
  clearSelection: () => void
  setCartContext: (org, context) => void
}

// B2B Cart Context cookie structure
{
  cartId: string        // Which cart is this context for
  organizationId: string // Which org is selected
}
```

## API Endpoints

### Frontend Calls Backend Via
```
POST /api/b2b/carts/[cartId]/organization
  ← Frontend (from useB2BCartContext hook)
    ← Server (from API route handler)
      ← Backend: POST /store/customers/me/b2b/carts/{id}/organization
        - Validates: auth, cart ownership, org membership
        - Returns: { context, action }
```

## Error Cases & Messages

| Situation | Backend Error | User Sees | Fix |
|-----------|---------------|-----------|-----|
| Not signed in | 401 | "Not authenticated" | Sign in |
| Org doesn't exist | 404 | "Organization not found or is not active" | Try different org |
| Not a member | 403 | "You do not have permission" | Join organization |
| Member status not ACTIVE | 403 | "You do not have permission" | Accept invitation |
| Org suspended/archived | 404 | "Organization not found" | Use active org |
| Cart assigned to diff org | 409 | "Cart already assigned to another org" | Create new cart |
| Network error | - | "Unknown error occurred" | Retry |

## Testing Checklist

**Must Test**:
- [ ] No organizations → selector not shown
- [ ] 1 organization → "Select" button, no "Switch"
- [ ] 2+ organizations → selector works, can switch
- [ ] After selection → org persists on reload
- [ ] Can't switch if assigned → error shown
- [ ] Suspended/archived → not shown
- [ ] Loading state → "Loading..." text
- [ ] Error handling → error messages clear
- [ ] Mobile view → works on small screens
- [ ] Dark mode → looks good
- [ ] Keyboard nav → Escape closes, Tab works
- [ ] Screen reader → announces properly

## Common Tasks

### Want to test organization selection locally?
1. Ensure backend is running
2. Sign in with account that has B2B orgs
3. Navigate to `/cart`
4. Organization selector should appear
5. Click "Select Organization"
6. Choose an org
7. Verify it's selected

### Want to add new organization to user (admin)?
1. Backend admin operation (not in this scope)
2. Once added, storefront will show it

### Want to handle new B2B flow in checkout?
1. Check if `useB2BCartContext().selectedOrganization` exists
2. Apply B2B pricing/terms
3. Route to B2B checkout flow

### Want to handle organization switching elsewhere?
1. Import and use `useB2BCartContext()` hook
2. Call `selectOrganization(org, cartId)`
3. Hook handles state, loading, errors
4. Component re-renders on success

## Known Limitations

1. **No member management UI yet** - Backend APIs don't exist for:
   - Inviting members
   - Updating roles
   - Removing members
   - These would need backend implementation first

2. **Single cart assignment** - Once a cart is assigned to an org, it cannot switch. This is by design (data integrity). To use different org, must create new cart.

3. **No organization creation UI** - Backend has no POST endpoint to create orgs from storefront. This would need backend implementation.

## Files Changed (Summary)

```
Created (NEW):
  - use-b2b-cart-context.tsx        (~145 lines) - React Context + Hook
  - b2b-organization-selector/      (~210 lines) - UI Component
  - b2b-cart-wrapper.tsx            (~130 lines) - Cart Page Wrapper
  - api/b2b/carts/[cartId]/organization/route.ts  (~85 lines) - API Route
  - B2B_CART_SELECTION_TEST_PLAN.md  (~800 lines) - Test Plan
  - B2B_CART_SELECTION_IMPLEMENTATION.md (~500 lines) - Documentation

Modified (UPDATED):
  - lib/data/b2b.ts                 (+50 lines)   - New functions
  - lib/data/cookies.ts             (+40 lines)   - Cookie functions
  - lib/api/types/b2b.ts            (+8 lines)    - Type updates
  - cart/page.tsx                   (+8 lines)    - B2B integration

Total New Code: ~1,900 lines
Total Modified: ~106 lines
```

## Deployment Checklist

Before deploying to production:

- [ ] All test scenarios pass (22 core + security + performance)
- [ ] Backend selectOrganizationForCart endpoint is stable
- [ ] Error messages are customer-friendly
- [ ] Mobile and dark mode tested
- [ ] Accessibility tested with screen reader
- [ ] Performance meets targets (<1s selection time)
- [ ] Security review completed
- [ ] Documentation is updated
- [ ] Monitoring/logging configured
- [ ] Rollback plan documented

## Quick Start for New Developer

1. **Find the code**:
   - UI: `/src/modules/account/components/b2b-organization-selector/`
   - Hook: `/src/lib/hooks/use-b2b-cart-context.tsx`
   - Server functions: `/src/lib/data/b2b.ts`
   - API route: `/src/app/api/b2b/carts/[cartId]/organization/route.ts`

2. **Understand the flow**:
   - Read: B2B_CART_SELECTION_IMPLEMENTATION.md
   - Review: API route handler (explains the validation flow)
   - Check: Test plan for all scenarios

3. **Make changes**:
   - UI components: `/b2b-organization-selector/index.tsx`
   - Logic: `/use-b2b-cart-context.tsx`
   - Backend calls: `/lib/data/b2b.ts`
   - Styling: Tailwind CSS in components

4. **Test locally**:
   - Sign in with B2B account
   - Go to `/cart`
   - Try selecting/switching organizations
   - Check DevTools for network calls
   - Verify cookie is set

## Support

**Questions about implementation?**
- See: B2B_CART_SELECTION_IMPLEMENTATION.md (full architecture)
- See: B2B_CART_SELECTION_TEST_PLAN.md (test scenarios)
- Check: Component JSDoc comments
- Search: Error messages (provide clues)

**Issues?**
- Check error message (user-friendly)
- Check console logs (development debug)
- Review: selectOrganizationForCart backend workflow
- Test: with different org statuses/member roles

---

**Status**: ✅ Ready for use  
**Last Updated**: 2026-08-18  
**Version**: 1.0
