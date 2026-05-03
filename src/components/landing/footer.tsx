import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-clinq-glass-border px-6 py-12 text-sm text-muted-foreground">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 md:flex-row">
        <p>© {new Date().getFullYear()} Clinq. All rights reserved.</p>
        <div className="flex gap-6">
          <Link href="/dashboard" className="hover:text-foreground">
            App
          </Link>
          <span className="text-border">|</span>
          <span>Extension-ready architecture</span>
        </div>
      </div>
    </footer>
  );
}
