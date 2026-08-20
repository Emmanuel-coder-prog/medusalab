"use client"

import { createContext, useContext, useState, useCallback } from "react"
import type { B2BOrganizationWithRole } from "@lib/api/types/b2b"

type B2BContextType = {
  selectedOrganizationId: string | null
  setSelectedOrganizationId: (id: string | null) => void
  selectedOrganization: B2BOrganizationWithRole | null
  setSelectedOrganization: (org: B2BOrganizationWithRole | null) => void
}

const B2BContext = createContext<B2BContextType | undefined>(undefined)

export function B2BProvider({ children }: { children: React.ReactNode }) {
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string | null>(null)
  const [selectedOrganization, setSelectedOrganization] = useState<B2BOrganizationWithRole | null>(null)

  return (
    <B2BContext.Provider
      value={{
        selectedOrganizationId,
        setSelectedOrganizationId,
        selectedOrganization,
        setSelectedOrganization,
      }}
    >
      {children}
    </B2BContext.Provider>
  )
}

/**
 * Hook to access and manage the selected B2B organization
 */
export function useB2BOrganization() {
  const context = useContext(B2BContext)

  if (!context) {
    throw new Error(
      "useB2BOrganization must be used within a B2BProvider"
    )
  }

  return context
}
