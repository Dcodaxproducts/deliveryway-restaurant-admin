"use client"

import { useEffect, useState } from "react"
import { useHttpClient } from "@/hooks/useHttpClient"
import { useAuth } from "./useAuth"

export interface Category {
  id: string
  name: string
  slug?: string
}

export default function useCategories() {

  const { token, restaurantId } = useAuth()
  const { get, del, loading } = useHttpClient(token)

  const [categories, setCategories] = useState<Category[]>([])

const fetchCategories = async () => {
  if (!token || !restaurantId) return

  const data = await get(`/v1/menu/categories?restaurantId=${restaurantId}`)

  if (data.data) {
    setCategories(data.data)
  }
}
  const deleteCategory = async (id: string) => {
    const res = await del(`/v1/menu/categories/${id}`)

    if (res !== null) {
      setCategories((prev) => prev.filter((c) => c.id !== id))
    }
  }

useEffect(() => {
  if (!token || !restaurantId) return
  fetchCategories()
}, [token, restaurantId])

  return {
    categories,
    loading,
    refetch: fetchCategories,
    deleteCategory,
  }
}