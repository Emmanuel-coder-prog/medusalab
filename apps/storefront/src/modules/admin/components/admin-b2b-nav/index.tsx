"use client"

import { usePathname, useParams } from "next/navigation"
import { clx } from "@modules/common/components/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ChevronDown from "@modules/common/icons/chevron-down"

const AdminB2BNav = () => {
  const route = usePathname()
  const { countryCode } = useParams() as { countryCode: string }

  const navLinks = [
    {
      name: "Dashboard",
      href: "/admin/b2b",
      testId: "admin-b2b-dashboard-link",
    },
    {
      name: "Purchase Requests",
      href: "/admin/b2b/quotes",
      testId: "admin-b2b-quotes-link",
    },
    {
      name: "Finance Reviews",
      href: "/admin/b2b/finance-reviews",
      testId: "admin-b2b-finance-link",
    },
    {
      name: "Exceptions & Issues",
      href: "/admin/b2b/exceptions",
      testId: "admin-b2b-exceptions-link",
    },
    {
      name: "Activity Log",
      href: "/admin/b2b/activity",
      testId: "admin-b2b-activity-link",
    },
  ]

  return (
    <div>
      <div className="small:hidden" data-testid="mobile-admin-b2b-nav">
        {route === `/${countryCode}/admin/b2b` ? (
          <>
            <div className="text-xl-semi mb-4 px-8">B2B Operations</div>
            <div className="text-base-regular">
              <ul>
                {navLinks.map((link) => (
                  <li key={link.href}>
                    <LocalizedClientLink
                      href={link.href}
                      className="flex items-center justify-between py-4 border-b border-gray-200 px-8"
                      data-testid={link.testId}
                    >
                      <>
                        <span>{link.name}</span>
                        <ChevronDown className="transform -rotate-90" />
                      </>
                    </LocalizedClientLink>
                  </li>
                ))}
              </ul>
            </div>
          </>
        ) : (
          <LocalizedClientLink
            href="/admin/b2b"
            className="flex items-center gap-x-2 text-small-regular py-2"
            data-testid="admin-b2b-main-link"
          >
            <>
              <ChevronDown className="transform rotate-90" />
              <span>B2B Operations</span>
            </>
          </LocalizedClientLink>
        )}
      </div>
      <div className="hidden small:block" data-testid="admin-b2b-nav">
        <div>
          <div className="pb-4">
            <h3 className="text-base-semi">B2B Operations</h3>
          </div>
          <div className="text-base-regular">
            <ul className="flex mb-0 justify-start items-start flex-col gap-y-4">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <AdminB2BNavLink
                    href={link.href}
                    route={route!}
                    data-testid={link.testId}
                  >
                    {link.name}
                  </AdminB2BNavLink>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

type AdminB2BNavLinkProps = {
  href: string
  route: string
  children: React.ReactNode
  "data-testid"?: string
}

const AdminB2BNavLink = ({
  href,
  route,
  children,
  "data-testid": testId,
}: AdminB2BNavLinkProps) => {
  const isActive =
    route === href || (href !== "/admin/b2b" && route.startsWith(href))

  return (
    <LocalizedClientLink
      href={href}
      className={clx("text-ui-fg-base", isActive && "font-semibold text-ui-fg-interactive")}
      data-testid={testId}
    >
      {children}
    </LocalizedClientLink>
  )
}

export default AdminB2BNav
