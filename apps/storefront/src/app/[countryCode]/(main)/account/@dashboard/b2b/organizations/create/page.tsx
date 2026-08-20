"use client"

import { useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { createB2BOrganization } from "@lib/data/b2b"
import { Container, Heading, Text } from "@modules/common/components/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Button } from "@modules/common/components/ui"

export default function CreateOrganizationPage() {
  const router = useRouter()
  const params = useParams()
  const countryCode = params?.countryCode as string

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    legal_name: "",
    display_name: "",
    handle: "",
    approval_threshold: "",
    approval_currency_code: "USD",
    requires_merchant_quote: false,
    quote_validity_days: "7",
  })

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
      }))
    } else {
      const nextValue =
        name === "handle"
          ? value
              .toLowerCase()
              .replace(/[^a-z0-9-]+/g, "-")
              .replace(/^-+|-+$/g, "")
          : value

      setFormData((prev) => ({
        ...prev,
        [name]: nextValue,
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      await createB2BOrganization({
        legal_name: formData.legal_name,
        display_name: formData.display_name,
        handle: formData.handle,
        approval_threshold: formData.approval_threshold
          ? parseFloat(formData.approval_threshold)
          : undefined,
        approval_currency_code: formData.approval_currency_code || undefined,
        requires_merchant_quote: formData.requires_merchant_quote,
        quote_validity_days: parseInt(formData.quote_validity_days, 10),
      })

      // Redirect to organizations list after successful creation
      router.push(`/${countryCode}/account/b2b/organizations`)
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred"
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container className="py-12" data-testid="create-organization-page">
      <LocalizedClientLink
        href="/account/b2b/organizations"
        className="flex items-center gap-2 text-small-regular mb-4"
      >
        <span>←</span>
        <span>Back to Organizations</span>
      </LocalizedClientLink>

      <Heading level="h2" className="mb-8">
        Create New Organization
      </Heading>

      {error && (
        <div className="max-w-2xl border border-red-200 bg-red-50 rounded-lg p-4 mb-6">
          <Text className="text-red-800">
            <strong>Error:</strong> {error}
          </Text>
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-2xl">
        <div className="grid gap-6 mb-8">
          {/* Legal Name */}
          <div>
            <label htmlFor="legal_name" className="block text-sm font-medium mb-2">
              Legal Name <span className="text-red-500">*</span>
            </label>
            <input
              id="legal_name"
              name="legal_name"
              type="text"
              required
              maxLength={255}
              value={formData.legal_name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., ACME Corporation Inc."
            />
            <Text className="text-xs text-gray-500 mt-1">
              The official legal name of your organization
            </Text>
          </div>

          {/* Display Name */}
          <div>
            <label htmlFor="display_name" className="block text-sm font-medium mb-2">
              Display Name <span className="text-red-500">*</span>
            </label>
            <input
              id="display_name"
              name="display_name"
              type="text"
              required
              maxLength={255}
              value={formData.display_name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., ACME Corp"
            />
            <Text className="text-xs text-gray-500 mt-1">
              Short name for internal display
            </Text>
          </div>

          {/* Handle */}
          <div>
            <label htmlFor="handle" className="block text-sm font-medium mb-2">
              Handle <span className="text-red-500">*</span>
            </label>
            <input
              id="handle"
              name="handle"
              type="text"
              required
              maxLength={50}
              value={formData.handle}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., acme-corp"
              pattern="^[a-z0-9-]+$"
            />
            <Text className="text-xs text-gray-500 mt-1">
              Lowercase letters, numbers, and hyphens only. Invalid characters are normalized automatically.
            </Text>
          </div>

          {/* Approval Threshold */}
          <div>
            <label htmlFor="approval_threshold" className="block text-sm font-medium mb-2">
              Approval Threshold (Optional)
            </label>
            <input
              id="approval_threshold"
              name="approval_threshold"
              type="number"
              step="0.01"
              min="0"
              value={formData.approval_threshold}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., 10000"
            />
            <Text className="text-xs text-gray-500 mt-1">
              Orders above this amount require approval
            </Text>
          </div>

          {/* Approval Currency Code */}
          <div>
            <label htmlFor="approval_currency_code" className="block text-sm font-medium mb-2">
              Approval Currency Code (Optional)
            </label>
            <input
              id="approval_currency_code"
              name="approval_currency_code"
              type="text"
              maxLength={3}
              value={formData.approval_currency_code}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="USD"
            />
            <Text className="text-xs text-gray-500 mt-1">
              Currency code for approval threshold
            </Text>
          </div>

          {/* Requires Merchant Quote */}
          <div className="flex items-center">
            <input
              id="requires_merchant_quote"
              name="requires_merchant_quote"
              type="checkbox"
              checked={formData.requires_merchant_quote}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="requires_merchant_quote" className="ml-2 text-sm font-medium">
              Requires Merchant Quote
            </label>
          </div>

          {/* Quote Validity Days */}
          <div>
            <label htmlFor="quote_validity_days" className="block text-sm font-medium mb-2">
              Quote Validity (Days)
            </label>
            <input
              id="quote_validity_days"
              name="quote_validity_days"
              type="number"
              min="1"
              value={formData.quote_validity_days}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="7"
            />
            <Text className="text-xs text-gray-500 mt-1">
              How many days quoted prices remain valid
            </Text>
          </div>
        </div>

        <div className="flex gap-4">
          <Button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Organization"}
          </Button>
          <LocalizedClientLink href="/account/b2b/organizations">
            <Button className="bg-gray-200 text-gray-800 px-6 py-2 rounded hover:bg-gray-300">
              Cancel
            </Button>
          </LocalizedClientLink>
        </div>
      </form>
    </Container>
  )
}
