import { StatItem } from '@/types/stats';
import { CheckCircle2, FileText, XCircle, AlertCircle } from 'lucide-react';
import { ManagementItem } from "@/types/dashboard";

export const managementData: ManagementItem[] = [
  {
    id: "restaurants",
    title: "Manage Restaurant & Branches",
    description:
      "Set up your restaurant details to run and manage everything with total control and ease.",
    actionLabel: "Manage Restaurant",
    actionHref: "/branches",
  },
  {
    id: "menu",
    title: "Manage Menu",
    description:
      "Manage food items and organize menus by type, category, or availability in seconds.",
    actionLabel: "Manage Menu",
    actionHref: "/menu",
  },
  {
    id: "orders",
    title: "Manage Orders",
    description:
      "Track real-time order status, customer details, and actions from placing an order to final delivery.",
    actionLabel: "Manage Orders",
    actionHref: "/orders",
  },
  {
    id: "pos",
    title: "Manage POS",
    description:
      "Track and manage table availability and reservations in real-time.",
    actionLabel: "Operate POS",
    actionHref: "/pos",
  },
  {
    id: "customers",
    title: "Customer Management",
    description:
      "Manage customer profiles, track activity, and build lasting relationships.",
    actionLabel: "Manage Customers",
    actionHref: "/customer-settings",
  },
  {
    id: "delivery",
    title: "Deliveryman Management",
    description:
      "Assign deliveries, monitor status, and manage delivery personnel.",
    actionLabel: "Manage Delivery Man",
    actionHref: "/deliveryman",
  },
  {
    id: "employees",
    title: "Employee Management",
    description:
      "Organize employee details, roles, and work schedules efficiently.",
    actionLabel: "Manage Employees",
    actionHref: "/employees-settings",
  },
  {
    id: "reports",
    title: "Report & Analytics",
    description:
      "Get detailed insights and track performance with real-time reports.",
    actionLabel: "View Reports",
    actionHref: "/reports",
  },
  {
    id: "promotions",
    title: "Promotion Management",
    description:
      "Manage and monitor promotions that boost revenue.",
    actionLabel: "Manage Promotions",
    actionHref: "/promotion-management",
  },
];

export const statsData: StatItem[] = [
  {
    _id: "revenue",
    title: "Total Revenue",
    value: "24",
    icon: "revenue",
    trend: {
      direction: "up",
      percentage: "+3%",
    },
  },
  {
    _id: "orders",
    title: "Total Orders",
    value: "24",
    icon: "orders",
    trend: {
      direction: "up",
      percentage: "+3%",
    },
  },
  {
    _id: "customers",
    title: "My Customers",
    value: "24",
    icon: "users",
    trend: {
      direction: "up",
      percentage: "+3%",
    },
  },
  {
    _id: "reservations",
    title: "Total Reservations",
    value: "24",
    icon: "store",
    trend: {
      direction: "down",
      percentage: "-1%",
    },
     iconStyle: "danger",
  },
];


export const systemHealth = [
  { label: "API Uptime", value: "99.9%", status: "success" },
  { label: "CPU Usage", value: "42%", status: "success" },
  { label: "RAM Usage", value: "76%", status: "warning" },
  { label: "Printer Status", value: "95% online", status: "success" },
  { label: "Webhook Status", value: "All active", status: "success" },
];

export const recentActivity = [
  {
    id: 1,
    title: 'New restaurant "Bella Italia" added to platform',
    time: "2 minutes ago",
    icon: CheckCircle2,
    color: "text-green-500",
    bg: "bg-[#DCFCE7]",
  },
  {
    id: 2,
    title: 'Monthly invoice generated for "Sushi Palace"',
    time: "15 minutes ago",
    icon: FileText,
    color: "text-blue-500",
    bg: "bg-[#DBEAFE]",
  },
  {
    id: 3,
    title: 'Restaurant "Burger House" temporarily deactivated',
    time: "1 hour ago",
    icon: XCircle,
    color: "text-orange-500",
    bg: "bg-[#FFEDD4]",
  },
  {
    id: 4,
    title: 'High RAM usage detected on server-3',
    time: "2 hours ago",
    icon: AlertCircle,
    color: "text-red-500",
    bg: "bg-primary/10",
  },
  {
    id: 5,
    title: 'New restaurant "Taco Fiesta" added to platform',
    time: "3 hours ago",
    icon: CheckCircle2,
    color: "text-green-500",
    bg: "bg-[#DCFCE7]",
  },
];