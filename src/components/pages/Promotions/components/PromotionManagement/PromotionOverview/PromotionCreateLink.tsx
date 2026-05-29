"use client";

import { useRouter } from "next/navigation";

type Props = {
  label: string;
  href?: string; 
  className?: string; // optional styling override
};

export default function PromotionCreateLink({
  label,
  href,
  className = "",
}: Props) {
  const router = useRouter();

  const handleClick = () => {
    if (href) router.push(href); // only navigate if provided
  };

  return (
    <div className="flex justify-center">
      <button
        type="button"
        onClick={handleClick}
        className={`text-sm text-primary underline ${className}`}
      >
        + {label}
      </button>
    </div>
  );
}
