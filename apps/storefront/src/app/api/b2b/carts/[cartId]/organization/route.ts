import { NextRequest, NextResponse } from "next/server"
import { selectOrganizationForCart } from "@lib/data/b2b"
import { setB2BCartContext } from "@lib/data/cookies"
import type { B2BOrganizationWithRole } from "@lib/api/types/b2b"

/**
 * POST /api/b2b/carts/[cartId]/organization
 * 
 * Server-side wrapper around the B2B organization selection endpoint.
 * This ensures:
 * 1. Authentication is handled via cookies
 * 2. Cart ownership is validated by backend
 * 3. Organization membership is verified
 * 4. Cart context is saved to cookie for client state
 * 
 * Request body: { organization_id: string }
 * Response: { context: B2BCartContext, action: "selected" | "already_selected" }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ cartId: string }> }
) {
  try {
    const { cartId } = await params
    const body = await request.json()
    const { organization_id } = body

    if (!cartId || !organization_id) {
      return NextResponse.json(
        { error: "Missing cartId or organization_id" },
        { status: 400 }
      )
    }

    // Call backend API to select organization for cart
    // This validates:
    // - Customer is authenticated
    // - Cart belongs to customer
    // - Organization is ACTIVE
    // - Customer is ACTIVE member of organization
    // - Cart sales channel matches organization sales channel
    // - Cart is not already assigned to a different organization
    const result = await selectOrganizationForCart(cartId, organization_id)

    // Save to cookie for client-side state management
    // Note: We don't have the organization object here, but we have the context
    await setB2BCartContext(cartId, organization_id)

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error("B2B cart organization selection error:", error)

    // Check if it's a known error from the backend
    if (error instanceof Error) {
      // Parse error message to provide better client feedback
      if (error.message.includes("UNAUTHORIZED")) {
        return NextResponse.json(
          { error: "You do not have permission for this organization" },
          { status: 403 }
        )
      }
      if (error.message.includes("NOT_FOUND")) {
        return NextResponse.json(
          { error: "Organization not found or is not active" },
          { status: 404 }
        )
      }
      if (error.message.includes("INVALID_DATA")) {
        return NextResponse.json(
          { error: "This cart is already assigned to another organization" },
          { status: 409 }
        )
      }

      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Failed to select organization" },
      { status: 500 }
    )
  }
}
