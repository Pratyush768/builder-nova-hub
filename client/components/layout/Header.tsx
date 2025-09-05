import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="relative inline-flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary">
            <span className="absolute inline-flex h-6 w-6 animate-pulsePing rounded-md bg-primary/20" />
            <svg viewBox="0 0 24 24" className="h-4 w-4">
              <path
                d="M12 3l3 6 6 3-6 3-3 6-3-6-6-3 6-3z"
                fill="currentColor"
              />
            </svg>
          </span>
          <span
            className={cn(
              "text-lg font-extrabold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent",
            )}
          >
            Aeris
          </span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm md:flex">
          <a
            href="#overview"
            className="text-muted-foreground hover:text-foreground"
          >
            Overview
          </a>
          <a
            href="#dashboard"
            className="text-muted-foreground hover:text-foreground"
          >
            Dashboard
          </a>
          <a
            href="#sensors"
            className="text-muted-foreground hover:text-foreground"
          >
            Sensors
          </a>
          <a
            href="#how"
            className="text-muted-foreground hover:text-foreground"
          >
            How it works
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <a href="#demo">
            <Button size="sm">Open Demo</Button>
          </a>
        </div>
      </div>
    </header>
  );
}
