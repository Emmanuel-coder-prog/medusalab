"use client"

import { useMemo } from "react"
import Link from "next/link"
import { Button, Text, Heading } from "@modules/common/components/ui"
import { convertToLocale } from "@lib/util/money"
import {
  getPurchaseRequestStatusLabel,
  getPurchaseRequestStatusColor,
} from "@lib/helpers/b2b-status"
import type { B2BPurchaseRequest } from "@lib/api/types/b2b"

const statusColorClasses: Record<string, string> = {
  yellow: "bg-yellow-100 text-yellow-800",
  blue: "bg-blue-100 text-blue-800",
  orange: "bg-orange-100 text-orange-800",
  red: "bg-red-100 text-red-800",
  green: "bg-green-100 text-green-800",
  gray: "bg-gray-100 text-gray-800",
}

interface PurchaseRequestQueueProps {
  purchaseRequests: B2BPurchaseRequest[]
  total: number
}

export default function PurchaseRequestQuote({
  purchaseRequests,
  total,
}: PurchaseRequestQueueProps) {
  if (!purchaseRequests || purchaseRequests.length === 0) {
    return (
      <div className="text-center py-12">
        <Heading level="h3" className="mb-2">
          Quote Queue Empty
        </Heading>
        <Text className="text-ui-fg-muted">
          No purchase requests awaiting quotes at this time.
        </Text>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <Heading level="h2" className="text-xl">
          Quote Queue ({total})
        </Heading>
      </div>

      <div className="space-y-2">
        {purchaseRequests.map((pr) => {
          const status = getPurchaseRequestStatusLabel(pr.status)
          const color = getPurchaseRequestStatusColor(pr.status)
          const formattedTotal = convertToLocale({
            amount: Number(pr.requested_total ?? 0),
            currency_code: pr.currency_code ?? "USD",
          })

          return (
            <Link
              key={pr.id}
              href={`/admin/b2b/quotes/${pr.id}`}
              className="block"
            >
              <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all hover:border-gray-300">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Text className="font-semibold text-base">
                        {pr.reference || pr.id}
                      </Text>
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                          statusColorClasses[color]
                        }`}
                      >
                        {status}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <Text className="text-ui-fg-muted text-xs">
                          Customer
                        </Text>
                        <Text className="text-base">{pr.customer_id}</Text>
                      </div>
                      <div>
                        <Text className="text-ui-fg-muted text-xs">
                          Requested Total
                        </Text>
                        <Text className="text-base font-medium">
                          {formattedTotal}
                        </Text>
                      </div>
                      <div>
                        <Text className="text-ui-fg-muted text-xs">
                          Submitted
                        </Text>
                        <Text className="text-base">
                          {pr.submitted_at
                            ? new Date(pr.submitted_at).toLocaleDateString()
                            : "—"}
                        </Text>
                      </div>
                    </div>
                  </div>

                  <Button variant="secondary" size="small" className="whitespace-nowrap">
                    Review Quote
                  </Button>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
