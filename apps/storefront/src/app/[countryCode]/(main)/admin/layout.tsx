import { redirect } from "next/navigation"
import { retrieveCustomer } from "@lib/data/customer"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const customer = await retrieveCustomer().catch(() => null)

  if (!customer) {
    redirect("/login")
  }

  // TODO: Check customer permissions for admin access
  // For now, all customers can access (backend auth is authoritative)

  return <>{children}</>
}
