export const deliverySlotQueryKeys = {
  all: ["delivery-slots"] as const,
  lists: () => [...deliverySlotQueryKeys.all, "list"] as const,
  list: (regionId: string, offset?: number, limit?: number) =>
    [
      ...deliverySlotQueryKeys.lists(),
      regionId,
      { offset: offset ?? 0, limit: limit ?? 20 },
    ] as const,
}

export const deliverySlotReservationQueryKeys = {
  all: ["delivery-slot-reservations"] as const,
  cart: (cartId: string) =>
    [...deliverySlotReservationQueryKeys.all, "cart", cartId] as const,
}
