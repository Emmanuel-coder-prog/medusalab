import React from "react"
import AdminB2BNav from "../components/admin-b2b-nav"

interface AdminB2BLayoutProps {
  children: React.ReactNode
}

const AdminB2BLayout: React.FC<AdminB2BLayoutProps> = ({ children }) => {
  return (
    <div className="flex-1 small:py-12" data-testid="admin-b2b-page">
      <div className="flex-1 content-container h-full max-w-7xl mx-auto bg-white flex flex-col">
        <div className="grid grid-cols-1 small:grid-cols-[240px_1fr] py-12 gap-6">
          <div>{<AdminB2BNav />}</div>
          <div className="flex-1">{children}</div>
        </div>
      </div>
    </div>
  )
}

export default AdminB2BLayout
