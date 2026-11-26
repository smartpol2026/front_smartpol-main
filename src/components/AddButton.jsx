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
      className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl transition whitespace-nowrap lg:min-w-[260px] font-semibold ${
        !disabled
          ? "bg-brand-500 text-white shadow-md shadow-brand-500/25 hover:bg-brand-600"
          : "bg-gray-300 text-gray-500 cursor-not-allowed"
      }`}
    >
      <PlusIcon className="w-5 h-5" />
      {label}
    </button>
  );
}
