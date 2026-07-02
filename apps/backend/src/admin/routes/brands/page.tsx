import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Container,
  Heading,
  Badge,
  Text,
  Button,
  Input,
  Label,
  Textarea,
  Drawer,
} from "@medusajs/ui"
import { defineRouteConfig } from "@medusajs/admin-sdk"

type Brand = {
  id: string
  name: string
  handle: string
  description: string | null
  created_at?: string | null
  updated_at?: string | null
}

const formatDate = (value?: string | null) => {
  if (!value) {
    return "—"
  }

  const parsedDate = new Date(value)

  if (Number.isNaN(parsedDate.getTime())) {
    return "—"
  }

  return parsedDate.toLocaleDateString()
}

const BrandsPage = () => {
  const queryClient = useQueryClient()
  const [pagination, setPagination] = useState({
    offset: 0,
    limit: 20,
  })
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [form, setForm] = useState({
    name: "",
    handle: "",
    description: "",
  })

  // Fetch brands with pagination
  const { data, isLoading, isError } = useQuery<{
    brands: Brand[]
    count: number
    offset: number
    limit: number
  }>({
    queryKey: ["brands", pagination.offset, pagination.limit],
    queryFn: async () => {
      const response = await fetch(
        `/admin/brands?offset=${pagination.offset}&limit=${pagination.limit}`,
        {
          credentials: "include",
        }
      )

      if (!response.ok) {
        throw new Error("Failed to fetch brands")
      }

      return response.json()
    },
  })

  const createBrandMutation = useMutation({
    mutationFn: async (payload: { name: string; handle: string; description?: string }) => {
      const response = await fetch("/admin/brands", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error("Failed to create brand")
      }

      return response.json()
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["brands"] })
      setIsCreateOpen(false)
      setForm({ name: "", handle: "", description: "" })
    },
  })

  const isFormValid = useMemo(() => {
    return form.name.trim() && form.handle.trim()
  }, [form.name, form.handle])

  // Handle pagination change
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

    createBrandMutation.mutate({
      name: form.name.trim(),
      handle: form.handle.trim(),
      description: form.description.trim() || undefined,
    })
  }

  if (isLoading) {
    return (
      <Container className="px-8 py-10">
        <Heading>Brands</Heading>
        <Text className="text-gray-600 mt-4">Loading...</Text>
      </Container>
    )
  }

  if (isError) {
    return (
      <Container className="px-8 py-10">
        <Heading>Brands</Heading>
        <Text className="text-red-600 mt-4">Error loading brands</Text>
      </Container>
    )
  }

  return (
    <Container className="px-8 py-10">
      <div className="flex items-center justify-between mb-6">
        <Heading>Brands</Heading>
        <div className="flex items-center gap-3">
          <Text className="text-sm text-gray-600">
            Total: {data?.count || 0} brands
          </Text>
          <Button onClick={() => setIsCreateOpen(true)}>Create Brand</Button>
        </div>
      </div>

      {data?.brands && data.brands.length > 0 ? (
        <div>
          <div className="overflow-x-auto border rounded">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Handle</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Description</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Created</th>
                </tr>
              </thead>
              <tbody>
                {data.brands.map((brand) => (
                  <tr key={brand.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-3 text-sm text-gray-900">{brand.name}</td>
                    <td className="px-6 py-3 text-sm">
                      <Badge className="bg-gray-100 text-gray-800">{brand.handle}</Badge>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600">
                      {brand.description || "—"}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600">
                      {formatDate(brand.created_at)}
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
          <Text className="text-center text-gray-600">No brands found</Text>
        </Container>
      )}

      <Drawer open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <Drawer.Content>
          <Drawer.Header>
            <Drawer.Title>Create Brand</Drawer.Title>
            <Drawer.Description>Create a new brand for your catalog.</Drawer.Description>
          </Drawer.Header>
          <form onSubmit={handleCreateSubmit} className="space-y-4 p-6">
            <div className="space-y-2">
              <Label htmlFor="brand-name">Name</Label>
              <Input
                id="brand-name"
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
                placeholder="Brand name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="brand-handle">Handle</Label>
              <Input
                id="brand-handle"
                value={form.handle}
                onChange={(event) =>
                  setForm((current) => ({ ...current, handle: event.target.value }))
                }
                placeholder="brand-handle"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="brand-description">Description</Label>
              <Textarea
                id="brand-description"
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({ ...current, description: event.target.value }))
                }
                placeholder="Optional description"
                rows={4}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!isFormValid || createBrandMutation.isPending}>
                {createBrandMutation.isPending ? "Creating..." : "Create Brand"}
              </Button>
            </div>
          </form>
        </Drawer.Content>
      </Drawer>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Brands",
})

export default BrandsPage
