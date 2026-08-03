"use client";

const navItems = [
  { label: "Master", active: true },
  { label: "CFS", active: false },
  { label: "Membership", active: false },
  { label: "Ticketing", active: false },
  { label: "Merchandise", active: false },
];

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-full w-[140px] flex flex-col py-6 z-50"
      style={{ background: "#152225" }}
    >
      <nav className="flex flex-col gap-1 mt-2">
        {navItems.map((item) => (
          <button
            key={item.label}
            className={`flex items-center gap-2.5 px-4 py-2.5 text-sm text-left transition-colors ${
              item.active
                ? "text-white font-medium"
                : "text-gray-400 hover:text-gray-300 cursor-not-allowed opacity-60"
            }`}
            disabled={!item.active}
          >
            <span
              className={`w-3 h-3 rounded-sm flex-shrink-0 ${
                item.active ? "bg-[#3bd6ff]" : "bg-gray-600"
              }`}
            />
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}
