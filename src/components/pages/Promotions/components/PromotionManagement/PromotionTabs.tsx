"use client";

import { PageTabs } from "@/components/common/PageTabs";

type Tab = {
  label: string;
  value: string;
};

type Props = {
  tabs: Tab[];
  active: string;
  onChange: (value: string) => void;
};

export default function PromotionTabs({ tabs, active, onChange }: Props) {
  return (
    <PageTabs
      value={active}
      options={tabs}
      onValueChange={onChange}
      ariaLabel="Promotion sections"
      className="w-full lg:w-fit"
    />
  );
}
