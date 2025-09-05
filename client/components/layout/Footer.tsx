export default function Footer() {
  return (
    <footer className="border-t bg-background/60">
      <div className="container py-10 text-sm text-muted-foreground">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <p>
            © {new Date().getFullYear()} Aeris. Hyper‑Localized Disaster
            Intelligence.
          </p>
          <div className="flex items-center gap-4">
            <a className="hover:text-foreground" href="#how">
              How it works
            </a>
            <a className="hover:text-foreground" href="#sensors">
              Sensors
            </a>
            <a className="hover:text-foreground" href="#dashboard">
              Dashboard
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
