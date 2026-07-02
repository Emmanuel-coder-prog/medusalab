"use client"

import { useEffect, useState } from "react"
import { Loader } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import {
  useDeliverySlotReservation,
  useDeliverySlots,
  useReserveDeliverySlot,
} from "@lib/hooks/delivery-slot"
import ErrorMessage from "@modules/checkout/components/error-message"
import { Badge, Button, Heading, Text, clx } from "@modules/common/components/ui"

type DeliverySlotReservationProps = {
  cart: HttpTypes.StoreCart
  customer?: HttpTypes.StoreCustomer | null
  variant?: "checkout" | "summary"
}

function formatSlotRange(startAt: string, endAt: string) {
  const start = new Date(startAt)
  const end = new Date(endAt)

  const dateFormatter = new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })

  const timeFormatter = new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
  })

  const startLabel = dateFormatter.format(start)
  const endLabel = timeFormatter.format(end)

  return `${startLabel} – ${endLabel}`
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value))
}

const DeliverySlotReservation = ({
  cart,
  customer,
  variant = "checkout",
}: DeliverySlotReservationProps) => {
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  const isAuthenticated = Boolean(customer?.id)

  const { data: slotsResponse, isLoading: isSlotsLoading, isError: isSlotsError, error: slotsError } = useDeliverySlots(
    {
      region_id: cart.region?.id ?? "",
      limit: 50,
    },
    {
      enabled: isAuthenticated && Boolean(cart.region?.id),
    }
  )

  const {
    data: reservationResponse,
    isLoading: isReservationLoading,
    isError: isReservationError,
    error: reservationError,
  } = useDeliverySlotReservation(cart.id, {
    enabled: isAuthenticated && Boolean(cart.id),
  })

  const reserveSlotMutation = useReserveDeliverySlot()

  const slots = slotsResponse?.delivery_slots ?? []
  const currentReservation = reservationResponse?.reservation ?? null

  useEffect(() => {
    if (currentReservation?.slot?.id) {
      setSelectedSlotId(currentReservation.slot.id)
    } else if (!currentReservation) {
      setSelectedSlotId(null)
    }
  }, [currentReservation?.id, currentReservation?.slot?.id])

  useEffect(() => {
    setStatusMessage(null)
  }, [selectedSlotId])

  if (!isAuthenticated || !cart.id || !cart.region?.id) {
    return null
  }

  const activeSlots = slots.filter(
    (slot) =>
      slot.status === "active" && new Date(slot.start_at) > new Date()
  )
  const hasCurrentReservation = Boolean(
    currentReservation?.status === "active" && currentReservation.slot_id
  )
  const isCurrentSelectionActive = Boolean(
    currentReservation?.status === "active" &&
      currentReservation.slot_id &&
      selectedSlotId === currentReservation.slot_id
  )
  const canReserve = Boolean(selectedSlotId) && !reserveSlotMutation.isPending

  const handleReserve = async () => {
    if (!selectedSlotId || reserveSlotMutation.isPending) {
      return
    }

    setStatusMessage(null)

    try {
      const result = await reserveSlotMutation.mutateAsync({
        cartId: cart.id,
        payload: { slot_id: selectedSlotId },
      })

      if (result?.already_reserved) {
        setStatusMessage("This delivery slot is already reserved for your cart.")
      } else {
        setStatusMessage("Delivery slot reserved successfully.")
      }
    } catch (error) {
      setStatusMessage(
        error instanceof Error
          ? error.message
          : "We couldn’t reserve that delivery slot. Please try again."
      )
    }
  }

  const errorMessage =
    isSlotsError || isReservationError
      ? (slotsError instanceof Error
          ? slotsError.message
          : reservationError instanceof Error
            ? reservationError.message
            : "We couldn’t load delivery slots right now.")
      : reserveSlotMutation.isError
        ? reserveSlotMutation.error instanceof Error
          ? reserveSlotMutation.error.message
          : "We couldn’t reserve that delivery slot. Please try again."
        : null

  return (
    <div className={clx("rounded-lg border border-gray-200 bg-gray-50 p-4", variant === "summary" ? "space-y-3" : "space-y-4")}> 
      <div className="flex flex-col gap-y-1">
        <div className="flex items-center justify-between gap-x-2">
          <Heading level="h3" className="text-lg">
            Delivery slot
          </Heading>
          {hasCurrentReservation && (
            <Badge color="green">Reserved</Badge>
          )}
        </div>
        <Text className="text-sm text-ui-fg-subtle">
          Choose a delivery window for this order.
        </Text>
      </div>

      {currentReservation?.status === "active" && currentReservation.expires_at && (
        <div className="rounded-md border border-gray-200 bg-white p-3">
          <Text className="text-sm font-medium">Current reservation</Text>
          <Text className="text-sm text-ui-fg-subtle">
            {currentReservation.slot?.code ?? "Selected slot"}
          </Text>
          <Text className="text-sm text-ui-fg-subtle">
            Expires {formatDateTime(currentReservation.expires_at)}
          </Text>
        </div>
      )}

      {isSlotsLoading || isReservationLoading ? (
        <div className="flex items-center gap-x-2 text-sm text-ui-fg-subtle">
          <Loader className="animate-spin" />
          <span>Loading delivery slots…</span>
        </div>
      ) : errorMessage ? (
        <div className="space-y-2">
          <ErrorMessage error={errorMessage} />
        </div>
      ) : activeSlots.length === 0 ? (
        <Text className="text-sm text-ui-fg-subtle">
          No delivery slots are available right now.
        </Text>
      ) : (
        <div className="space-y-2">
          {activeSlots.map((slot) => {
            const isSelected = selectedSlotId === slot.id
            const isDisabled = slot.status !== "active"

            return (
              <button
                key={slot.id}
                type="button"
                onClick={() => setSelectedSlotId(slot.id)}
                disabled={isDisabled}
                className={clx(
                  "flex w-full items-start justify-between rounded-md border px-3 py-3 text-left transition-colors",
                  isSelected
                    ? "border-black bg-black text-white"
                    : "border-gray-200 bg-white text-black hover:border-gray-300"
                )}
              >
                <div className="flex flex-col gap-y-1">
                  <span className="text-sm font-medium">{slot.code}</span>
                  <span className={clx("text-sm", isSelected ? "text-white/80" : "text-ui-fg-subtle")}>
                    {formatSlotRange(slot.start_at, slot.end_at)}
                  </span>
                </div>
                <span className={clx("text-sm", isSelected ? "text-white/80" : "text-ui-fg-subtle")}>
                  {slot.available_capacity ?? slot.capacity} left
                </span>
              </button>
            )
          })}
        </div>
      )}

      {statusMessage && (
        <Text className="text-sm text-ui-fg-subtle">{statusMessage}</Text>
      )}

      <Button
        size="small"
        className="w-full"
        isLoading={reserveSlotMutation.isPending}
        disabled={!canReserve || isCurrentSelectionActive}
        onClick={handleReserve}
      >
        {hasCurrentReservation && isCurrentSelectionActive
          ? "Reserved"
          : hasCurrentReservation
            ? "Change reservation"
            : "Reserve delivery slot"}
      </Button>
    </div>
  )
}

export default DeliverySlotReservation
