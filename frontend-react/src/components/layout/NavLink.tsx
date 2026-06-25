"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavLink({ href, icon, label }: { href: string; icon: string; label: string }) {
  const pathname = usePathname();
  const active = href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2 rounded-xl text-[13.5px] transition-all duration-150
        ${active
          ? "bg-[rgba(143,211,200,0.16)] text-[#f3f8f6] font-semibold shadow-[inset_2px_0_0_#6fc7b8]"
          : "text-[#cfe6e2] hover:bg-[rgba(255,255,255,0.06)] border-l-0"
        }`}
    >
      <i className={`${active ? icon.replace("ph ph-", "ph-fill ph-") : icon} text-lg w-5 text-center`}
         style={{ color: active ? "#9fe0d6" : "#8fd3c8" }} />
      <span>{label}</span>
    </Link>
  );
}
