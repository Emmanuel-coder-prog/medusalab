import { MedusaError, MedusaService } from "@medusajs/framework/utils"

import { getReservationHoldTtlMs } from "./config"
import { DeliverySlot } from "./models/delivery-slot"
import { DeliverySlotReservation } from "./models/delivery-slot-reservation"
import {
  DeliverySlotReservationStatus,
  DeliverySlotStatus,
} from "./types"

export type ReserveDeliverySlotForCartInput = {
  cart_id: string
  customer_id: string
  slot_id: string
  region_id: string
}

export type ReserveDeliverySlotForCartResult = {
  reservation: Record<string, unknown>
  already_reserved: boolean
}

class DeliverySlotModuleService extends MedusaService({
  DeliverySlot,
  DeliverySlotReservation,
}) {
  async listNonExpiredActiveReservationsForCart(cartId: string) {
    return this.listDeliverySlotReservations({
      cart_id: cartId,
      status: DeliverySlotReservationStatus.ACTIVE,
      expires_at: {
        $gt: new Date(),
      },
    })
  }

  async countNonExpiredActiveReservationsForSlot(slotId: string) {
    const reservations = await this.listDeliverySlotReservations({
      slot_id: slotId,
      status: DeliverySlotReservationStatus.ACTIVE,
      expires_at: {
        $gt: new Date(),
      },
    })

    return reservations.length
  }

  async reserveDeliverySlotForCart(
    input: ReserveDeliverySlotForCartInput
  ): Promise<ReserveDeliverySlotForCartResult> {
    const { cart_id, customer_id, slot_id, region_id } = input

    const existingReservations =
      await this.listNonExpiredActiveReservationsForCart(cart_id)

    if (existingReservations.length > 0) {
      const existingReservation = existingReservations[0]

      if (existingReservation.slot_id === slot_id) {
        return {
          reservation: existingReservation,
          already_reserved: true,
        }
      }

      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "This cart already has an active delivery-slot reservation."
      )
    }

    const slot = await this.retrieveDeliverySlot(slot_id)

    if (slot.status !== DeliverySlotStatus.ACTIVE) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "This delivery slot is unavailable."
      )
    }

    if (slot.region_id !== region_id) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "This delivery slot is not available for the cart's region."
      )
    }

    const now = new Date()

    if (new Date(slot.start_at) <= now) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "This delivery slot has already started."
      )
    }

    const activeReservationCount =
      await this.countNonExpiredActiveReservationsForSlot(slot_id)

    if (activeReservationCount >= slot.capacity) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "This delivery slot is fully booked."
      )
    }

    const expiresAt = new Date(Date.now() + getReservationHoldTtlMs())

    const reservation = await this.createDeliverySlotReservations({
      cart_id,
      customer_id,
      slot_id,
      status: DeliverySlotReservationStatus.ACTIVE,
      expires_at: expiresAt,
    })

    return {
      reservation: Array.isArray(reservation) ? reservation[0] : reservation,
      already_reserved: false,
    }
  }

  async rollbackReservation(reservationId: string) {
    await this.deleteDeliverySlotReservations(reservationId)
  }
}

export default DeliverySlotModuleService
