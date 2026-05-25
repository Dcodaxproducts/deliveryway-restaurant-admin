import { StatItem } from "@/types/stats";
export const statsData: StatItem[] = [
  {
    _id: "1",
    title: "Total Orders",
    value: "24",
    icon: "orders",
    trend: { direction: "up", percentage: "+3%" },
  },
  {
    _id: "2",
    title: "Ongoing",
    value: "12",
    icon: "ongoing",
    trend: { direction: "up", percentage: "+2%" },
  },
  {
    _id: "3",
    title: "Completed",
    value: "18",
    icon: "completed",
    trend: { direction: "up", percentage: "+5%" },
  },
  {
    _id: "4",
    title: "Cancelled",
    value: "2",
    icon: "cancelled",
    iconStyle: "danger",
    trend: { direction: "down", percentage: "-1%" },
  },
];
export const financialStatsData: StatItem[] = [
  {
    _id: "1",
    title: "Total Revenue",
    value: "$2882.44",
    icon: "revenue", // Updated to match ICON_MAP keys
    trend: { direction: "up", percentage: "+3%" },
  },
  {
    _id: "2",
    title: "Platform Commission",
    value: "$2882.44",
    icon: "store", // Updated to match ICON_MAP keys
    trend: { direction: "up", percentage: "+3%" },
  },
  {
    _id: "3",
    title: "Delivery Fee",
    value: "$2882.44",
    icon: "orders", // Updated to match ICON_MAP keys
    trend: { direction: "up", percentage: "+3%" },
  },
  {
    _id: "4",
    title: "Net Payout",
    value: "$2882.44",
    icon: "users", // Updated to match ICON_MAP keys
    trend: { direction: "down", percentage: "-1%" },
  },
];


export const ordersReport = [
  {
    id: "#5552375",
    customer: "Emilia Johanson",
    orderAmount: "$234.89",  // Total Order Amount
    discountAmount: "$12",  // Total Discount Amount
    taxAmount: "$0",  // Total Tax Amount
  },
  {
    id: "#5552376",
    customer: "Emilia Johanson",
    orderAmount: "$234.89",
    discountAmount: "$12",
    taxAmount: "$0",
  },
  {
    id: "#5552377",
    customer: "Emilia Johanson",
    orderAmount: "$234.89",
    discountAmount: "$12",
    taxAmount: "$0",
  },
  {
    id: "#5552378",
    customer: "Emilia Johanson",
    orderAmount: "$234.89",
    discountAmount: "$12",
    taxAmount: "$0",
  },
  {
    id: "#5552379",
    customer: "Emilia Johanson",
    orderAmount: "$234.89",
    discountAmount: "$12",
    taxAmount: "$0",
  },
  {
    id: "#5552380",
    customer: "Emilia Johanson",
    orderAmount: "$234.89",
    discountAmount: "$12",
    taxAmount: "$0",
  },
];
