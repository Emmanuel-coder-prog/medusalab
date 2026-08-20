"use client"

import { useState } from "react"
import type { B2BOrganizationWithRole } from "@lib/api/types/b2b"
import { useB2BCartContext } from "@lib/hooks/use-b2b-cart-context"
import { getRoleLabel } from "@lib/helpers/b2b-permissions"
import { getOrganizationStatusColor } from "@lib/helpers/b2b-status"
import { Button, Heading, Text } from "@modules/common/components/ui"

interface OrganizationSelectorProps {
  organizations: B2BOrganizationWithRole[]
  currentCartId: string | null
  onOrganizationSelected?: () => void
}

export default function OrganizationSelector({
  organizations,
  currentCartId,
  onOrganizationSelected,
}: OrganizationSelectorProps) {
  const { selectedOrganization, isLoading, error } = useB2BCartContext()
  const [showModal, setShowModal] = useState(false)

  if (organizations.length === 0) {
    return null
  }

  const canSwitch =
    organizations.length > 1 &&
    (!selectedOrganization || organizations.length > 1)

  return (
    <>
      {/* Organization Display */}
      <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        {selectedOrganization ? (
          <>
            <div className="flex items-center justify-between">
              <div>
                <Text className="text-gray-600 text-sm">
                  B2B Organization
                </Text>
                <Heading level="h3" className="mt-1 text-lg">
                  {selectedOrganization.display_name}
                </Heading>
                <Text className="text-gray-500 mt-1 text-sm">
                  Role: {getRoleLabel(selectedOrganization.role)}
                </Text>
              </div>
              {canSwitch && (
                <Button
                  onClick={() => setShowModal(true)}
                  variant="secondary"
                  size="small"
                  disabled={isLoading}
                >
                  {isLoading ? "Switching..." : "Switch"}
                </Button>
              )}
            </div>
            {error && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                <Text className="text-red-800 text-sm">
                  {error}
                </Text>
              </div>
            )}
          </>
        ) : (
          <div>
            <Heading level="h3" className="text-lg">Select an Organization</Heading>
            <Text className="text-gray-600 mt-2 text-sm">
              You belong to {organizations.length}{" "}
              {organizations.length === 1 ? "organization" : "organizations"}
            </Text>
            <Button
              onClick={() => setShowModal(true)}
              variant="primary"
              size="small"
              className="mt-3"
              disabled={!currentCartId || isLoading}
            >
              {isLoading ? "Loading..." : "Select Organization"}
            </Button>
          </div>
        )}
      </div>

      {/* Selection Modal */}
      {showModal && (
        <OrganizationSelectorModal
          organizations={organizations}
          selectedOrganizationId={selectedOrganization?.id ?? null}
          currentCartId={currentCartId}
          isLoading={isLoading}
          onClose={() => setShowModal(false)}
          onSelected={() => {
            setShowModal(false)
            onOrganizationSelected?.()
          }}
        />
      )}
    </>
  )
}

interface OrganizationSelectorModalProps {
  organizations: B2BOrganizationWithRole[]
  selectedOrganizationId: string | null
  currentCartId: string | null
  isLoading: boolean
  onClose: () => void
  onSelected: () => void
}

function OrganizationSelectorModal({
  organizations,
  selectedOrganizationId,
  currentCartId,
  isLoading,
  onClose,
  onSelected,
}: OrganizationSelectorModalProps) {
  const { selectOrganization, error } = useB2BCartContext()
  const [localError, setLocalError] = useState<string | null>(null)

  const handleSelectOrganization = async (org: B2BOrganizationWithRole) => {
    if (!currentCartId) {
      setLocalError("No cart available")
      return
    }

    if (org.id === selectedOrganizationId) {
      // Already selected, just close
      onClose()
      return
    }

    try {
      const result = await selectOrganization(org, currentCartId)
      // Success - either newly selected or already selected
      onSelected()
    } catch (err) {
      setLocalError(
        err instanceof Error ? err.message : "Failed to select organization"
      )
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4 p-6">
        <Heading level="h3" className="mb-4 text-lg">
          Select Organization
        </Heading>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
            <Text className="text-red-800 text-sm">
              {error}
            </Text>
          </div>
        )}

        {localError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
            <Text className="text-red-800 text-sm">
              {localError}
            </Text>
          </div>
        )}

        <div className="space-y-2 mb-6 max-h-96 overflow-y-auto">
          {organizations.map((org) => (
            <button
              key={org.id}
              onClick={() => handleSelectOrganization(org)}
              disabled={isLoading}
              className={`w-full p-3 rounded-lg border-2 text-left transition-colors ${
                selectedOrganizationId === org.id
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <Text className="font-semibold text-sm">
                    {org.display_name}
                  </Text>
                  <Text className="text-gray-600 mt-1 text-sm">
                    {org.handle}
                  </Text>
                  <div className="flex items-center gap-2 mt-2">
                    <span
                      className={`inline-block w-2 h-2 rounded-full ${getOrganizationStatusColor(
                        org.status
                      )}`}
                    />
                    <Text className="text-gray-500 text-xs">
                      {getRoleLabel(org.role)}
                    </Text>
                  </div>
                </div>
                {selectedOrganizationId === org.id && (
                  <div className="text-blue-500 font-bold">✓</div>
                )}
              </div>
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <Button
            onClick={onClose}
            variant="secondary"
            className="flex-1"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={onClose}
            variant="primary"
            className="flex-1"
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : "Done"}
          </Button>
        </div>
      </div>
    </div>
  )
}
