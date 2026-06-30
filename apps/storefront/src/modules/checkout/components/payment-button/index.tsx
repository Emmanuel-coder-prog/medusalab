"use client"

import { isManual, isStripeLike } from "@lib/constants"
import { placeOrder } from "@lib/data/cart"
import type {
  StoreDeliverySlot,
  StoreDeliverySlotReservation,
} from "@lib/api/types/delivery-slot"
import {
  useDeliverySlotReservation,
  useDeliverySlots,
} from "@lib/hooks/delivery-slot"
import { HttpTypes } from "@medusajs/types"
import { Button } from "@modules/common/components/ui"
import { useElements, useStripe } from "@stripe/react-stripe-js"
import React, { useState } from "react"
import ErrorMessage from "../error-message"

type PaymentButtonProps = {
  cart: HttpTypes.StoreCart
  customer?: HttpTypes.StoreCustomer | null
  "data-testid": string
}

type DeliverySlotValidationResult = {
  isValid: boolean
  message: string | null
}

function validateDeliverySlotReservation({
  reservation,
  slots,
  cartId,
  customerId,
  regionId,
  isAuthenticated,
}: {
  reservation: StoreDeliverySlotReservation | null
  slots: StoreDeliverySlot[]
  cartId?: string
  customerId?: string
  regionId?: string
  isAuthenticated: boolean
}): DeliverySlotValidationResult {
  if (!isAuthenticated) {
    return { isValid: true, message: null }
  }

  if (!cartId || !customerId || !regionId) {
    return { isValid: true, message: null }
  }

  if (!reservation) {
    return {
      isValid: false,
      message: "A delivery slot reservation is required to complete checkout.",
    }
  }

  if (reservation.status !== "active") {
    return {
      isValid: false,
      message: "Your delivery slot reservation is no longer active.",
    }
  }

  if (reservation.cart_id !== cartId) {
    return {
      isValid: false,
      message: "Your delivery slot reservation does not belong to this cart.",
    }
  }

  if (reservation.customer_id !== customerId) {
    return {
      isValid: false,
      message: "Your delivery slot reservation does not belong to your account.",
    }
  }

  if (new Date(reservation.expires_at) <= new Date()) {
    return {
      isValid: false,
      message: "Your delivery slot reservation has expired.",
    }
  }

  const slot = slots.find(
    (candidate) =>
      candidate.id === reservation.slot_id || candidate.id === reservation.slot?.id
  )

  if (!slot) {
    return {
      isValid: false,
      message: "Your reserved delivery slot is no longer available.",
    }
  }

  if (slot.status !== "active") {
    return {
      isValid: false,
      message: "Your reserved delivery slot is no longer available.",
    }
  }

  const availableCapacity =
    typeof slot.available_capacity === "number"
      ? slot.available_capacity
      : slot.capacity

  if (availableCapacity <= 0) {
    return {
      isValid: false,
      message: "Your reserved delivery slot is no longer available.",
    }
  }

  return { isValid: true, message: null }
}

const PaymentButton: React.FC<PaymentButtonProps> = ({
  cart,
  customer,
  "data-testid": dataTestId,
}) => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const isAuthenticated = Boolean(customer?.id)

  const {
    data: reservationResponse,
    isLoading: isReservationLoading,
    isError: isReservationError,
    error: reservationError,
  } = useDeliverySlotReservation(cart.id, {
    enabled: isAuthenticated && Boolean(cart.id),
  })

  const {
    data: slotsResponse,
    isLoading: isSlotsLoading,
    isError: isSlotsError,
    error: slotsError,
  } = useDeliverySlots(
    {
      region_id: cart.region?.id ?? "",
      limit: 50,
    },
    {
      enabled: isAuthenticated && Boolean(cart.region?.id),
    }
  )

  const reservationValidationPending =
    isAuthenticated && (isReservationLoading || isSlotsLoading)

  const validateReservation = async (): Promise<DeliverySlotValidationResult> => {
    if (!isAuthenticated) {
      return { isValid: true, message: null }
    }

    if (reservationValidationPending) {
      return {
        isValid: false,
        message: "Checking your delivery slot reservation...",
      }
    }

    if (isReservationError) {
      return {
        isValid: false,
        message:
          reservationError instanceof Error
            ? reservationError.message
            : "We couldn't verify your delivery slot reservation.",
      }
    }

    if (isSlotsError) {
      return {
        isValid: false,
        message:
          slotsError instanceof Error
            ? slotsError.message
            : "We couldn't verify your delivery slot reservation.",
      }
    }

    return validateDeliverySlotReservation({
      reservation: reservationResponse?.reservation ?? null,
      slots: slotsResponse?.delivery_slots ?? [],
      cartId: cart.id,
      customerId: customer?.id,
      regionId: cart.region?.id,
      isAuthenticated,
    })
  }
  const notReady =
    !cart ||
    !cart.shipping_address ||
    !cart.billing_address ||
    !cart.email ||
    (cart.shipping_methods?.length ?? 0) < 1

  const paymentSession = cart.payment_collection?.payment_sessions?.[0]

  switch (true) {
    case isStripeLike(paymentSession?.provider_id):
      return (
        <StripePaymentButton
          notReady={notReady}
          cart={cart}
          validateReservation={validateReservation}
          reservationValidationPending={reservationValidationPending}
          setErrorMessage={setErrorMessage}
          errorMessage={errorMessage}
          data-testid={dataTestId}
        />
      )
    case isManual(paymentSession?.provider_id):
      return (
        <ManualTestPaymentButton
          notReady={notReady}
          validateReservation={validateReservation}
          reservationValidationPending={reservationValidationPending}
          setErrorMessage={setErrorMessage}
          errorMessage={errorMessage}
          data-testid={dataTestId}
        />
      )
    default:
      return <Button disabled>Select a payment method</Button>
  }
}

const StripePaymentButton = ({
  cart,
  notReady,
  validateReservation,
  reservationValidationPending,
  setErrorMessage,
  errorMessage,
  "data-testid": dataTestId,
}: {
  cart: HttpTypes.StoreCart
  notReady: boolean
  validateReservation: () => Promise<DeliverySlotValidationResult>
  reservationValidationPending: boolean
  setErrorMessage: React.Dispatch<React.SetStateAction<string | null>>
  errorMessage: string | null
  "data-testid"?: string
}) => {
  const [submitting, setSubmitting] = useState(false)

  const onPaymentCompleted = async () => {
    await placeOrder()
      .catch((err) => {
        setErrorMessage(err.message)
      })
      .finally(() => {
        setSubmitting(false)
      })
  }

  const stripe = useStripe()
  const elements = useElements()
  const card = elements?.getElement("card")

  const session = cart.payment_collection?.payment_sessions?.find(
    (s) => s.status === "pending"
  )

  const disabled = !stripe || !elements ? true : false

  const handlePayment = async () => {
    setSubmitting(true)
    setErrorMessage(null)

    if (!stripe || !elements || !card || !cart) {
      setSubmitting(false)
      return
    }

    const validation = await validateReservation()

    if (!validation.isValid) {
      setErrorMessage(validation.message)
      setSubmitting(false)
      return
    }

    await stripe
      .confirmCardPayment(session?.data.client_secret as string, {
        payment_method: {
          card: card,
          billing_details: {
            name:
              cart.billing_address?.first_name +
              " " +
              cart.billing_address?.last_name,
            address: {
              city: cart.billing_address?.city ?? undefined,
              country: cart.billing_address?.country_code ?? undefined,
              line1: cart.billing_address?.address_1 ?? undefined,
              line2: cart.billing_address?.address_2 ?? undefined,
              postal_code: cart.billing_address?.postal_code ?? undefined,
              state: cart.billing_address?.province ?? undefined,
            },
            email: cart.email,
            phone: cart.billing_address?.phone ?? undefined,
          },
        },
      })
      .then(({ error, paymentIntent }) => {
        if (error) {
          const pi = error.payment_intent

          if (
            (pi && pi.status === "requires_capture") ||
            (pi && pi.status === "succeeded")
          ) {
            onPaymentCompleted()
          }

          setErrorMessage(error.message || null)
          return
        }

        if (
          (paymentIntent && paymentIntent.status === "requires_capture") ||
          paymentIntent.status === "succeeded"
        ) {
          return onPaymentCompleted()
        }

        return
      })
  }

  return (
    <>
      <Button
        disabled={disabled || notReady || reservationValidationPending}
        onClick={handlePayment}
        size="large"
        isLoading={submitting}
        data-testid={dataTestId}
      >
        Place order
      </Button>
      <ErrorMessage
        error={errorMessage}
        data-testid="stripe-payment-error-message"
      />
    </>
  )
}

const ManualTestPaymentButton = ({
  notReady,
  validateReservation,
  reservationValidationPending,
  setErrorMessage,
  errorMessage,
  "data-testid": dataTestId,
}: {
  notReady: boolean
  validateReservation: () => Promise<DeliverySlotValidationResult>
  reservationValidationPending: boolean
  setErrorMessage: React.Dispatch<React.SetStateAction<string | null>>
  errorMessage: string | null
  "data-testid"?: string
}) => {
  const [submitting, setSubmitting] = useState(false)

  const onPaymentCompleted = async () => {
    await placeOrder()
      .catch((err) => {
        setErrorMessage(err.message)
      })
      .finally(() => {
        setSubmitting(false)
      })
  }

  const handlePayment = async () => {
    setSubmitting(true)
    setErrorMessage(null)

    const validation = await validateReservation()

    if (!validation.isValid) {
      setErrorMessage(validation.message)
      setSubmitting(false)
      return
    }

    await onPaymentCompleted()
  }

  return (
    <>
      <Button
        disabled={notReady || reservationValidationPending}
        isLoading={submitting}
        onClick={handlePayment}
        size="large"
        data-testid={dataTestId}
      >
        Place order
      </Button>
      <ErrorMessage
        error={errorMessage}
        data-testid="manual-payment-error-message"
      />
    </>
  )
}

export default PaymentButton
