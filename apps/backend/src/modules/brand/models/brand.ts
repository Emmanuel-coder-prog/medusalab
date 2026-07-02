import { model } from "@medusajs/framework/utils"

const Brand = model.define("brand", {
  id: model.id().primaryKey(),
  name: model.text(),
  description: model.text().nullable(),
  handle: model.text().unique(),
  metadata: model.json().nullable(),
})

export default Brand