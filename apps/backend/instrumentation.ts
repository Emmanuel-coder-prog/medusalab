import { registerOtel } from "@medusajs/medusa"
import { ZipkinExporter } from "@opentelemetry/exporter-zipkin"

const exporter = new ZipkinExporter({
  serviceName: "medusa-mastery-lab",
})

export function register() {
  registerOtel({
    serviceName: "medusa-mastery-lab",
    exporter,

    instrument: {
      http: true,
      workflows: true,
      query: true,
      db: true,
      cache: true,
    },
  })
}