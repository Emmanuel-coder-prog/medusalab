# B2B Organization Selection and Cart Context UI - Test Report

## Test Environment
- **Date**: 2026-08-18
- **Platform**: Medusa v2.17.0 (backend) + Next.js 15 + React 19 (storefront)
- **Region**: Multi-region support via country code routing
- **Authentication**: JWT token via `_medusa_jwt` cookie

## Test Scenarios

### Scenario 1: Customer with NO Organizations
**Setup**: Authenticated customer with no B2B organization memberships
**Expected Behavior**:
- [ ] Cart page loads without errors
- [ ] Organization selector is NOT displayed (organizations.length === 0)
- [ ] Regular retail cart experience continues
- [ ] No B2B context is created

**Test Steps**:
1. Sign in as customer with no B2B organizations
2. Add product to cart
3. Navigate to /cart
4. Verify no organization selector appears
5. Verify checkout flow works normally

**Result**: _______________

---

### Scenario 2: Customer with ONE Organization
**Setup**: Authenticated customer belonging to exactly one B2B organization (ACTIVE status)
**Expected Behavior**:
- [ ] Cart page loads successfully
- [ ] Organization selector displays the single organization
- [ ] "Switch" button is hidden (no other orgs to switch to)
- [ ] Display shows: organization name, handle, user's role
- [ ] Selecting the organization attaches it to the cart
- [ ] B2B cart context is created (context.action === "selected")
- [ ] Subsequent cart views show organization as selected
- [ ] Purchase workflow is enabled

**Test Steps**:
1. Sign in as customer with one B2B organization membership
2. Verify member status is ACTIVE
3. Add product to cart
4. Navigate to /cart
5. Verify organization selector shows organization details
6. Click "Select Organization" button
7. Verify organization is selected and modal closes
8. Verify organization remains selected on page refresh
9. Verify "Switch" button is not visible

**Result**: _______________

---

### Scenario 3: Customer with MULTIPLE Organizations
**Setup**: Authenticated customer belonging to 3+ B2B organizations (all ACTIVE)
**Expected Behavior**:
- [ ] Cart page loads successfully
- [ ] Organization selector displays all organizations
- [ ] "Switch" button is visible when organization is selected
- [ ] Can switch between organizations when cart is not yet assigned
- [ ] Cannot switch if cart is already assigned to a different organization
- [ ] Switching creates new context or reuses existing one
- [ ] Error message appears if attempting to switch assigned cart

**Test Steps**:
1. Sign in as customer with 3 B2B organizations
2. Verify all memberships are ACTIVE
3. Navigate to /cart
4. Verify all 3 organizations are shown in selector
5. Select first organization (Org A)
6. Verify Org A is selected and marked with checkmark
7. Click "Switch" button
8. Select second organization (Org B)
9. Verify Org B is now selected
10. Attempt to select third organization (Org C)
11. Verify organization switches successfully

**Result**: _______________

---

### Scenario 4: Switching Organizations Requires New Cart
**Setup**: Customer with multiple organizations; first cart is assigned to Org A
**Expected Behavior**:
- [ ] First cart is assigned to Org A
- [ ] Attempting to select Org B throws: "This cart is already assigned to another organization"
- [ ] Error is displayed in UI
- [ ] User can create a new cart to use Org B
- [ ] Old cart remains attached to Org A
- [ ] New cart is available for Org B context

**Test Steps**:
1. Sign in as customer with 2 organizations (Org A, Org B)
2. Add product to cart
3. Select Org A
4. Verify cart is attached to Org A (context.action === "selected")
5. (New cart would be created externally, simulating user scenario)
6. In new cart, select Org B
7. Verify new cart is attached to Org B
8. Verify old cart still shows Org A context
9. Verify both carts exist independently

**Result**: _______________

---

### Scenario 5: Suspended Organization
**Setup**: Customer with membership to a SUSPENDED organization
**Expected Behavior**:
- [ ] Organization is NOT displayed in selector (filtered by ACTIVE status)
- [ ] Error message: "Organization not found or is not active" if forced selection
- [ ] User cannot select suspended organization
- [ ] Cart remains empty or unattached to B2B flow

**Test Steps**:
1. Sign in as customer with one active org and one suspended org
2. Navigate to /cart
3. Verify only active organization appears in selector
4. Verify suspended organization is not shown
5. Attempt direct API call to select suspended org (POST /api/b2b/carts/{id}/organization)
6. Verify API returns 404 with error message

**Result**: _______________

---

### Scenario 6: Archived Organization
**Setup**: Customer with membership to an ARCHIVED organization
**Expected Behavior**:
- [ ] Organization is NOT displayed in selector (filtered by status)
- [ ] Cannot be selected via API (backend rejects)
- [ ] Only active organizations are available

**Test Steps**:
1. Sign in as customer with archived organization
2. Navigate to /cart
3. Verify archived org does not appear
4. Verify only active orgs are shown
5. Attempt API selection of archived org
6. Verify error response

**Result**: _______________

---

### Scenario 7: Unauthenticated Customer
**Setup**: Visitor not signed in
**Expected Behavior**:
- [ ] Cart page loads normally
- [ ] Organization selector is NOT displayed
- [ ] No B2B context is created
- [ ] Regular retail cart works
- [ ] No errors in console

**Test Steps**:
1. Clear all cookies/auth tokens
2. Navigate to /cart
3. Verify organization selector doesn't appear
4. Verify cart displays empty or retail-mode
5. Verify retail checkout flow available

**Result**: _______________

---

### Scenario 8: Load State Display
**Setup**: Network is slow or API is slow to respond
**Expected Behavior**:
- [ ] "Loading..." text displayed when selectOrganization is in progress
- [ ] "Select Organization" button is disabled during load
- [ ] Modal is not closable during request
- [ ] User cannot submit duplicate requests
- [ ] Spinner or loading indicator is visible

**Test Steps**:
1. Open Network tab in DevTools (throttle network to "slow 3G")
2. Sign in with B2B organization
3. Navigate to /cart
4. Click "Select Organization" button
5. Observe "Loading..." state and disabled buttons
6. Wait for response
7. Verify loading state clears
8. Verify organization is selected

**Result**: _______________

---

### Scenario 9: Error Handling - Network Failure
**Setup**: Network request fails (simulate via Network tab)
**Expected Behavior**:
- [ ] Error message appears in UI
- [ ] Error message is user-friendly
- [ ] Modal remains open, user can retry
- [ ] No silent failures
- [ ] "Select Organization" button becomes enabled again

**Test Steps**:
1. Open DevTools Network tab
2. Select Offline mode
3. Sign in with B2B organization
4. Navigate to /cart
5. Attempt to select organization
6. Observe error message displayed
7. Turn offline mode off
8. Click button to retry selection
9. Verify organization is selected on retry

**Result**: _______________

---

### Scenario 10: Error Handling - Unauthorized Organization
**Setup**: Customer attempts to select organization they don't belong to
**Expected Behavior**:
- [ ] API returns 403 UNAUTHORIZED
- [ ] Error message: "You do not have permission for this organization"
- [ ] Organization is not selected
- [ ] User remains on organization selector

**Test Steps**:
1. Intercept network request to `/api/b2b/carts/{id}/organization`
2. Manually modify organization_id to fake ID
3. Attempt selection
4. Observe API error response (403)
5. Verify error is displayed in modal
6. Verify organization was not selected
7. User can try a different organization

**Result**: _______________

---

### Scenario 11: Already Selected Organization (Idempotent)
**Setup**: User selects same organization twice
**Expected Behavior**:
- [ ] First selection succeeds (action === "selected")
- [ ] Second selection of same org returns action === "already_selected"
- [ ] No duplicate context created
- [ ] No error
- [ ] Modal closes normally

**Test Steps**:
1. Sign in with B2B organization
2. Navigate to /cart
3. Select organization A
4. Verify it's selected
5. Open selector again
6. Click select on same organization
7. Verify no error
8. Verify organization remains selected
9. Verify modal closes

**Result**: _______________

---

### Scenario 12: Cart Context Persistence Across Page Reloads
**Setup**: Organization is selected, then page is refreshed
**Expected Behavior**:
- [ ] B2B cart context is saved to cookie (`_medusa_b2b_cart_context`)
- [ ] After page reload, organization remains selected
- [ ] No need to re-select organization
- [ ] Cart context persists for 7 days (or session)

**Test Steps**:
1. Sign in with B2B organization
2. Navigate to /cart
3. Select organization
4. Verify organization is selected
5. Refresh page (Ctrl+R)
6. Verify organization is still selected (from cookie)
7. Check cookies in DevTools - verify `_medusa_b2b_cart_context` exists
8. Parse cookie value - verify cartId and organizationId are present

**Result**: _______________

---

### Scenario 13: Sales Channel Mismatch
**Setup**: Organization is on different sales channel than cart
**Expected Behavior**:
- [ ] Backend rejects with error: "Cart sales channel does not match this organization"
- [ ] API returns 400 INVALID_DATA
- [ ] Error appears in UI
- [ ] Organization is not selected
- [ ] This situation shouldn't happen in normal flow (same publishable key handles filtering)

**Test Steps**:
1. (Admin setup: Create org on sales channel A, create cart on sales channel B)
2. Attempt to select org via API
3. Verify error response (400)
4. Verify error message is clear
5. Verify no context is created

**Result**: _______________

---

### Scenario 14: Member Status Validation
**Setup**: Customer is member of organization but with non-ACTIVE status (INVITED, SUSPENDED, REMOVED)
**Expected Behavior**:
- [ ] INVITED member: Cannot select organization (API returns 403)
- [ ] SUSPENDED member: Cannot select organization (API returns 403)
- [ ] REMOVED member: Cannot select organization (API returns 403)
- [ ] Only ACTIVE members can select

**Test Steps**:
1. Setup: Create customer with non-ACTIVE membership
2. Sign in
3. Attempt to select organization
4. Verify API returns 403 UNAUTHORIZED
5. Verify error message: "You are not an active member of this organization"
6. (Repeat with each status: INVITED, SUSPENDED, REMOVED)

**Result**: _______________

---

### Scenario 15: Role Display Correctness
**Setup**: Customer is member with different roles (OWNER, BUYER, APPROVER, FINANCE, VIEWER)
**Expected Behavior**:
- [ ] Each organization shows correct role in selector (Owner, Buyer, Approver, Finance, Viewer)
- [ ] Role labels are user-friendly
- [ ] Role is displayed in organization selector dropdown
- [ ] Role is displayed in selected organization display

**Test Steps**:
1. Setup: Create customer with multiple org memberships at different roles
2. Sign in
3. Navigate to /cart
4. Verify each organization shows correct role label
5. Open selector modal
6. Verify role labels are correct for each org
7. Select organization
8. Verify role is displayed in "Currently selected" section

**Result**: _______________

---

### Scenario 16: Organization Display Information
**Setup**: Organizations with various display_name, legal_name, handle values
**Expected Behavior**:
- [ ] display_name is shown prominently
- [ ] handle is shown as secondary identifier
- [ ] legal_name is NOT shown in selector (shown on org detail page, not cart context)
- [ ] Status badge shows ACTIVE/SUSPENDED/ARCHIVED
- [ ] Status color coding matches design (green for ACTIVE)

**Test Steps**:
1. Create organizations with varied names
2. Sign in
3. Navigate to /cart
4. Verify display_name is shown
5. Verify handle is shown
6. Verify status badge is visible
7. Verify color is green (for ACTIVE)

**Result**: _______________

---

### Scenario 17: Modal Backdrop Click Closes Modal
**Setup**: Organization selector modal is open
**Expected Behavior**:
- [ ] Clicking outside modal (on backdrop) closes it
- [ ] Modal state is reset
- [ ] User can reopen modal
- [ ] No changes are made

**Test Steps**:
1. Open organization selector modal
2. Click on backdrop/overlay
3. Verify modal closes
4. Verify organization selection didn't change
5. Verify user can click button to reopen modal

**Result**: _______________

---

### Scenario 18: Cancel Button Functionality
**Setup**: Organization selector modal is open
**Expected Behavior**:
- [ ] Clicking Cancel button closes modal
- [ ] Modal state is reset
- [ ] No changes are made
- [ ] Same as backdrop click

**Test Steps**:
1. Open modal
2. Click Cancel button
3. Verify modal closes
4. Verify no changes were made

**Result**: _______________

---

### Scenario 19: Keyboard Navigation
**Setup**: Organization selector modal is open
**Expected Behavior**:
- [ ] Pressing Escape key closes modal
- [ ] Tab key navigates between organizations and buttons
- [ ] Enter key selects focused organization
- [ ] Arrow keys scroll through organization list (if scrollable)

**Test Steps**:
1. Open modal
2. Press Escape
3. Verify modal closes
4. Open modal again
5. Press Tab multiple times
6. Verify focus moves through selectable items
7. Press Enter on focused organization
8. Verify organization is selected

**Result**: _______________

---

### Scenario 20: Accessibility - Screen Reader
**Setup**: Screen reader is enabled (NVDA, JAWS, VoiceOver)
**Expected Behavior**:
- [ ] All text is announced properly
- [ ] Button purposes are clear
- [ ] Organization names are announced
- [ ] Selected state is communicated
- [ ] Status and role information is announced
- [ ] Error messages are announced
- [ ] Loading state is communicated

**Test Steps**:
1. Enable screen reader
2. Navigate to cart page
3. Verify organization selector is announced
4. Open modal
5. Verify each organization is announced with details
6. Verify buttons are announced
7. Verify selected state is communicated
8. Trigger error condition
9. Verify error is announced

**Result**: _______________

---

### Scenario 21: Mobile Responsive Design
**Setup**: Test on mobile viewport (iPhone 12)
**Expected Behavior**:
- [ ] Organization selector fits screen
- [ ] Modal is readable and usable
- [ ] Touch targets are large enough (44px+)
- [ ] No horizontal scroll needed
- [ ] Text is legible
- [ ] Buttons are easily tappable

**Test Steps**:
1. Open DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Select iPhone 12 preset
4. Navigate to /cart
5. Verify selector layout
6. Verify text is readable
7. Open modal
8. Tap to select organization
9. Verify all interactions work
10. Test on landscape orientation

**Result**: _______________

---

### Scenario 22: Dark Mode Compatibility
**Setup**: System is set to dark mode
**Expected Behavior**:
- [ ] Organization selector is visible in dark mode
- [ ] Colors are appropriate for dark mode
- [ ] Text contrast is sufficient
- [ ] Status badges are visible
- [ ] No illegible text

**Test Steps**:
1. Enable dark mode in system settings
2. Navigate to /cart
3. Verify selector displays correctly
4. Verify colors are adjusted
5. Verify text contrast is good
6. Open modal
7. Verify modal is readable
8. Verify selections work

**Result**: _______________

---

## Security Tests

### Security Test 1: CSRF Protection
**Expected**: All POST requests require CSRF token or proper authentication
**Result**: _______________

### Security Test 2: XSS Prevention
**Expected**: Organization names/handles are sanitized before display
**Result**: _______________

### Security Test 3: Authorization Check
**Expected**: Backend always validates customer owns cart and is member of organization
**Result**: _______________

### Security Test 4: No Organization Data Leakage
**Expected**: Unauthenticated requests return 401, no org data is exposed
**Result**: _______________

---

## Performance Tests

### Performance Test 1: Selection Speed
**Expected**: Organization selection completes within 1 second
**Actual**: _______________

### Performance Test 2: Page Load with Selector
**Expected**: Cart page loads within 2 seconds
**Actual**: _______________

### Performance Test 3: Modal Render Time
**Expected**: Modal renders and becomes interactive within 300ms
**Actual**: _______________

---

## Browser Compatibility

- [ ] Chrome/Chromium (Latest)
- [ ] Firefox (Latest)
- [ ] Safari (Latest)
- [ ] Edge (Latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

---

## Implementation Checklist

### Backend Integration (Verify)
- [ ] POST /store/customers/me/b2b/carts/:id/organization endpoint exists and works
- [ ] selectOrganizationForCart workflow validates all requirements
- [ ] Error responses are consistent and helpful
- [ ] B2BCartContext is created with correct data

### Frontend Components
- [ ] B2BCartContextWrapper component created and exported
- [ ] useB2BCartContext hook created and works correctly
- [ ] OrganizationSelector component displays correctly
- [ ] OrganizationSelectorModal is functional
- [ ] Error states are displayed

### Data Functions
- [ ] listB2BOrganizations() works
- [ ] selectOrganizationForCart() calls correct endpoint
- [ ] getB2BCartContextFromCookie() retrieves context
- [ ] saveB2BCartContext() saves to cookie

### API Route
- [ ] /api/b2b/carts/[cartId]/organization POST route works
- [ ] Authentication via cookies is handled
- [ ] Error responses are mapped correctly
- [ ] Context is saved to cookie

### Pages & Routes
- [ ] /cart page includes B2BCartWrapper
- [ ] Organizations are loaded and passed
- [ ] Current context is retrieved and passed
- [ ] Layout renders without errors

### Styles & UI
- [ ] Organization selector displays properly
- [ ] Modal styling matches design system
- [ ] Status colors are applied correctly
- [ ] Loading states are visible
- [ ] Error messages are clear

### State Management
- [ ] B2BCartContext provides correct state
- [ ] selectOrganization updates state correctly
- [ ] clearSelection works
- [ ] setCartContext works
- [ ] Errors are tracked and displayed

### Cookies
- [ ] _medusa_b2b_cart_context cookie is set
- [ ] Cookie persists for 7 days
- [ ] Cookie is httpOnly and secure
- [ ] Cookie is cleared when needed

---

## Summary

**Total Test Scenarios**: 22 core + 4 security + 3 performance
**Status**: Ready for execution
**Notes**: All scenarios should pass before deploying to production

---

## Approved By
Date: _______________
Tester: _______________
QA Lead: _______________
