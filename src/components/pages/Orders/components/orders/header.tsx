"use client"

import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import Header from "@/components/common/PageHeader"
import { useRouter } from "next/navigation"

interface Order {
  id: string
  orderType?: string
  status?: string
  totalAmount?: number
  createdAt?: string
  paymentMethod?: string
  paymentStatus?: string
  customer?: {
    fullName?: string
    phone?: string
    email?: string
  }
}

interface HeaderProps {
  title: string
  description: string
  orders: Order[]
}

export default function OrdersHeader({
  title,
  description,
  orders,
}: HeaderProps) {
  const router = useRouter()

  //  CSV GENERATOR
  const handleExport = () => {
    if (!orders || orders.length === 0) return

    const headers = [
      "Order ID",
      "Customer Name",
      "Phone",
      "Email",
      "Order Type",
      "Status",
      "Payment Method",
      "Payment Status",
      "Amount",
      "Date",
    ]

    const rows = orders.map((o) => [
      o.id,
      o.customer?.fullName || "",
      o.customer?.phone || "",
      o.customer?.email || "",
      o.orderType || "",
      o.status || "",
      o.paymentMethod || "",
      o.paymentStatus || "",
      o.totalAmount ?? 0,
      o.createdAt
        ? new Date(o.createdAt).toLocaleString()
        : "",
    ])

    const csvContent =
      [headers, ...rows]
        .map((row) => row.map((val) => `"${val}"`).join(","))
        .join("\n")

    //  CREATE FILE
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)

    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", `orders-${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <>
      <div className="flex gap-4 md:gap-6 lg:flex-row lg:items-center justify-between w-full">
        <Header title={title} description={description} />

        <div className="flex sm:flex-row items-stretch sm:items-center gap-3 lg:gap-4">
          <Button
            onClick={handleExport}
            variant="outline"
            className="w-fit sm:w-auto justify-between sm:justify-start flex items-center gap-2"
          >
            <Download size={18} className="text-gray-600" />
            <p className="pt-1">Export</p>
          </Button>
        </div>
      </div>
    </>
  )
}