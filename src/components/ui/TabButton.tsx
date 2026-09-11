import { Button } from "@/components/ui/button";

type TabButtonProps = {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
};

export default function TabButton({ active, children, onClick }: TabButtonProps) {
  return (
    <Button
      onClick={onClick}
      variant={active ? "default" : "ghost"}
      className={
        active
          ? "w-fit rounded-[var(--ui-radius-control)] bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary"
          : "w-fit rounded-[var(--ui-radius-control)] px-3 py-2 text-sm font-medium text-gray-500 hover:bg-transparent hover:text-black"
      }
    >
      {children}
    </Button>
  );
}
