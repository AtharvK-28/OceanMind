"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavLink({ href, icon, label }: { href: string; icon: string; label: string }) {
  const pathname = usePathname();
  const active = href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all duration-150
        ${active
          ? "bg-gradient-to-r from-[#064273]/60 to-[#1a8a5c]/40 text-white font-semibold border-l-[3px] border-[#4fc3f7]"
          : "text-white/65 hover:bg-[#4fc3f7]/10 hover:text-white border-l-[3px] border-transparent"
        }`}
    >
      <span className="text-base w-6 text-center">{icon}</span>
      <span>{label}</span>
    </Link>
  );
}
