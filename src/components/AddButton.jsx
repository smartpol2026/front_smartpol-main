import { PlusIcon } from "@heroicons/react/24/outline";

export default function AddButton({
  label,
  onClick,
  disabled = false,
  title = "",
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl shadow-md transition whitespace-nowrap lg:min-w-[260px] ${
        !disabled
          ? "bg-orange-500 text-white shadow-orange-500/20 hover:bg-orange-600"
          : "bg-gray-300 text-gray-500 cursor-not-allowed"
      }`}
    >
      <PlusIcon className="w-5 h-5" />
      {label}
    </button>
  );
}
