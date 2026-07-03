import { Html, Head, Preview, Body } from "@react-email/components"
import { ProductVariantDTO } from "@medusajs/framework/types"

type VariantRestockEmailProps = {
  variant?: ProductVariantDTO
  productTitle?: string
  variantTitle?: string
  productImage?: string
  formattedPrice?: string
  currencyCode?: string
  productHandle?: string
  productUrl?: string
}

function formatPrice(variant?: ProductVariantDTO | Record<string, any>) {
  const runtimeVariant = variant as any
  const amount = runtimeVariant?.prices?.[0]?.amount ?? runtimeVariant?.calculated_price ?? runtimeVariant?.original_price
  const currency = runtimeVariant?.prices?.[0]?.currency_code ?? runtimeVariant?.currency_code

  if (amount == null) {
    return "Price unavailable"
  }

  const value = typeof amount === "string" ? parseFloat(amount) : amount
  if (Number.isNaN(value)) {
    return "Price unavailable"
  }

  if (!currency) {
    return value.toFixed(2)
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
  }).format(value)
}

export default function VariantRestockEmail({
  variant,
  productTitle: productTitleProp,
  variantTitle: variantTitleProp,
  productImage: productImageProp,
  formattedPrice: formattedPriceProp,
  currencyCode,
  productHandle,
  productUrl: productUrlProp,
}: VariantRestockEmailProps) {
  const runtimeVariant = variant as Record<string, any> | undefined

  const productTitle =
    productTitleProp ??
    runtimeVariant?.product?.title ??
    runtimeVariant?.product_title ??
    "Your product"
  const variantTitle =
    variantTitleProp ?? runtimeVariant?.title ?? "Product variant"
  const imageUrl =
    productImageProp ??
    runtimeVariant?.thumbnail ??
    runtimeVariant?.product?.thumbnail ??
    ""
  const price =
    formattedPriceProp ??
    formatPrice(runtimeVariant)
  const productUrlValue = productUrlProp ?? ""

  return (
    <Html>
      <Head />
      <Preview>{`${productTitle} is back in stock!`}</Preview>
      <Body style={{ margin: 0, padding: 0, backgroundColor: "#f2f4f7", color: "#1f2937" }}>
        <table
          role="presentation"
          style={{ width: "100%", minWidth: "100%", borderCollapse: "collapse", backgroundColor: "#f2f4f7" }}
        >
          <tbody>
            <tr>
              <td align="center" style={{ padding: "20px 16px" }}>
                <table
                  role="presentation"
                  style={{
                    width: "100%",
                    maxWidth: "620px",
                    borderCollapse: "collapse",
                    borderRadius: "18px",
                    overflow: "hidden",
                    backgroundColor: "#ffffff",
                    boxShadow: "0 16px 50px rgba(15, 23, 42, 0.08)",
                  }}
                >
                  <tbody>
                    <tr>
                      <td style={{ padding: "24px", backgroundColor: "#111827" }}>
                        <table role="presentation" style={{ width: "100%", borderCollapse: "collapse" }}>
                          <tbody>
                            <tr>
                              <td style={{ verticalAlign: "middle" }}>
                                <div
                                  style={{
                                    display: "inline-block",
                                    width: "44px",
                                    height: "44px",
                                    borderRadius: "12px",
                                    backgroundColor: "#2563eb",
                                    textAlign: "center",
                                    lineHeight: "44px",
                                    fontSize: "20px",
                                    fontWeight: 700,
                                    color: "#ffffff",
                                  }}
                                >
                                  M
                                </div>
                              </td>
                              <td style={{ textAlign: "right", color: "#ffffff", fontSize: "14px", letterSpacing: "0.06em" }}>
                                Restock Alert
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: "32px 24px 16px" }}>
                        <p
                          style={{
                            margin: 0,
                            color: "#6b7280",
                            fontSize: "16px",
                            lineHeight: "26px",
                          }}
                        >
                          Hi there,
                        </p>
                        <h1
                          style={{
                            margin: "16px 0 0",
                            color: "#111827",
                            fontSize: "32px",
                            lineHeight: "40px",
                            fontWeight: 700,
                          }}
                        >
                          {productTitle} is back in stock.
                        </h1>
                        <p
                          style={{
                            margin: "16px 0 0",
                            color: "#4b5563",
                            fontSize: "17px",
                            lineHeight: "26px",
                          }}
                        >
                          Your requested item is available again. Reserve it now before it sells out once more.
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: "0 24px 24px" }}>
                        <table
                          role="presentation"
                          style={{ width: "100%", borderCollapse: "collapse" }}
                        >
                          <tbody>
                            <tr>
                              <td
                                style={{
                                  width: "180px",
                                  paddingBottom: "16px",
                                }}
                              >
                                <div
                                  style={{
                                    width: "100%",
                                    borderRadius: "16px",
                                    overflow: "hidden",
                                    backgroundColor: "#f9fafb",
                                  }}
                                >
                                  {imageUrl ? (
                                    <a href={productUrlValue} style={{ display: "block" }}>
                                      <img
                                        src={imageUrl}
                                        alt={productTitle}
                                        width="100%"
                                        style={{
                                          display: "block",
                                          width: "100%",
                                          height: "auto",
                                        }}
                                      />
                                    </a>
                                  ) : (
                                    <div
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        height: "180px",
                                        color: "#9ca3af",
                                        fontSize: "14px",
                                        backgroundColor: "#f3f4f6",
                                      }}
                                    >
                                      Product image
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td style={{ paddingLeft: "20px", verticalAlign: "top" }}>
                                <div
                                  style={{
                                    padding: "18px 18px 16px",
                                    borderRadius: "18px",
                                    backgroundColor: "#f8fafc",
                                    border: "1px solid #e5e7eb",
                                  }}
                                >
                                  <p
                                    style={{
                                      margin: 0,
                                      color: "#6b7280",
                                      fontSize: "14px",
                                      lineHeight: "22px",
                                      textTransform: "uppercase",
                                      letterSpacing: "0.08em",
                                    }}
                                  >
                                    Product
                                  </p>
                                  <h2
                                    style={{
                                      margin: "12px 0 8px",
                                      color: "#111827",
                                      fontSize: "20px",
                                      lineHeight: "28px",
                                      fontWeight: 700,
                                    }}
                                  >
                                    {productTitle}
                                  </h2>
                                  <p
                                    style={{
                                      margin: 0,
                                      color: "#4b5563",
                                      fontSize: "16px",
                                      lineHeight: "24px",
                                    }}
                                  >
                                    Variant: {variantTitle}
                                  </p>
                                  <p
                                    style={{
                                      margin: "18px 0 0",
                                      color: "#111827",
                                      fontSize: "24px",
                                      lineHeight: "32px",
                                      fontWeight: 700,
                                    }}
                                  >
                                    {price}
                                  </p>
                                  <p
                                    style={{
                                      margin: "16px 0 0",
                                      color: "#16a34a",
                                      fontSize: "16px",
                                      lineHeight: "24px",
                                      fontWeight: 600,
                                    }}
                                  >
                                    Available now — order today to avoid missing out.
                                  </p>
                                </div>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: "0 24px 32px" }}>
                        <div style={{ textAlign: "center" }}>
                          <a
                            href={productUrlValue}
                            style={{
                              display: "inline-block",
                              width: "100%",
                              maxWidth: "280px",
                              textDecoration: "none",
                              backgroundColor: "#2563eb",
                              color: "#ffffff",
                              padding: "14px 18px",
                              borderRadius: "10px",
                              fontSize: "16px",
                              fontWeight: 700,
                            }}
                          >
                            View Product
                          </a>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td
                        style={{
                          padding: "20px 24px 32px",
                          borderTop: "1px solid #e5e7eb",
                          backgroundColor: "#f8fafc",
                        }}
                      >
                        <p
                          style={{
                            margin: "0 0 8px",
                            color: "#6b7280",
                            fontSize: "14px",
                            lineHeight: "22px",
                          }}
                        >
                          Thank you for choosing Medusa.
                        </p>
                        <p
                          style={{
                            margin: 0,
                            color: "#6b7280",
                            fontSize: "14px",
                            lineHeight: "22px",
                          }}
                        >
                          If you have any questions, feel free to reply to this email.
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td
                        style={{
                          padding: "18px 24px",
                          textAlign: "center",
                          color: "#9ca3af",
                          fontSize: "12px",
                          lineHeight: "18px",
                        }}
                      >
                        Medusa • Professional ecommerce notifications
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </Body>
    </Html>
  )
}
