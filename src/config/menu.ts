
export type MenuItem = {
  id: string;
  name: string;
  price: number;
  discount?: string;
  rating: number;
  image: string;
};

export type Menu = {
  id: number;
  name: string;
  isDefault: boolean;
  items: MenuItem[];
};

export const menus: Menu[] = [
  {
    id: 10001,
    name: "Default Menu",
    isDefault: true,
    items: [
      {
        id: "#10001",
        name: "Fish Burger",
        price: 5.59,
        discount: "15% Off",
        rating: 4.9,
        image: "/burgerTwo.jpg",
      },
      {
        id: "#10002",
        name: "Chicken Burger",
        price: 6.49,
        discount: "10% Off",
        rating: 4.7,
        image: "/burgerTwo.jpg",
      },
      {
        id: "#10003",
        name: "Veggie Burger",
        price: 4.99,
        discount: "20% Off",
        rating: 4.8,
        image: "/burgerTwo.jpg",
      },
      {
        id: "#10004",
        name: "Cheese Burger",
        price: 5.99,
        discount: "5% Off",
        rating: 4.6,
        image: "/burgerTwo.jpg",
      },
    ],
  },
];
