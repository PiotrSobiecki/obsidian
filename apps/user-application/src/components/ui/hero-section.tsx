import { Button } from "./button";
import { ArrowRight, Guitar } from "lucide-react";
import Link from "next/link";

export function HeroSection() {
  return (
    <section className="hero-rock noise-overlay relative pt-32 pb-16 md:pt-40 md:pb-24">
      <div className="container relative z-10 mx-auto px-4 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            <Guitar className="mr-2 h-4 w-4" strokeWidth={2} />
            <span>Rock, metal i więcej — w całej Polsce</span>
          </div>

          <h1 className="font-display text-5xl font-bold leading-tight md:text-6xl lg:text-7xl">
            Wybierz miasto.
            <br />
            <span className="text-primary">Sprawdź co gra.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground md:text-xl">
            Obsidian zbiera koncerty z bileterii, klubów i portali wydarzeń.
            Podaj datę — pokażemy, co dzieje się dziś i w najbliższych dniach.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/koncerty">
              <Button size="lg" className="gap-2 uppercase tracking-wider">
                Szukaj koncertów
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>

          <p className="mt-8 text-sm text-muted-foreground">
            Warszawa · Kraków · Wrocław · Poznań · i 40+ innych miast
          </p>
        </div>
      </div>
    </section>
  );
}
