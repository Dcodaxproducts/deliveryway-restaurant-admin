"use client";

import Link from "next/link";
import { MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export interface ActionDropdownItem {
  label: string;
  href?: string;
  onClick?: () => void;
  icon?: React.ReactNode;
  className?: string; //  NEW
}

interface ActionDropdownProps {
  items: ActionDropdownItem[];
}

export default function ActionDropdown({ items }: ActionDropdownProps) {
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-[40px] w-[44px] flex items-center justify-center text-gray-500 hover:bg-gray-50"
        >
          <MoreVertical size={18} />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-48">
        {items.map((item) => {
          const isDisabled =
            item.className?.includes("pointer-events-none");

          if (item.href) {
            return (
              <DropdownMenuItem
                key={item.label}
                asChild
                onSelect={() => {
                  if (isDisabled) return;
                  setOpen(false);
                }}
                className={`
                  flex items-center gap-3
                  ${item.className || ""}
                `}
              >
                <Link
                  href={isDisabled ? "#" : item.href}
                  className="flex items-center gap-3 w-full"
                >
                  {item.icon}
                  <span className="text-sm">{item.label}</span>
                </Link>
              </DropdownMenuItem>
            );
          }

          return (
            <DropdownMenuItem
              key={item.label}
              onSelect={() => {
                if (isDisabled) return;

                setOpen(false);

                // allow dropdown to close first
                setTimeout(() => {
                  item.onClick?.();
                }, 0);
              }}
              className={`
                flex items-center gap-3 cursor-pointer
                ${item.className || ""}
              `}
            >
              {item.icon}
              <span className="text-sm">{item.label}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}