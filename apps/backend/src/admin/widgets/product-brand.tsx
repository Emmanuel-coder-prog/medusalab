import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Text, Badge } from "@medusajs/ui"
import { DetailWidgetProps, AdminProduct } from "@medusajs/framework/types"

const ProductBrandWidget = ({ data }: DetailWidgetProps<AdminProduct>) => {
  // The product details page may include brand link data in the product object
  // For now, display a placeholder since the product-brand link endpoint is not yet implemented
  
  return (
    <Container className="mb-4">
      <Text className="font-medium h2-core mb-2">Brand</Text>
      <Text className="text-sm text-gray-500">Brand linking not yet configured</Text>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.after",
})

export default ProductBrandWidget
