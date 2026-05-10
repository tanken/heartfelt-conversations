import { Link } from "@tanstack/react-router";

export function SiteHead() {
  return (
    <header className="relative z-10 px-6 py-5 flex items-center justify-between max-w-6xl mx-auto w-full">
      <Link to="/" className="flex items-center gap-2 group">
        <div className="h-7 w-7 rounded-full bg-spiral opacity-90 group-hover:rotate-180 transition-transform duration-700" />
        <span className="font-display text-lg tracking-tight">Truth Spiral</span>
      </Link>
      <nav className="flex items-center gap-4 md:gap-6 text-sm text-muted-foreground">
        <Link to="/play/solo" className="hover:text-cream transition">Solo</Link>
        <Link to="/play/local" className="hover:text-cream transition hidden sm:inline">In-person</Link>
        <Link to="/async/new" className="hover:text-cream transition hidden sm:inline">Async</Link>
        <Link to="/join" className="hover:text-cream transition">Join</Link>
      </nav>
    </header>
  );
}
