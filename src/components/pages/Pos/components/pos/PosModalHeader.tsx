"use client";

interface ReservationModalHeaderProps {
  title: string;
  description?: string;
}

export default function PosModalHeader({
  title,
  description,
}: ReservationModalHeaderProps) {
  return (
    <div className="text-center space-y-2">
      <h2 className="text-[28px] font-semibold text-[#101828]">
        {title}
      </h2>

      {description && (
        <p className="text-[16px] text-[#667085]">
          {description}
        </p>
      )}
    </div>
  );
}
