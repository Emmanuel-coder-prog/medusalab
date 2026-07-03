import {
  MedusaContainer
} from "@medusajs/framework/types";
import { sendRestockNotificationsWorkflow } from "../workflows/send-restock-notifications";

export default async function myCustomJob(container: MedusaContainer) {
  console.log("[check-restock] Job started")

  await sendRestockNotificationsWorkflow(container)
    .run()
}

export const config = {
  name: "check-restock",
  schedule: "* * * * *", // For debugging, change to `* * * * *`
};