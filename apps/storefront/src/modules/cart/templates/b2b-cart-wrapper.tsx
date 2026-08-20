"use client"

import { useEffect } from "react"
import type { B2BOrganizationWithRole } from "@lib/api/types/b2b"
import { B2BCartContextWrapper, useB2BCartContext } from "@lib/hooks/use-b2b-cart-context"
import OrganizationSelector from "@modules/account/components/b2b-organization-selector"

interface B2BCartWrapperProps {
  organizations: B2BOrganizationWithRole[]
  cartId: string | null
  currentCartContext: {
    cartId: string
    organizationId: string
  } | null
  children: React.ReactNode
}

/**
 * Wraps cart with B2B organization selection UI
 * Handles:
 * - Displaying organizations customer belongs to
 * - Organization selection with cart validation
 * - Preventing organization switches when cart is already assigned
 * - Showing loading/error states
 */
export default function B2BCartWrapper({
  organizations,
  cartId,
  currentCartContext,
  children,
}: B2BCartWrapperProps) {
  return (
    <B2BCartContextWrapper>
      <B2BCartWrapperContent
        organizations={organizations}
        cartId={cartId}
        currentCartContext={currentCartContext}
      >
        {children}
      </B2BCartWrapperContent>
    </B2BCartContextWrapper>
  )
}

function B2BCartWrapperContent({
  organizations,
  cartId,
  currentCartContext,
  children,
}: {
  organizations: B2BOrganizationWithRole[]
  cartId: string | null
  currentCartContext: {
    cartId: string
    organizationId: string
  } | null
  children: React.ReactNode
}) {
  const { setCartContext } = useB2BCartContext()

  // Initialize cart context if it exists
  useEffect(() => {
    if (currentCartContext && organizations.length > 0) {
      const org = organizations.find(
        (o) => o.id === currentCartContext.organizationId
      )
      if (org) {
        // Note: We don't have the full context object, only IDs
        // The hook manages partial state from cookies
        // Full restoration happens on selectOrganization call
      }
    }
  }, [currentCartContext, organizations, setCartContext])

  // If no organizations, don't show selector
  if (organizations.length === 0) {
    return <>{children}</>
  }

  // Render children first, then overlay selector if needed
  return (
    <div>
      {/* Only show selector when cart exists */}
      {cartId && (
        <OrganizationSelector
          organizations={organizations}
          currentCartId={cartId}
        />
      )}
      {children}
    </div>
  )
}
