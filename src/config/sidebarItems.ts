import {
  LayoutGrid,
  Store,
  List,
  ShoppingBag,
  Monitor,
  Truck,
  UserCog,
  Gift,
  User,
  Printer,
  BarChart3,
  Bell,
  ShieldCheck,
  FileText,
  Tags,
  PackagePlus,
  ClipboardList,
  AlertTriangle,
  BadgeCheck,
  Coins,
} from "lucide-react";
import { PiUsersThree } from "react-icons/pi";

export type SidebarSection = "main" | "account";
export type SidebarRole = "BUSINESS_ADMIN" | "RESTAURANT_ADMIN" | "BRANCH_ADMIN";

export interface MenuItem {
  title: string;
  href?: string;
  icon: any;
  section: SidebarSection;
  children?: MenuItem[];
  roles?: SidebarRole[];
}

const restaurantAdminRoles: SidebarRole[] = ["BUSINESS_ADMIN", "RESTAURANT_ADMIN"];
const allAdminRoles: SidebarRole[] = ["BUSINESS_ADMIN", "RESTAURANT_ADMIN", "BRANCH_ADMIN"];
const branchAdminOnly: SidebarRole[] = ["BRANCH_ADMIN"];

export const menuItems: MenuItem[] = [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutGrid,
    section: "main",
    roles: allAdminRoles,
  },
  {
    title: "Branch Management",
    href: "/branches",
    icon: Store,
    section: "main",
    roles: restaurantAdminRoles,
  },
  {
    title: "My Branch",
    href: "/branch-workspace",
    icon: Store,
    section: "main",
    roles: branchAdminOnly,
  },
  {
    title: "Menu Management",
    href: "/menu",
    icon: List,
    section: "main",
    roles: allAdminRoles,
    children: [
      {
        title: "Menu",
        href: "/menu",
        icon: List,
        section: "main",
        roles: allAdminRoles,
      },
      {
        title: "Categories",
        href: "/menu/categories",
        icon: ClipboardList,
        section: "main",
        roles: allAdminRoles,
      },
      {
        title: "Modifiers",
        href: "/menu/modifier",
        icon: Tags,
        section: "main",
        roles: restaurantAdminRoles,
      },
      {
        title: "Variations",
        href: "/menu/variations",
        icon: ClipboardList,
        section: "main",
        roles: restaurantAdminRoles,
      },
      {
        title: "Items",
        href: "/menu/items",
        icon: PackagePlus,
        section: "main",
        roles: allAdminRoles,
      },
      {
        title: "Allergen",
        href: "/menu/allergen",
        icon: AlertTriangle,
        section: "main",
        roles: restaurantAdminRoles,
      },
      {
        title: "Labels",
        href: "/menu/labels",
        icon: BadgeCheck,
        section: "main",
        roles: restaurantAdminRoles,
      },
    ],
  },
  {
    title: "Order Management",
    href: "/orders",
    icon: ShoppingBag,
    section: "main",
    roles: allAdminRoles,
  },
  {
    title: "POS Management",
    href: "/pos",
    icon: Monitor,
    section: "main",
    roles: allAdminRoles,
  },
  {
    title: "Inventory",
    href: "/inventory",
    icon: PackagePlus,
    section: "main",
    roles: branchAdminOnly,
  },
  {
    title: "Customer Management",
    href: "/customer-settings",
    icon: PiUsersThree,
    section: "main",
    roles: allAdminRoles,
  },
  {
    title: "Loyalty Program",
    href: "/loyalty",
    icon: Coins,
    section: "main",
    roles: allAdminRoles,
  },
  {
    title: "Deliveryman",
    href: "/deliveryman",
    icon: Truck,
    section: "main",
    roles: allAdminRoles,
  },
  {
    title: "Employees",
    href: "/employees-settings",
    icon: UserCog,
    section: "main",
    roles: allAdminRoles,
  },
  {
    title: "Promotion Management",
    href: "/promotion-management",
    icon: Gift,
    section: "main",
    roles: restaurantAdminRoles,
  },
  {
    title: "Content Management",
    href: "/content-management",
    icon: FileText,
    section: "main",
    roles: restaurantAdminRoles,
    children: [
      {
        title: "Faqs",
        href: "/faqs",
        icon: FileText,
        section: "main",
        roles: restaurantAdminRoles,
      },
      {
        title: "Privacy Policy",
        href: "/privacy-policy",
        icon: ShieldCheck,
        section: "main",
        roles: restaurantAdminRoles,
      },
    ],
  },
  {
    title: "Profile",
    href: "/profile",
    icon: User,
    section: "account",
    roles: allAdminRoles,
  },
  {
    title: "Auto-Printing / POS",
    href: "/auto-printing",
    icon: Printer,
    section: "account",
    roles: allAdminRoles,
  },
  {
    title: "Reports & Payouts",
    href: "/reports",
    icon: BarChart3,
    section: "account",
    roles: allAdminRoles,
  },

  {
    title: "Notifications",
    href: "/notifications",
    icon: Bell,
    section: "account",
    roles: allAdminRoles,
  },
  {
    title: "Notification Settings",
    href: "/notification-settings",
    icon: Bell,
    section: "account",
    roles: restaurantAdminRoles,
  },
];
