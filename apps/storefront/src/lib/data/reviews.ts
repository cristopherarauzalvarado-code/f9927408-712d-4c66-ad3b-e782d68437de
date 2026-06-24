"use server"

import { sdk } from "@lib/config"
import { getAuthHeaders, getCacheOptions } from "./cookies"
import { revalidateTag } from "next/cache"

export type Review = {
  id: string
  product_id: string
  customer_id: string
  rating: number
  content: string | null
  status: string
  created_at: string
}

export type ReviewsResponse = {
  reviews: Review[]
  count: number
  limit: number
  offset: number
}

export const listProductReviews = async ({
  productId,
  limit = 10,
  offset = 0,
}: {
  productId: string
  limit?: number
  offset?: number
}): Promise<ReviewsResponse> => {
  const next = await getCacheOptions(`reviews-${productId}`)

  return sdk.client.fetch<ReviewsResponse>(
    `/store/products/${productId}/reviews`,
    {
      query: { limit, offset },
      next,
    }
  )
}

export const submitReview = async ({
  productId,
  rating,
  content,
}: {
  productId: string
  rating: number
  content?: string
}): Promise<{ review: Review }> => {
  const authHeaders = await getAuthHeaders()

  if (!("authorization" in authHeaders)) {
    throw new Error("You must be logged in to submit a review")
  }

  const result = await sdk.client.fetch<{ review: Review }>(
    `/store/products/${productId}/reviews`,
    {
      method: "POST",
      headers: authHeaders,
      body: { rating, content },
    }
  )

  revalidateTag(`reviews-${productId}`)

  return result
}
