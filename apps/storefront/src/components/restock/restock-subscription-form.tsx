"use client"

import { FormEvent, useEffect, useState } from "react"
import Input from "@modules/common/components/input"
import { Button } from "@modules/common/components/ui"
import ErrorMessage from "@modules/checkout/components/error-message"
import { useSubscribeToRestock } from "@lib/restock/hooks"

type RestockSubscriptionFormProps = {
  variantId: string
  salesChannelId?: string
  customerEmail?: string | null
  className?: string
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const getDuplicateSubscriptionMessage = (message?: string) => {
  if (!message) {
    return null
  }

  const normalized = message.toLowerCase()

  if (
    normalized.includes("duplicate") ||
    normalized.includes("already exists") ||
    normalized.includes("already subscribed") ||
    normalized.includes("unique")
  ) {
    return "You are already subscribed to restock notifications for this variant."
  }

  return null
}

export default function RestockSubscriptionForm({
  variantId,
  salesChannelId,
  customerEmail,
  className,
}: RestockSubscriptionFormProps) {
  const isAuthenticated = Boolean(customerEmail)
  const [email, setEmail] = useState(customerEmail ?? "")
  const [emailError, setEmailError] = useState<string | null>(null)
  const [hasAutoSubmitted, setHasAutoSubmitted] = useState(false)

  const { mutate, isLoading, isSuccess, isError, error } =
    useSubscribeToRestock()

  const duplicateError = getDuplicateSubscriptionMessage(
    isError ? error?.message : undefined
  )
  const backendError = isError && !duplicateError ? error?.message : null
  const submissionDisabled = isLoading || isSuccess

  useEffect(() => {
    if (!isAuthenticated || hasAutoSubmitted || submissionDisabled) {
      return
    }

    setHasAutoSubmitted(true)
    mutate({
      variant_id: variantId,
      sales_channel_id: salesChannelId,
    })
  }, [
    isAuthenticated,
    hasAutoSubmitted,
    submissionDisabled,
    mutate,
    variantId,
    salesChannelId,
  ])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!email.trim()) {
      setEmailError("Please enter your email address.")
      return
    }

    if (!EMAIL_REGEX.test(email.trim())) {
      setEmailError("Please enter a valid email address.")
      return
    }

    setEmailError(null)
    setHasAutoSubmitted(true)

    mutate({
      variant_id: variantId,
      email: email.trim(),
      sales_channel_id: salesChannelId,
    })
  }

  const successMessage = isSuccess
    ? "You are subscribed to restock notifications."
    : null

  return (
    <div className={className}>
      <div className="rounded-xl border border-ui-border-base bg-ui-bg-base p-4 shadow-sm dark:border-slate-700 dark:bg-slate-950">
        {isAuthenticated ? (
          <p className="text-sm text-ui-fg-base dark:text-slate-100">
            You will be notified at your account email once this variant is back in
            stock.
          </p>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <Input
              label="Email"
              name="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              disabled={submissionDisabled}
              data-testid="restock-email-input"
            />
            {emailError && (
              <ErrorMessage
                error={emailError}
                data-testid="restock-email-error"
              />
            )}
            <div className="flex justify-end">
              <Button
                type="submit"
                variant="primary"
                className="h-10 px-4"
                disabled={submissionDisabled}
                data-testid="restock-submit-button"
              >
                {isLoading ? "Subscribing..." : "Notify me"}
              </Button>
            </div>
          </form>
        )}

        <div className="mt-4 space-y-3">
          {successMessage && (
            <div
              className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
              data-testid="restock-success"
            >
              {successMessage}
            </div>
          )}

          {duplicateError && (
            <ErrorMessage
              error={duplicateError}
              data-testid="restock-duplicate-error"
            />
          )}

          {backendError && (
            <ErrorMessage
              error={backendError}
              data-testid="restock-generic-error"
            />
          )}

          {isLoading && (
            <p
              className="text-sm text-ui-fg-subtle dark:text-slate-400"
              data-testid="restock-loading"
            >
              Subscribing to restock notifications…
            </p>
          )}
        </div>

        {isAuthenticated && !isSuccess && !isLoading && isError && (
          <div className="mt-4 flex justify-end">
            <Button
              variant="secondary"
              onClick={() =>
                mutate({
                  variant_id: variantId,
                  sales_channel_id: salesChannelId,
                })
              }
              data-testid="restock-retry-button"
            >
              Retry subscription
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
