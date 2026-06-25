import { MapPin, Calendar, Ticket } from "lucide-react";

const steps = [
  {
    icon: MapPin,
    title: "Wybierz miasto",
    description:
      "Ponad 40 polskich miast — od Warszawy po mniejsze sceny koncertowe.",
  },
  {
    icon: Calendar,
    title: "Ustaw datę",
    description:
      "Sprawdź koncerty dziś, w najbliższych 3–7 dniach lub na 3 miesiące do przodu.",
  },
  {
    icon: Ticket,
    title: "Kup bilet",
    description:
      "Przejdź prosto do bileterii lub strony klubu — bez przeklikiwania dziesiątek portali.",
  },
];

export function HowItWorks() {
  return (
    <section id="jak-to-dziala" className="py-16 md:py-24">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="font-display text-3xl font-bold md:text-4xl">
            Jak to <span className="text-primary">działa</span>
          </h2>
          <p className="mt-3 text-muted-foreground">
            Trzy kroki do następnego koncertu.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {steps.map((step, i) => (
            <div
              key={step.title}
              className="rounded-lg border border-border bg-card p-6 text-center"
            >
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <step.icon className="h-7 w-7 text-primary" strokeWidth={2} />
              </div>
              <span className="text-xs font-medium uppercase tracking-widest text-primary">
                Krok {i + 1}
              </span>
              <h3 className="mt-2 font-display text-xl font-semibold">
                {step.title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
