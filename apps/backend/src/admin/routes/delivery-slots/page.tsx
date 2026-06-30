import { useMemo, useState } from "react"
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
import { defineRouteConfig } from "@medusajs/admin-sdk"

import {
  buildDeliverySlotPayload,
  emptyDeliverySlotForm,
  formatDateTime,
  isDeliverySlotFormValid,
  type DeliverySlotFormValues,
  type DeliverySlotListResponse,
  type RegionOption,
  type StockLocationOption,
} from "../../lib/types/delivery-slot"

const statusBadgeClassName = (status: string) => {
  if (status === "active") {
    return "bg-green-100 text-green-800"
  }

  return "bg-gray-100 text-gray-800"
}

const DeliverySlotsPage = () => {
  const queryClient = useQueryClient()
  const [pagination, setPagination] = useState({
    offset: 0,
    limit: 20,
  })
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [form, setForm] = useState<DeliverySlotFormValues>(emptyDeliverySlotForm())

  const { data, isLoading, isError } = useQuery<DeliverySlotListResponse>({
    queryKey: ["delivery-slots", pagination.offset, pagination.limit],
    queryFn: async () => {
      const response = await fetch(
        `/admin/delivery-slots?offset=${pagination.offset}&limit=${pagination.limit}`,
        {
          credentials: "include",
        }
      )

      if (!response.ok) {
        throw new Error("Failed to fetch delivery slots")
      }

      return response.json()
    },
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
    enabled: isCreateOpen,
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
      enabled: isCreateOpen,
    })

  const createDeliverySlotMutation = useMutation({
    mutationFn: async (payload: ReturnType<typeof buildDeliverySlotPayload>) => {
      const response = await fetch("/admin/delivery-slots", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error("Failed to create delivery slot")
      }

      return response.json()
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["delivery-slots"] })
      toast.success("Delivery slot created")
      setIsCreateOpen(false)
      setForm(emptyDeliverySlotForm())
    },
    onError: () => {
      toast.error("Failed to create delivery slot")
    },
  })

  const isFormValid = useMemo(() => isDeliverySlotFormValid(form), [form])

  const handlePaginationChange = (newOffset: number, newLimit: number) => {
    setPagination({
      offset: newOffset,
      limit: newLimit,
    })
  }

  const handleCreateSubmit = (event: React.FormEvent) => {
    event.preventDefault()

    if (!isFormValid) {
      return
    }

    createDeliverySlotMutation.mutate(buildDeliverySlotPayload(form))
  }

  const regions = regionsData?.regions ?? []
  const stockLocations = stockLocationsData?.stock_locations ?? []

  if (isLoading) {
    return (
      <Container className="px-8 py-10">
        <Heading>Delivery Slots</Heading>
        <Text className="text-gray-600 mt-4">Loading...</Text>
      </Container>
    )
  }

  if (isError) {
    return (
      <Container className="px-8 py-10">
        <Heading>Delivery Slots</Heading>
        <Text className="text-red-600 mt-4">Error loading delivery slots</Text>
      </Container>
    )
  }

  return (
    <Container className="px-8 py-10">
      <div className="flex items-center justify-between mb-6">
        <Heading>Delivery Slots</Heading>
        <div className="flex items-center gap-3">
          <Text className="text-sm text-gray-600">
            Total: {data?.count || 0} slots
          </Text>
          <Button onClick={() => setIsCreateOpen(true)}>Create Slot</Button>
        </div>
      </div>

      {data?.delivery_slots && data.delivery_slots.length > 0 ? (
        <div>
          <div className="overflow-x-auto border rounded">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                    Window
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                    Utilization
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.delivery_slots.map((slot) => (
                  <tr key={slot.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-3 text-sm text-gray-900">{slot.code}</td>
                    <td className="px-6 py-3 text-sm text-gray-600">
                      {formatDateTime(slot.start_at)} – {formatDateTime(slot.end_at)}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600">
                      {slot.active_reservations ?? 0} / {slot.capacity}
                    </td>
                    <td className="px-6 py-3 text-sm">
                      <Badge className={statusBadgeClassName(slot.status)}>
                        {slot.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-3 text-sm">
                      <Button
                        size="small"
                        variant="secondary"
                        onClick={() => {
                          window.location.href = `/app/delivery-slots/${slot.id}`
                        }}
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between mt-6">
            <Text className="text-sm text-gray-600">
              Showing {pagination.offset + 1} to{" "}
              {Math.min(pagination.offset + pagination.limit, data.count || 0)} of{" "}
              {data.count || 0}
            </Text>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  if (pagination.offset > 0) {
                    handlePaginationChange(
                      pagination.offset - pagination.limit,
                      pagination.limit
                    )
                  }
                }}
                disabled={pagination.offset === 0}
                variant="secondary"
              >
                Previous
              </Button>
              <Button
                onClick={() => {
                  if (
                    pagination.offset + pagination.limit <
                    (data?.count || 0)
                  ) {
                    handlePaginationChange(
                      pagination.offset + pagination.limit,
                      pagination.limit
                    )
                  }
                }}
                disabled={
                  pagination.offset + pagination.limit >= (data?.count || 0)
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
          <Text className="text-center text-gray-600">No delivery slots found</Text>
        </Container>
      )}

      <Drawer open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <Drawer.Content>
          <Drawer.Header>
            <Drawer.Title>Create Delivery Slot</Drawer.Title>
            <Drawer.Description>
              Define a delivery window and capacity for a region.
            </Drawer.Description>
          </Drawer.Header>
          <form onSubmit={handleCreateSubmit} className="space-y-4 p-6">
            <div className="space-y-2">
              <Label htmlFor="slot-code">Code</Label>
              <Input
                id="slot-code"
                value={form.code}
                onChange={(event) =>
                  setForm((current) => ({ ...current, code: event.target.value }))
                }
                placeholder="morning-slot-1"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slot-region">Region</Label>
              {isLoadingRegions ? (
                <Text className="text-ui-fg-subtle text-sm">Loading regions...</Text>
              ) : regions.length === 0 ? (
                <Text className="text-ui-fg-subtle text-sm">
                  No regions found. Create a region first.
                </Text>
              ) : (
                <Select
                  value={form.region_id}
                  onValueChange={(value) =>
                    setForm((current) => ({ ...current, region_id: value }))
                  }
                >
                  <Select.Trigger id="slot-region">
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
              <Label htmlFor="slot-stock-location">Stock Location</Label>
              {isLoadingStockLocations ? (
                <Text className="text-ui-fg-subtle text-sm">
                  Loading stock locations...
                </Text>
              ) : (
                <Select
                  value={form.stock_location_id || "none"}
                  onValueChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      stock_location_id: value === "none" ? "" : value,
                    }))
                  }
                >
                  <Select.Trigger id="slot-stock-location">
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
                <Label htmlFor="slot-start-at">Start</Label>
                <Input
                  id="slot-start-at"
                  type="datetime-local"
                  value={form.start_at}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      start_at: event.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slot-end-at">End</Label>
                <Input
                  id="slot-end-at"
                  type="datetime-local"
                  value={form.end_at}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      end_at: event.target.value,
                    }))
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="slot-capacity">Capacity</Label>
              <Input
                id="slot-capacity"
                type="number"
                min={1}
                value={form.capacity}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    capacity: event.target.value,
                  }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slot-status">Status</Label>
              <Select
                value={form.status}
                onValueChange={(value: "active" | "disabled") =>
                  setForm((current) => ({ ...current, status: value }))
                }
              >
                <Select.Trigger id="slot-status">
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
                onClick={() => setIsCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  !isFormValid ||
                  createDeliverySlotMutation.isPending ||
                  regions.length === 0
                }
              >
                {createDeliverySlotMutation.isPending ? "Creating..." : "Create Slot"}
              </Button>
            </div>
          </form>
        </Drawer.Content>
      </Drawer>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Delivery Slots",
})

export default DeliverySlotsPage
