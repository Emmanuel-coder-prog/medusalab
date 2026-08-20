"use client"

import { createContext, useContext, useState, useCallback } from "react"
import type { B2BOrganizationWithRole, B2BCartContext } from "@lib/api/types/b2b"

interface B2BCartContextValue {
  selectedOrganization: B2BOrganizationWithRole | null
  cartContext: B2BCartContext | null
  isLoading: boolean
  error: string | null

  /**
   * Select an organization for the current cart
   * Will throw if cart already has a different organization assigned
   */
  selectOrganization: (
    organization: B2BOrganizationWithRole,
    cartId: string
  ) => Promise<{ context: B2BCartContext; action: "selected" | "already_selected" }>

  /**
   * Clear the selected organization (used when creating a new cart)
   */
  clearSelection: () => void

  /**
   * Set cart context from server response
   */
  setCartContext: (organization: B2BOrganizationWithRole, context: B2BCartContext) => void
}

const B2BCartContextProvider = createContext<B2BCartContextValue | undefined>(
  undefined
)

export function B2BCartContextWrapper({ children }: { children: React.ReactNode }) {
  const [selectedOrganization, setSelectedOrganization] =
    useState<B2BOrganizationWithRole | null>(null)
  const [cartContext, setCartContextState] =
    useState<B2BCartContext | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectOrganization = useCallback(
    async (
      organization: B2BOrganizationWithRole,
      cartId: string
    ): Promise<{ context: B2BCartContext; action: "selected" | "already_selected" }> => {
      setIsLoading(true)
      setError(null)

      try {
        // Call API route which will handle:
        // 1. Server-side authentication via cookies
        // 2. Calling backend selectOrganizationForCart
        // 3. Saving to cookie
        // 4. Returning response
        const response = await fetch(
          `/api/b2b/carts/${cartId}/organization`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ organization_id: organization.id }),
          }
        )

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: response.statusText }))
          const message = errorData.error || `Failed to select organization: ${response.statusText}`
          setError(message)
          throw new Error(message)
        }

        const result = await response.json()
        setSelectedOrganization(organization)
        setCartContextState(result.context)

        return result
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error occurred"
        setError(message)
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  const clearSelection = useCallback(() => {
    setSelectedOrganization(null)
    setCartContextState(null)
    setError(null)
  }, [])

  const setCartContext = useCallback(
    (organization: B2BOrganizationWithRole, context: B2BCartContext) => {
      setSelectedOrganization(organization)
      setCartContextState(context)
    },
    []
  )

  const value: B2BCartContextValue = {
    selectedOrganization,
    cartContext,
    isLoading,
    error,
    selectOrganization,
    clearSelection,
    setCartContext,
  }

  return (
    <B2BCartContextProvider.Provider value={value}>
      {children}
    </B2BCartContextProvider.Provider>
  )
}

export function useB2BCartContext() {
  const context = useContext(B2BCartContextProvider)

  if (context === undefined) {
    throw new Error("useB2BCartContext must be used within B2BCartContextWrapper")
  }

  return context
}
