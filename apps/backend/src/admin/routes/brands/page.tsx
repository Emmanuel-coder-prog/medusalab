import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  Container,
  Heading,
  Badge,
  Text,
  Button,
} from "@medusajs/ui"
import { defineRouteConfig } from "@medusajs/admin-sdk"

type Brand = {
  id: string
  name: string
  handle: string
  description: string | null
  created_at: string
  updated_at: string
}

const BrandsPage = () => {
  const [pagination, setPagination] = useState({
    offset: 0,
    limit: 20,
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

  // Handle pagination change
  const handlePaginationChange = (newOffset: number, newLimit: number) => {
    setPagination({
      offset: newOffset,
      limit: newLimit,
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
        <Text className="text-sm text-gray-600">
          Total: {data?.count || 0} brands
        </Text>
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
                      {new Date(brand.created_at).toLocaleDateString()}
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
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Brands",
})

export default BrandsPage
