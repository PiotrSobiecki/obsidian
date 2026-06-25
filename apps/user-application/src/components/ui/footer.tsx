import Link from "next/link";
import { Mail } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-card py-8">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h3 className="font-display text-lg font-bold tracking-widest text-foreground">
              OBSIDIAN
            </h3>
            <div className="mt-1 flex items-center text-sm text-muted-foreground">
              <Mail className="mr-1 h-4 w-4" />
              <span>kontakt@obsidian.pl</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <Link href="/koncerty" className="transition-colors hover:text-primary">
              Koncerty
            </Link>
            <Link href="#jak-to-dziala" className="transition-colors hover:text-primary">
              Jak to działa
            </Link>
            <Link href="#faq" className="transition-colors hover:text-primary">
              FAQ
            </Link>
          </div>
        </div>

        <div className="mt-6 border-t border-border pt-4 text-center text-xs text-muted-foreground">
          &copy; {currentYear} Obsidian. Wszystkie prawa zastrzeżone.
        </div>
      </div>
    </footer>
  );
}
