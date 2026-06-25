import Link from "next/link";
import { Menu, Music2 } from "lucide-react";
import { Button } from "./button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";

export function Navbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Music2 className="h-6 w-6 text-primary" strokeWidth={2} />
            <span className="font-display text-2xl font-bold tracking-widest text-foreground">
              OBSIDIAN
            </span>
          </Link>

          <nav className="hidden items-center space-x-8 md:flex">
            <Link
              href="/koncerty"
              className="text-muted-foreground transition-colors hover:text-primary"
            >
              Koncerty
            </Link>
            <Link
              href="#jak-to-dziala"
              className="text-muted-foreground transition-colors hover:text-primary"
            >
              Jak to działa
            </Link>
            <Link
              href="#faq"
              className="text-muted-foreground transition-colors hover:text-primary"
            >
              FAQ
            </Link>
          </nav>

          <div className="hidden md:flex">
            <Button asChild className="uppercase tracking-wider">
              <Link href="/koncerty">Znajdź koncert</Link>
            </Button>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem asChild>
                <Link href="/koncerty">Koncerty</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="#jak-to-dziala">Jak to działa</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="#faq">FAQ</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
