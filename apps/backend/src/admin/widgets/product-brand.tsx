import { useEffect, useState } from "react"
import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { DetailWidgetProps, AdminProduct } from "@medusajs/framework/types"
import {
  Button,
  clx,
  Container,
  Drawer,
  Heading,
  Label,
  Select,
  Text,
  toast,
} from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { sdk } from "../lib/sdk"

type Brand = {
  id: string
  name: string
  handle: string
}

type AdminProductBrand = AdminProduct & {
  brand?: Brand
}

const ProductBrandWidget = ({
  data: product,
}: DetailWidgetProps<AdminProduct>) => {
  const queryClient = useQueryClient()
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [selectedBrandId, setSelectedBrandId] = useState("")

  const { data: queryResult, isLoading } = useQuery({
    queryFn: () =>
      sdk.admin.product.retrieve(product.id, {
        fields: "+brand.*",
      }),
    queryKey: ["product", product.id, "brand"],
  })

  const brand = (queryResult?.product as AdminProductBrand)?.brand

  const { data: brandsData, isLoading: isLoadingBrands } = useQuery({
    queryKey: ["brands", "all"],
    queryFn: async () => {
      const response = await fetch("/admin/brands?limit=100", {
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to fetch brands")
      }

      return response.json() as Promise<{ brands: Brand[] }>
    },
    enabled: isDrawerOpen,
  })

  useEffect(() => {
    if (isDrawerOpen) {
      setSelectedBrandId(brand?.id ?? "")
    }
  }, [isDrawerOpen, brand?.id])

  const linkBrandMutation = useMutation({
    mutationFn: async (brandId: string) => {
      const response = await fetch(`/admin/products/${product.id}/brand`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ brand_id: brandId }),
      })

      if (!response.ok) {
        throw new Error("Failed to link brand")
      }

      return response.json()
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["product", product.id, "brand"],
      })
      toast.success("Brand linked to product")
      setIsDrawerOpen(false)
    },
    onError: () => {
      toast.error("Failed to link brand")
    },
  })

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()

    if (!selectedBrandId) {
      return
    }

    linkBrandMutation.mutate(selectedBrandId)
  }

  const brands = brandsData?.brands ?? []

  return (
    <>
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <Heading level="h2">Brand</Heading>
          <Button
            size="small"
            variant="secondary"
            onClick={() => setIsDrawerOpen(true)}
          >
            {brand ? "Change Brand" : "Link Brand"}
          </Button>
        </div>
        <div
          className={clx(
            "text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4"
          )}
        >
          <Text size="small" weight="plus" leading="compact">
            Name
          </Text>

          <Text
            size="small"
            leading="compact"
            className="whitespace-pre-line text-pretty"
          >
            {isLoading ? "Loading..." : brand?.name || "No brand linked"}
          </Text>
        </div>
      </Container>

      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <Drawer.Content>
          <Drawer.Header>
            <Drawer.Title>
              {brand ? "Change Product Brand" : "Link Product Brand"}
            </Drawer.Title>
            <Drawer.Description>
              Select a brand to associate with this product.
            </Drawer.Description>
          </Drawer.Header>
          <form onSubmit={handleSubmit} className="space-y-4 p-6">
            <div className="space-y-2">
              <Label htmlFor="product-brand-select">Brand</Label>
              {isLoadingBrands ? (
                <Text className="text-ui-fg-subtle text-sm">Loading brands...</Text>
              ) : brands.length === 0 ? (
                <Text className="text-ui-fg-subtle text-sm">
                  No brands found. Create one from the Brands page first.
                </Text>
              ) : (
                <Select
                  value={selectedBrandId}
                  onValueChange={setSelectedBrandId}
                >
                  <Select.Trigger id="product-brand-select">
                    <Select.Value placeholder="Select a brand" />
                  </Select.Trigger>
                  <Select.Content>
                    {brands.map((item) => (
                      <Select.Item key={item.id} value={item.id}>
                        {item.name}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsDrawerOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  !selectedBrandId ||
                  linkBrandMutation.isPending ||
                  brands.length === 0
                }
              >
                {linkBrandMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        </Drawer.Content>
      </Drawer>
    </>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.after",
})

export default ProductBrandWidget
