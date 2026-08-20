import AdminB2BLayout from "@modules/admin/templates/admin-b2b-layout"

export default function AdminB2BRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AdminB2BLayout>{children}</AdminB2BLayout>
}
