"use server"

import { sdk } from "@lib/config"
import medusaError from "@lib/util/medusa-error"
import { cache } from "react"
import { getAuthHeaders } from "./cookies"

export const retrieveOrder = cache(async function (id: string) {
  return sdk.store.order
    .retrieve(
      id,
      { fields: "*payment_collections.payments" },
      { next: { tags: ["order"] }, ...getAuthHeaders() }
    )
    .then(({ order }) => order)
    .catch((err) => medusaError(err))
})

export const listOrders = cache(async function () {
  const orders = sdk.store.order
    .list({}, { next: { tags: ["order"] }, ...getAuthHeaders() })
    .then(({ orders }) => orders)
    .catch((err) => medusaError(err))

  console.log("orders", orders)
  console.log("getAuthHeaders", getAuthHeaders())
  sdk.store.order.list({}, { next: { tags: ["order"] }, ...getAuthHeaders() }).then(({ orders }) => console.log("order", orders))
  console.log("getAuthHeaders", await orders)

  return orders
})