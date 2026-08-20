import { retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import { listB2BOrganizations, getB2BCartContextFromCookie } from "@lib/data/b2b"
import CartTemplate from "@modules/cart/templates"
import B2BCartWrapper from "@modules/cart/templates/b2b-cart-wrapper"
import { Metadata } from "next"
import { notFound } from "next/navigation"

export const metadata: Metadata = {
  title: "Cart",
  description: "View your cart",
}

export default async function Cart() {
  const cart = await retrieveCart().catch((error) => {
    console.error(error)
    return notFound()
  })

  const customer = await retrieveCustomer()
  
  // Load B2B organizations for authenticated customers
  const organizations = customer ? await listB2BOrganizations() : []
  const cartContext = cart ? await getB2BCartContextFromCookie() : null

  return (
    <B2BCartWrapper
      organizations={organizations}
      cartId={cart?.id ?? null}
      currentCartContext={cartContext}
    >
      <CartTemplate cart={cart} customer={customer} />
    </B2BCartWrapper>
  )
}
