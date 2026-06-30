import { QueryClientProviderWrapper } from "@lib/providers/query-client-provider"
import { getBaseURL } from "@lib/util/env"
import { Metadata } from "next"
import "styles/globals.css"

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
}

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en" data-mode="light">
      <body>
        <QueryClientProviderWrapper>
          <main className="relative">{props.children}</main>
        </QueryClientProviderWrapper>
      </body>
    </html>
  )
}
