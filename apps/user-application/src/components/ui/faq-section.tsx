import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./accordion";

const faqs = [
  {
    question: "Skąd pochodzą dane o koncertach?",
    answer:
      "Obsidian agreguje wydarzenia z bileterii (eBilet, Going, Eventim), stron klubów i innych źródeł. Dane są aktualizowane codziennie przez naszego agenta zbierającego.",
    },
    {
      question: "W jakich miastach działa Obsidian?",
    answer:
      "Obsługujemy wszystkie większe miasta w Polsce — Warszawa, Kraków, Wrocław, Poznań, Gdańsk, Katowice i wiele innych. Lista jest stale rozszerzana.",
  },
  {
    question: "Czy Obsidian sprzedaje bilety?",
    answer:
      "Nie — jesteśmy wyszukiwarką. Po kliknięciu „Bilety” trafisz na stronę organizatora lub bileterii, gdzie możesz dokonać zakupu.",
  },
  {
    question: "Jak często aktualizowane są wydarzenia?",
    answer:
      "Nasz agent Collector skanuje źródła raz dziennie. Nowe kluby i portale są odkrywane co tydzień przez agenta Discovery.",
  },
];

export function FaqSection() {
  return (
    <section id="faq" className="border-t border-border py-16 md:py-24">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="font-display text-3xl font-bold md:text-4xl">
            Często zadawane <span className="text-primary">pytania</span>
          </h2>
        </div>

        <div className="mx-auto max-w-2xl">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger className="text-left font-medium">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
