import {
  Users,
  UserCheck,
  UserX,
} from "lucide-react";

export type StatItem = {
  title: string;
  value: number;
  icon: any;
};

export const statsData: StatItem[] = [
  {
    title: "Total Employees",
    value: 24,
    icon: Users,
  },
  {
    title: "Active Employees",
    value: 24,
  icon: UserCheck,
    
},
  {
    title: "Inactive Employees",
    value: 24,
      icon: UserX,
  
  },
];

export const employeesData = [
    {
        sl: 1,
        employeeName: "Emilia Johanson",
        phone: "+921212121212",
        email: "example@gmail.com",
        role: "Manager",
        branch: {
            currentlyAssign: 43,
            outForDelivery: 23,
            ongoingOrder: 1,
        },
        status: true,
    },
    // Add 6 more similar objects to make a total of 7
    {
        sl: 2,
        employeeName: "Emilia Johanson",
        phone: "+921212121212",
        email: "example@gmail.com",
        role: "Manager",
        branch: {
            currentlyAssign: 43,
            outForDelivery: 23,
            ongoingOrder: 1,
        },
        status: true,
    },
    {
        sl: 3,
        employeeName: "Emilia Johanson",
        phone: "+921212121212",
        email: "example@gmail.com",
        role: "Manager",
        branch: {
            currentlyAssign: 43,
            outForDelivery: 23,
            ongoingOrder: 1,
        },
        status: true,
    },
    {
        sl: 4,
        employeeName: "Emilia Johanson",
        phone: "+921212121212",
        email: "example@gmail.com",
        role: "Manager",
        branch: {
            currentlyAssign: 43,
            outForDelivery: 23,
            ongoingOrder: 1,
        },
        status: true,
    },
    {
        sl: 5,
        employeeName: "Emilia Johanson",
        phone: "+921212121212",
        email: "example@gmail.com",
        role: "Manager",
        branch: {
            currentlyAssign: 43,
            outForDelivery: 23,
            ongoingOrder: 1,
        },
        status: true,
    },
    {
        sl: 6,
        employeeName: "Emilia Johanson",
        phone: "+921212121212",
        email: "example@gmail.com",
        role: "Manager",
        branch: {
            currentlyAssign: 43,
            outForDelivery: 23,
            ongoingOrder: 1,
        },
        status: true,
    },
    {
        sl: 7,
        employeeName: "Emilia Johanson",
        phone: "+921212121212",
        email: "example@gmail.com",
        role: "Manager",
        branch: {
            currentlyAssign: 43,
            outForDelivery: 23,
            ongoingOrder: 1,
        },
        status: true,
    },
];
