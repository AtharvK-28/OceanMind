import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-page-enter">
      <i className="ph ph-wave-sine text-[80px] text-accent mb-4" />
      <h1 className="text-3xl font-bold text-text mb-2" style={{ fontFamily: "'Newsreader', serif" }}>Lost at Sea</h1>
      <p className="text-text-muted mb-8 max-w-md">
        This page doesn&apos;t exist in the OceanMind platform.
        The ocean is vast, but your data is just a click away.
      </p>
      <Link href="/"
        className="px-6 py-3 bg-accent hover:bg-accent-dark text-white rounded-xl
                   font-medium transition-all hover:shadow-lg hover:-translate-y-0.5">
        Return to Dashboard
      </Link>
    </div>
  );
}
