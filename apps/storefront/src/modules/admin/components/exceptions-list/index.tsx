"use client"

import { useState } from "react"
import Link from "next/link"
import { B2BException, B2BExceptionSeverity } from "@lib/api/types/b2b"
import { Container, Heading, Text, Button } from "@modules/common/components/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const severityClasses: Record<B2BExceptionSeverity, string> = {
  warning: "bg-yellow-100 text-yellow-900 border-yellow-300",
  critical: "bg-red-100 text-red-900 border-red-300",
}

const severityBadgeClasses: Record<B2BExceptionSeverity, string> = {
  warning: "bg-yellow-100 text-yellow-800",
  critical: "bg-red-100 text-red-800",
}

interface ExceptionsListProps {
  exceptions: B2BException[]
  total: number
}

export default function ExceptionsList({ exceptions, total }: ExceptionsListProps) {
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null)

  const filtered = selectedFilter
    ? exceptions.filter((e) => e.type === selectedFilter)
    : exceptions

  const typeLabels: Record<string, string> = {
    finance_pending_too_long: "Finance Review Pending",
    finance_review_expired: "Finance Review Expired",
    overdue_payment_obligation: "Overdue Payment",
    blocked_order_release: "Blocked Release",
    release_not_dispatched: "Release Not Dispatched",
    warehouse_dispatch_failed: "Warehouse Dispatch Failed",
  }

  const typeIcons: Record<string, string> = {
    finance_pending_too_long: "⏳",
    finance_review_expired: "⛔",
    overdue_payment_obligation: "💳",
    blocked_order_release: "🚫",
    release_not_dispatched: "📦",
    warehouse_dispatch_failed: "❌",
  }

  const getActionUrl = (exception: B2BException): string => {
    if (exception.order_id) {
      return `/admin/b2b/finance-reviews/${exception.reference}`
    }
    return "#"
  }

  const getRecoveryDescription = (exception: B2BException): string => {
    switch (exception.type) {
      case "finance_pending_too_long":
        return `Order has been pending finance review for ${exception.days_pending} days.`
      case "finance_review_expired":
        return "Finance review period has expired. Manual review required."
      case "overdue_payment_obligation":
        return `Payment is ${exception.days_overdue} days overdue. Amount: ${exception.amount} ${exception.currency}.`
      case "blocked_order_release":
        return `Release is blocked: ${exception.reason}. ${exception.note || ""}`
      case "release_not_dispatched":
        return `Order has been eligible for ${exception.days_eligible} days but not yet dispatched to warehouse.`
      case "warehouse_dispatch_failed":
        return `Warehouse dispatch failed (${exception.attempts} attempt${exception.attempts !== 1 ? "s" : ""}). ${exception.last_error || ""}`
      default:
        return ""
    }
  }

  if (exceptions.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 p-8 text-center">
        <Text className="text-ui-fg-muted">No exceptions found. All systems operating normally.</Text>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filter options */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedFilter === null ? "primary" : "secondary"}
          size="small"
          onClick={() => setSelectedFilter(null)}
        >
          All ({total})
        </Button>
        {Object.entries(typeLabels).map(([type, label]) => {
          const count = exceptions.filter((e) => e.type === type).length
          if (count === 0) return null
          return (
            <Button
              key={type}
              variant={selectedFilter === type ? "primary" : "secondary"}
              size="small"
              onClick={() => setSelectedFilter(type)}
            >
              {label} ({count})
            </Button>
          )
        })}
      </div>

      {/* Exception cards */}
      <div className="space-y-4">
        {filtered.map((exception) => (
          <div
            key={exception.reference}
            className={`rounded-lg border p-4 ${severityClasses[exception.severity]}`}
          >
            <div className="grid gap-4 md:grid-cols-[1fr_auto]">
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{typeIcons[exception.type] || "⚠️"}</span>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Heading level="h3" className="text-lg">
                        {typeLabels[exception.type] || exception.type}
                      </Heading>
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${severityBadgeClasses[exception.severity]}`}>
                        {exception.severity.toUpperCase()}
                      </span>
                    </div>
                    {exception.order_display_id && (
                      <Text className="mt-1 text-sm font-medium">Order {exception.order_display_id}</Text>
                    )}
                  </div>
                </div>

                {/* Details grid */}
                <div className="grid gap-3 md:grid-cols-2">
                  {exception.order_display_id && (
                    <div>
                      <Text className="text-xs text-ui-fg-muted">Order</Text>
                      <Text className="mt-1 font-medium">#{exception.order_display_id}</Text>
                    </div>
                  )}
                  {exception.organization_id && (
                    <div>
                      <Text className="text-xs text-ui-fg-muted">Organization</Text>
                      <Text className="mt-1 font-medium">{exception.organization_id}</Text>
                    </div>
                  )}
                  {exception.customer_email && (
                    <div>
                      <Text className="text-xs text-ui-fg-muted">Customer</Text>
                      <Text className="mt-1 font-medium">{exception.customer_email}</Text>
                    </div>
                  )}
                  {exception.status && (
                    <div>
                      <Text className="text-xs text-ui-fg-muted">Status</Text>
                      <Text className="mt-1 font-medium capitalize">{exception.status}</Text>
                    </div>
                  )}
                </div>

                {/* Description */}
                <div className="rounded bg-white/50 p-2">
                  <Text className="text-sm">{getRecoveryDescription(exception)}</Text>
                </div>

                {/* Metadata */}
                <div className="grid gap-2 text-xs text-ui-fg-muted md:grid-cols-3">
                  {exception.created_at && (
                    <div>Created: {new Date(exception.created_at).toLocaleString()}</div>
                  )}
                  {exception.failed_at && (
                    <div>Failed: {new Date(exception.failed_at).toLocaleString()}</div>
                  )}
                  {exception.due_at && (
                    <div>Due: {new Date(exception.due_at).toLocaleString()}</div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 md:min-w-[160px]">
                {exception.available_actions.includes("open_record") && (
                  <LocalizedClientLink href={getActionUrl(exception)}>
                    <Button size="small" className="w-full">
                      View Record
                    </Button>
                  </LocalizedClientLink>
                )}

                {exception.available_actions.includes("retry") && (
                  <Button size="small" variant="secondary" disabled className="w-full">
                    Retry (pending)
                  </Button>
                )}

                {exception.available_actions.includes("override") && (
                  <Button size="small" variant="secondary" disabled className="w-full">
                    Override (pending)
                  </Button>
                )}

                {exception.available_actions.includes("escalate") && (
                  <Button size="small" variant="secondary" disabled className="w-full">
                    Escalate (pending)
                  </Button>
                )}

                {exception.available_actions.length === 0 && (
                  <Button size="small" variant="secondary" disabled className="w-full">
                    No actions
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
