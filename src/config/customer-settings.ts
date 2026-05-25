import {
  Users,
  UserPlus,
  UserCheck,
  UserX,
} from "lucide-react";

export type StatTrend = "up" | "down";

export type StatVariant = "default" | "danger";

export type StatItem = {
    _id:string,
  title: string;
  value: number;
  icon: any;
  trend: {
    direction: StatTrend;
    percentage: string;
  };
  variant?: StatVariant;
};

export const statsData: StatItem[] = [
  {
    _id:"1",
    title: "All Customers",
    value: 24,
    icon: Users,
    trend: { direction: "up", percentage: "+3%" },
  },
  {
    _id:"2",
    title: "New Customers",
    value: 24,
    icon: UserPlus,
    trend: { direction: "up", percentage: "+3%" },
  },
  {
    _id:"3",
    title: "Active Customers",
    value: 24,
    icon: UserCheck,
    trend: { direction: "up", percentage: "+3%" },
  },
  {
    _id:"4",
    title: "Blocked Customers",
    value: 24,
    icon: UserX,
    trend: { direction: "down", percentage: "-1%" },
    variant: "danger",
  },
];

export const customersData = [
    {
        sl: 1,
        deliveryManName: "Emilia Johanson",
        phone: "+921212121212",
        email: "example@gmail.com",
        orderLimit: 3,
        joiningDate:"12/13/2025 07:01 PM",
        status: true,
    },
    // Add 6 more similar objects to make a total of 7
    {
        sl: 2,
        deliveryManName: "Emilia Johanson",
        phone: "+921212121212",
        email: "example@gmail.com",
        orderLimit: 3,
        joiningDate:"12/13/2025 07:01 PM",
        status: true,
    },
    {
        sl: 3,
        deliveryManName: "Emilia Johanson",
        phone: "+921212121212",
        email: "example@gmail.com",
        orderLimit: 3,
        joiningDate:"12/13/2025 07:01 PM",
        status: true,
    },
    {
        sl: 4,
        deliveryManName: "Emilia Johanson",
        phone: "+921212121212",
        email: "example@gmail.com",
        orderLimit: 3,
        joiningDate:"12/13/2025 07:01 PM",
        status: true,
    },
    {
        sl: 5,
        deliveryManName: "Emilia Johanson",
        phone: "+921212121212",
        email: "example@gmail.com",
        orderLimit: 3,
        joiningDate:"12/13/2025 07:01 PM",
        status: true,
    },
    {
        sl: 6,
        deliveryManName: "Emilia Johanson",
        phone: "+921212121212",
        email: "example@gmail.com",
        orderLimit: 3,
        joiningDate:"12/13/2025 07:01 PM",
        status: true,
    },
    {
        sl: 7,
        deliveryManName: "Emilia Johanson",
        phone: "+921212121212",
        email: "example@gmail.com",
        orderLimit: 3,
        joiningDate:"12/13/2025 07:01 PM",
        status: true,
    },
];
