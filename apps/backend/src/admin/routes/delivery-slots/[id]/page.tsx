import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Badge,
  Button,
  Container,
  Drawer,
  Heading,
  Input,
  Label,
  Select,
  Text,
  toast,
} from "@medusajs/ui"
import {
  buildDeliverySlotPayload,
  deliverySlotToFormValues,
  formatDateTime,
  isDeliverySlotFormValid,
  type DeliverySlotFormValues,
  type DeliverySlotReservationListResponse,
  type DeliverySlotResponse,
  type RegionOption,
  type StockLocationOption,
} from "../../../lib/types/delivery-slot"

const statusBadgeClassName = (status: string) => {
  if (status === "active") {
    return "bg-green-100 text-green-800"
  }

  if (status === "released") {
    return "bg-blue-100 text-blue-800"
  }

  if (status === "expired") {
    return "bg-orange-100 text-orange-800"
  }

  return "bg-gray-100 text-gray-800"
}

const DeliverySlotDetailPage = () => {
  const id = window.location.pathname.split("/").filter(Boolean).pop()
  const queryClient = useQueryClient()
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [form, setForm] = useState<DeliverySlotFormValues | null>(null)
  const [reservationPagination, setReservationPagination] = useState({
    offset: 0,
    limit: 20,
  })

  const {
    data: slotData,
    isLoading,
    isError,
  } = useQuery<DeliverySlotResponse>({
    queryKey: ["delivery-slot", id],
    queryFn: async () => {
      const response = await fetch(`/admin/delivery-slots/${id}`, {
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to fetch delivery slot")
      }

      return response.json()
    },
    enabled: Boolean(id),
  })

  const {
    data: reservationsData,
    isLoading: isLoadingReservations,
    isError: isReservationsError,
  } = useQuery<DeliverySlotReservationListResponse>({
    queryKey: [
      "delivery-slot",
      id,
      "reservations",
      reservationPagination.offset,
      reservationPagination.limit,
    ],
    queryFn: async () => {
      const response = await fetch(
        `/admin/delivery-slots/${id}/reservations?offset=${reservationPagination.offset}&limit=${reservationPagination.limit}`,
        {
          credentials: "include",
        }
      )

      if (!response.ok) {
        throw new Error("Failed to fetch reservations")
      }

      return response.json()
    },
    enabled: Boolean(id),
  })

  const { data: regionsData, isLoading: isLoadingRegions } = useQuery<{
    regions: RegionOption[]
  }>({
    queryKey: ["regions", "all"],
    queryFn: async () => {
      const response = await fetch("/admin/regions?limit=100&fields=id,name", {
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to fetch regions")
      }

      return response.json()
    },
    enabled: isEditOpen,
  })

  const { data: stockLocationsData, isLoading: isLoadingStockLocations } =
    useQuery<{ stock_locations: StockLocationOption[] }>({
      queryKey: ["stock-locations", "all"],
      queryFn: async () => {
        const response = await fetch(
          "/admin/stock-locations?limit=100&fields=id,name",
          {
            credentials: "include",
          }
        )

        if (!response.ok) {
          throw new Error("Failed to fetch stock locations")
        }

        return response.json()
      },
      enabled: isEditOpen,
    })

  const slot = slotData?.delivery_slot

  useEffect(() => {
    if (isEditOpen && slot) {
      setForm(deliverySlotToFormValues(slot))
    }
  }, [isEditOpen, slot])

  const updateDeliverySlotMutation = useMutation({
    mutationFn: async (
      payload: Partial<ReturnType<typeof buildDeliverySlotPayload>>
    ) => {
      const response = await fetch(`/admin/delivery-slots/${id}`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error("Failed to update delivery slot")
      }

      return response.json()
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["delivery-slot", id] })
      await queryClient.invalidateQueries({ queryKey: ["delivery-slots"] })
      toast.success("Delivery slot updated")
      setIsEditOpen(false)
    },
    onError: () => {
      toast.error("Failed to update delivery slot")
    },
  })

  const disableDeliverySlotMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/admin/delivery-slots/${id}`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "disabled" }),
      })

      if (!response.ok) {
        throw new Error("Failed to disable delivery slot")
      }

      return response.json()
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["delivery-slot", id] })
      await queryClient.invalidateQueries({ queryKey: ["delivery-slots"] })
      toast.success("Delivery slot disabled")
    },
    onError: () => {
      toast.error("Failed to disable delivery slot")
    },
  })

  const enableDeliverySlotMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/admin/delivery-slots/${id}`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "active" }),
      })

      if (!response.ok) {
        throw new Error("Failed to enable delivery slot")
      }

      return response.json()
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["delivery-slot", id] })
      await queryClient.invalidateQueries({ queryKey: ["delivery-slots"] })
      toast.success("Delivery slot enabled")
    },
    onError: () => {
      toast.error("Failed to enable delivery slot")
    },
  })

  const isFormValid = useMemo(() => {
    if (!form) {
      return false
    }

    return isDeliverySlotFormValid(form)
  }, [form])

  const handleEditSubmit = (event: React.FormEvent) => {
    event.preventDefault()

    if (!form || !isFormValid) {
      return
    }

    updateDeliverySlotMutation.mutate(buildDeliverySlotPayload(form))
  }

  const handleReservationPaginationChange = (
    newOffset: number,
    newLimit: number
  ) => {
    setReservationPagination({
      offset: newOffset,
      limit: newLimit,
    })
  }

  const regions = regionsData?.regions ?? []
  const stockLocations = stockLocationsData?.stock_locations ?? []

  if (isLoading) {
    return (
      <Container className="px-8 py-10">
        <Heading>Delivery Slot</Heading>
        <Text className="text-gray-600 mt-4">Loading...</Text>
      </Container>
    )
  }

  if (isError || !slot) {
    return (
      <Container className="px-8 py-10">
        <Heading>Delivery Slot</Heading>
        <Text className="text-red-600 mt-4">Error loading delivery slot</Text>
        <Button
          className="mt-4"
          variant="secondary"
          onClick={() => {
            window.location.href = "/app/delivery-slots"
          }}
        >
          Back to Delivery Slots
        </Button>
      </Container>
    )
  }

  return (
    <Container className="px-8 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Button
            variant="transparent"
            onClick={() => {
              window.location.href = "/app/delivery-slots"
            }}
          >
            ← Back
          </Button>
          <Heading className="mt-2">{slot.code}</Heading>
          <Text className="text-sm text-gray-600 mt-1">
            {formatDateTime(slot.start_at)} – {formatDateTime(slot.end_at)}
          </Text>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={statusBadgeClassName(slot.status)}>{slot.status}</Badge>
          <Button variant="secondary" onClick={() => setIsEditOpen(true)}>
            Edit
          </Button>
          {slot.status === "active" ? (
            <Button
              variant="danger"
              disabled={disableDeliverySlotMutation.isPending}
              onClick={() => disableDeliverySlotMutation.mutate()}
            >
              {disableDeliverySlotMutation.isPending ? "Disabling..." : "Disable"}
            </Button>
          ) : (
            <Button
              disabled={enableDeliverySlotMutation.isPending}
              onClick={() => enableDeliverySlotMutation.mutate()}
            >
              {enableDeliverySlotMutation.isPending ? "Enabling..." : "Enable"}
            </Button>
          )}
        </div>
      </div>

      <Container className="border rounded px-6 py-4 mb-8">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Text className="text-sm text-gray-600">Region ID</Text>
            <Text>{slot.region_id}</Text>
          </div>
          <div>
            <Text className="text-sm text-gray-600">Stock Location</Text>
            <Text>{slot.stock_location_id || "—"}</Text>
          </div>
          <div>
            <Text className="text-sm text-gray-600">Capacity</Text>
            <Text>{slot.capacity}</Text>
          </div>
          <div>
            <Text className="text-sm text-gray-600">Active Reservations</Text>
            <Text>
              {slot.active_reservations ?? 0} / {slot.capacity}
            </Text>
          </div>
        </div>
      </Container>

      <div className="mb-4 flex items-center justify-between">
        <Heading level="h2">Reservations</Heading>
        <Text className="text-sm text-gray-600">
          Total: {reservationsData?.count || 0}
        </Text>
      </div>

      {isLoadingReservations ? (
        <Text className="text-gray-600">Loading reservations...</Text>
      ) : isReservationsError ? (
        <Text className="text-red-600">Error loading reservations</Text>
      ) : reservationsData?.reservations &&
        reservationsData.reservations.length > 0 ? (
        <div>
          <div className="overflow-x-auto border rounded">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                    Cart
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                    Expires
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody>
                {reservationsData.reservations.map((reservation) => (
                  <tr key={reservation.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-3 text-sm text-gray-900">
                      {reservation.cart_id}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600">
                      {reservation.customer_id}
                    </td>
                    <td className="px-6 py-3 text-sm">
                      <Badge className={statusBadgeClassName(reservation.status)}>
                        {reservation.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600">
                      {formatDateTime(reservation.expires_at)}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600">
                      {formatDateTime(reservation.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between mt-6">
            <Text className="text-sm text-gray-600">
              Showing {reservationPagination.offset + 1} to{" "}
              {Math.min(
                reservationPagination.offset + reservationPagination.limit,
                reservationsData.count || 0
              )}{" "}
              of {reservationsData.count || 0}
            </Text>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  if (reservationPagination.offset > 0) {
                    handleReservationPaginationChange(
                      reservationPagination.offset -
                        reservationPagination.limit,
                      reservationPagination.limit
                    )
                  }
                }}
                disabled={reservationPagination.offset === 0}
                variant="secondary"
              >
                Previous
              </Button>
              <Button
                onClick={() => {
                  if (
                    reservationPagination.offset + reservationPagination.limit <
                    (reservationsData?.count || 0)
                  ) {
                    handleReservationPaginationChange(
                      reservationPagination.offset +
                        reservationPagination.limit,
                      reservationPagination.limit
                    )
                  }
                }}
                disabled={
                  reservationPagination.offset + reservationPagination.limit >=
                  (reservationsData?.count || 0)
                }
                variant="secondary"
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <Container className="px-6 py-12 border rounded">
          <Text className="text-center text-gray-600">No reservations found</Text>
        </Container>
      )}

      <Drawer open={isEditOpen} onOpenChange={setIsEditOpen}>
        <Drawer.Content>
          <Drawer.Header>
            <Drawer.Title>Edit Delivery Slot</Drawer.Title>
            <Drawer.Description>
              Update the delivery window, capacity, or status.
            </Drawer.Description>
          </Drawer.Header>
          {form ? (
            <form onSubmit={handleEditSubmit} className="space-y-4 p-6">
              <div className="space-y-2">
                <Label htmlFor="edit-slot-code">Code</Label>
                <Input
                  id="edit-slot-code"
                  value={form.code}
                  onChange={(event) =>
                    setForm((current) =>
                      current
                        ? { ...current, code: event.target.value }
                        : current
                    )
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-slot-region">Region</Label>
                {isLoadingRegions ? (
                  <Text className="text-ui-fg-subtle text-sm">
                    Loading regions...
                  </Text>
                ) : (
                  <Select
                    value={form.region_id}
                    onValueChange={(value) =>
                      setForm((current) =>
                        current ? { ...current, region_id: value } : current
                      )
                    }
                  >
                    <Select.Trigger id="edit-slot-region">
                      <Select.Value placeholder="Select a region" />
                    </Select.Trigger>
                    <Select.Content>
                      {regions.map((region) => (
                        <Select.Item key={region.id} value={region.id}>
                          {region.name}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-slot-stock-location">Stock Location</Label>
                {isLoadingStockLocations ? (
                  <Text className="text-ui-fg-subtle text-sm">
                    Loading stock locations...
                  </Text>
                ) : (
                  <Select
                    value={form.stock_location_id || "none"}
                    onValueChange={(value) =>
                      setForm((current) =>
                        current
                          ? {
                              ...current,
                              stock_location_id: value === "none" ? "" : value,
                            }
                          : current
                      )
                    }
                  >
                    <Select.Trigger id="edit-slot-stock-location">
                      <Select.Value placeholder="Optional stock location" />
                    </Select.Trigger>
                    <Select.Content>
                      <Select.Item value="none">None</Select.Item>
                      {stockLocations.map((location) => (
                        <Select.Item key={location.id} value={location.id}>
                          {location.name}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-slot-start-at">Start</Label>
                  <Input
                    id="edit-slot-start-at"
                    type="datetime-local"
                    value={form.start_at}
                    onChange={(event) =>
                      setForm((current) =>
                        current
                          ? { ...current, start_at: event.target.value }
                          : current
                      )
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-slot-end-at">End</Label>
                  <Input
                    id="edit-slot-end-at"
                    type="datetime-local"
                    value={form.end_at}
                    onChange={(event) =>
                      setForm((current) =>
                        current
                          ? { ...current, end_at: event.target.value }
                          : current
                      )
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-slot-capacity">Capacity</Label>
                <Input
                  id="edit-slot-capacity"
                  type="number"
                  min={1}
                  value={form.capacity}
                  onChange={(event) =>
                    setForm((current) =>
                      current
                        ? { ...current, capacity: event.target.value }
                        : current
                    )
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-slot-status">Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(value: "active" | "disabled") =>
                    setForm((current) =>
                      current ? { ...current, status: value } : current
                    )
                  }
                >
                  <Select.Trigger id="edit-slot-status">
                    <Select.Value placeholder="Select status" />
                  </Select.Trigger>
                  <Select.Content>
                    <Select.Item value="active">Active</Select.Item>
                    <Select.Item value="disabled">Disabled</Select.Item>
                  </Select.Content>
                </Select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsEditOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!isFormValid || updateDeliverySlotMutation.isPending}
                >
                  {updateDeliverySlotMutation.isPending ? "Saving..." : "Save"}
                </Button>
              </div>
            </form>
          ) : null}
        </Drawer.Content>
      </Drawer>
    </Container>
  )
}

export default DeliverySlotDetailPage
