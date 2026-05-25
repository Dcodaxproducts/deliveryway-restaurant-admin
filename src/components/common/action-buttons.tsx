import { Edit2, Eye, Image as ImageIcon, MessageCircleMore, MoreVertical } from "lucide-react";

type ActionButtonsProps = {
  type?: "default" | "branch";
};

const getActions = (type: ActionButtonsProps["type"]) => {
  if (type === "branch") {
    return [
      { label: "View branch", icon: Eye },
      { label: "View branch images", icon: ImageIcon },
      { label: "Open branch messages", icon: MessageCircleMore },
      { label: "Open branch actions", icon: MoreVertical },
    ];
  }

  return [
    { label: "Edit", icon: Edit2 },
    { label: "View", icon: Eye },
    { label: "View images", icon: ImageIcon },
    { label: "Open actions", icon: MoreVertical },
  ];
};

export default function ActionButtons({ type = "default" }: ActionButtonsProps) {
  const actions = getActions(type);

  return (
    <div className="flex w-fit items-center justify-end divide-x divide-[#E6E7EC] rounded-sm border border-[#E6E7EC] px-[10px] py-[10px] ml-auto">
      {actions.map(({ label, icon: Icon }, index) => (
        <button
          key={label}
          type="button"
          aria-label={label}
          className={index === 0 ? "pr-[11px] text-gray-400" : index === actions.length - 1 ? "pl-[11px] text-gray-400" : "px-[11px] text-gray-400"}
        >
          <Icon size={20} />
        </button>
      ))}
    </div>
  );
}
