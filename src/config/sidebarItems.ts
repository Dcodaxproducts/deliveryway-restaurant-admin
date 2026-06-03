import {
  LayoutGrid,
  Store,
  List,
  ShoppingBag,
  CalendarCheck,
  Monitor,
  Truck,
  UserCog,
  Gift,
  User,
  Printer,
  BarChart3,
  Bell,
  Palette,
  ShieldCheck,
  FileText,
  Tags,
  PackagePlus,
  ClipboardList,
  AlertTriangle,
  BadgeCheck,
  BadgePercent,
  Coins,
} from "lucide-react";
import { PiUsersThree } from "react-icons/pi";

export type SidebarSection = "main" | "account";
export type SidebarRole = "BUSINESS_ADMIN" | "RESTAURANT_ADMIN" | "BRANCH_ADMIN";

export interface MenuItem {
  title: string;
  labelKey?: string;
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
    labelKey: "dashboard",
    href: "/",
    icon: LayoutGrid,
    section: "main",
    roles: allAdminRoles,
  },
  {
    title: "Branch Management",
    labelKey: "branchManagement",
    href: "/branches",
    icon: Store,
    section: "main",
    roles: restaurantAdminRoles,
  },
  {
    title: "My Branch",
    labelKey: "myBranch",
    href: "/branch-workspace",
    icon: Store,
    section: "main",
    roles: branchAdminOnly,
  },
  {
    title: "Menu Management",
    labelKey: "menuManagement",
    href: "/menu",
    icon: List,
    section: "main",
    roles: allAdminRoles,
    children: [
      {
        title: "Menu",
        labelKey: "menu",
        href: "/menu",
        icon: List,
        section: "main",
        roles: allAdminRoles,
      },
      {
        title: "Categories",
        labelKey: "categories",
        href: "/menu/categories",
        icon: ClipboardList,
        section: "main",
        roles: allAdminRoles,
      },
      {
        title: "Modifiers",
        labelKey: "modifiers",
        href: "/menu/modifier",
        icon: Tags,
        section: "main",
        roles: restaurantAdminRoles,
      },
      {
        title: "Variations",
        labelKey: "variations",
        href: "/menu/variations",
        icon: ClipboardList,
        section: "main",
        roles: restaurantAdminRoles,
      },
      {
        title: "Deals",
        labelKey: "deals",
        href: "/menu/deals",
        icon: BadgePercent,
        section: "main",
        roles: allAdminRoles,
      },
      {
        title: "Items",
        labelKey: "menuItems",
        href: "/menu/items",
        icon: PackagePlus,
        section: "main",
        roles: allAdminRoles,
      },
      {
        title: "Allergen",
        labelKey: "allergen",
        href: "/menu/allergen",
        icon: AlertTriangle,
        section: "main",
        roles: restaurantAdminRoles,
      },
      {
        title: "Labels",
        labelKey: "labels",
        href: "/menu/labels",
        icon: BadgeCheck,
        section: "main",
        roles: restaurantAdminRoles,
      },
    ],
  },
  {
    title: "Order Management",
    labelKey: "orderManagement",
    href: "/orders",
    icon: ShoppingBag,
    section: "main",
    roles: allAdminRoles,
  },
  {
    title: "Table Reservations",
    labelKey: "tableReservations",
    href: "/table-reservations",
    icon: CalendarCheck,
    section: "main",
    roles: allAdminRoles,
  },
  {
    title: "POS Management",
    labelKey: "posManagement",
    href: "/pos",
    icon: Monitor,
    section: "main",
    roles: allAdminRoles,
  },
  // Inventory module is intentionally hidden for now.
  // {
  //   title: "Inventory",
  //   labelKey: "inventory",
  //   href: "/inventory",
  //   icon: PackagePlus,
  //   section: "main",
  //   roles: branchAdminOnly,
  // },
  {
    title: "Customer Management",
    labelKey: "customerManagement",
    href: "/customer-settings",
    icon: PiUsersThree,
    section: "main",
    roles: allAdminRoles,
  },
  {
    title: "Loyalty Program",
    labelKey: "loyaltyProgram",
    href: "/loyalty",
    icon: Coins,
    section: "main",
    roles: allAdminRoles,
  },
  {
    title: "Deliveryman",
    labelKey: "deliveryman",
    href: "/deliveryman",
    icon: Truck,
    section: "main",
    roles: allAdminRoles,
  },
  {
    title: "Employees",
    labelKey: "employees",
    href: "/employees-settings",
    icon: UserCog,
    section: "main",
    roles: allAdminRoles,
  },
  {
    title: "Promotion Management",
    labelKey: "promotionManagement",
    href: "/promotion-management",
    icon: Gift,
    section: "main",
    roles: restaurantAdminRoles,
  },
  {
    title: "Content Management",
    labelKey: "contentManagement",
    href: "/content-management",
    icon: FileText,
    section: "main",
    roles: restaurantAdminRoles,
    children: [
      {
        title: "Faqs",
        labelKey: "faqs",
        href: "/faqs",
        icon: FileText,
        section: "main",
        roles: restaurantAdminRoles,
      },
      {
        title: "Privacy Policy",
        labelKey: "privacyPolicy",
        href: "/privacy-policy",
        icon: ShieldCheck,
        section: "main",
        roles: restaurantAdminRoles,
      },
    ],
  },
  {
    title: "Profile",
    labelKey: "profile",
    href: "/profile",
    icon: User,
    section: "account",
    roles: allAdminRoles,
  },
  {
    title: "Auto-Printing / POS",
    labelKey: "autoPrintingPos",
    href: "/auto-printing",
    icon: Printer,
    section: "account",
    roles: allAdminRoles,
  },
  {
    title: "Reports & Payouts",
    labelKey: "reportsPayouts",
    href: "/reports",
    icon: BarChart3,
    section: "account",
    roles: allAdminRoles,
  },

  {
    title: "Notifications",
    labelKey: "notifications",
    href: "/notifications",
    icon: Bell,
    section: "account",
    roles: allAdminRoles,
  },
  {
    title: "Storefront Settings",
    labelKey: "storefrontSettings",
    href: "/theme-settings",
    icon: Palette,
    section: "account",
    roles: restaurantAdminRoles,
  },
];
