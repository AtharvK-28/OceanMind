import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-page-enter">
      <div className="text-8xl mb-4">🌊</div>
      <h1 className="text-3xl font-bold text-white mb-2">Lost at Sea</h1>
      <p className="text-white/50 mb-8 max-w-md">
        This page doesn&apos;t exist in the OceanMind platform.
        The ocean is vast, but your data is just a click away.
      </p>
      <Link
        href="/"
        className="px-6 py-3 bg-gradient-to-r from-[#064273] to-[#1a8a5c] text-white rounded-xl
                   font-medium transition-all hover:shadow-lg hover:shadow-[#4fc3f7]/20 hover:-translate-y-0.5"
      >
        Return to Dashboard
      </Link>
    </div>
  );
}
