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
    title: "Total Delivery Man",
    value: 24,
    icon: Users,
  },
   {
    title: "Active Delivery Man",
    value: 24,
      icon: UserX,
  
  },
  {
    title: "Engaged Delivery Man",
    value: 24,
  icon: UserCheck,
    
},
  {
    title: "Free Delivery Man",
    value: 24,
      icon: UserX,
  
  }
];

export const deliveryManData = [
    {
        sl: 1,
        deliveryManName: "Emilia Johanson",
        phone: "+921212121212",
        email: "example@gmail.com",
        orderLimit: 3,
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
        deliveryManName: "Emilia Johanson",
        phone: "+921212121212",
        email: "example@gmail.com",
        orderLimit: 3,
        branch: {
            currentlyAssign: 43,
            outForDelivery: 23,
            ongoingOrder: 1,
        },
        status: true,
    },
    {
        sl: 3,
        deliveryManName: "Emilia Johanson",
        phone: "+921212121212",
        email: "example@gmail.com",
        orderLimit: 3,
        branch: {
            currentlyAssign: 43,
            outForDelivery: 23,
            ongoingOrder: 1,
        },
        status: true,
    },
    {
        sl: 4,
        deliveryManName: "Emilia Johanson",
        phone: "+921212121212",
        email: "example@gmail.com",
        orderLimit: 3,
        branch: {
            currentlyAssign: 43,
            outForDelivery: 23,
            ongoingOrder: 1,
        },
        status: true,
    },
    {
        sl: 5,
        deliveryManName: "Emilia Johanson",
        phone: "+921212121212",
        email: "example@gmail.com",
        orderLimit: 3,
        branch: {
            currentlyAssign: 43,
            outForDelivery: 23,
            ongoingOrder: 1,
        },
        status: true,
    },
    {
        sl: 6,
        deliveryManName: "Emilia Johanson",
        phone: "+921212121212",
        email: "example@gmail.com",
        orderLimit: 3,
        branch: {
            currentlyAssign: 43,
            outForDelivery: 23,
            ongoingOrder: 1,
        },
        status: true,
    },
    {
        sl: 7,
        deliveryManName: "Emilia Johanson",
        phone: "+921212121212",
        email: "example@gmail.com",
        orderLimit: 3,
        branch: {
            currentlyAssign: 43,
            outForDelivery: 23,
            ongoingOrder: 1,
        },
        status: true,
    },
];
