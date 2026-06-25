import { CheckCircle, CreditCard, PercentCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./card";
import { Separator } from "./separator";

const pricingModels = [
  {
    title: "Model prowizyjny",
    icon: PercentCircle,
    description: "Idealne dla klientów, którzy korzystają z usług okazjonalnie",
    price: "10-15%",
    features: [
      "Brak stałych opłat miesięcznych",
      "Prowizja tylko od zrealizowanych zleceń",
      "Brak minimalnych zobowiązań",
      "Płatność po wykonaniu usługi",
      "Możliwość anulowania bez dodatkowych kosztów",
    ],
    cta: "Zamów usługę",
    popular: false,
  },
  {
    title: "Plan Abonamentowy",
    icon: CreditCard,
    description: "Dla użytkowników regularnie korzystających z usług domowych",
    price: "129 zł/mies.",
    features: [
      "Nielimitowana liczba zleceń",
      "Priorytetowa obsługa",
      "Stały dostęp do sprawdzonych fachowców",
      "Zniżki 20% na usługi cykliczne",
      "Gwarancja terminu lub zwrot pieniędzy",
    ],
    cta: "Wybierz plan",
    popular: true,
  },
];

export function Pricing() {
  return (
    <section className="py-16 md:py-24" id="cennik">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Przejrzysty model cenowy
          </h2>
          <p className="text-lg text-gray-700">
            W DOMIDO wierzymy w transparentność. Płacisz tylko za wykonane
            usługi lub wybierasz wygodny abonament dla regularnych potrzeb.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {pricingModels.map((model, index) => (
            <Card
              key={index}
              className={`overflow-hidden border border-gray-200 ${
                model.popular ? "ring-2 ring-primary relative" : ""
              }`}
            >
              {model.popular && (
                <div className="absolute top-0 right-0 bg-primary text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                  Popularny wybór
                </div>
              )}
              <CardHeader className="pb-0">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <model.icon className="h-6 w-6" />
                </div>
                <CardTitle className="text-2xl font-bold">
                  {model.title}
                </CardTitle>
                <CardDescription className="text-gray-600 mt-2">
                  {model.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="mb-6">
                  <span className="text-3xl font-bold">{model.price}</span>
                  {model.title === "Model prowizyjny" ? (
                    <span className="text-gray-600 ml-1">prowizji</span>
                  ) : (
                    <span className="text-gray-600 ml-1">/ miesiąc</span>
                  )}
                </div>

                <Separator className="mb-6" />

                <ul className="space-y-3">
                  {model.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <button
                  className={`w-full py-3 rounded-xl font-medium transition-colors ${
                    model.popular
                      ? "bg-primary text-white hover:bg-primary/90"
                      : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                  }`}
                >
                  {model.cta}
                </button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="mt-16 max-w-3xl mx-auto">
          <h3 className="text-xl font-bold mb-4 text-center">
            Najczęściej zadawane pytania o cennik
          </h3>
          <div className="bg-white rounded-xl p-6 shadow-lg shadow-gray-100/50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  question: "Czy są ukryte opłaty?",
                  answer:
                    "Nie, w DOMIDO płacisz tylko za to, co widzisz w cenniku. Brak ukrytych opłat czy dodatkowych kosztów.",
                },
                {
                  question: "Jak wygląda system płatności?",
                  answer:
                    "Akceptujemy płatności kartą, BLIK oraz szybkie przelewy. Wszystkie transakcje są bezpieczne i szyfrowane.",
                },
                {
                  question: "Czy mogę zmienić plan?",
                  answer:
                    "Tak, możesz dowolnie przełączać się między modelem prowizyjnym a abonamentowym w zależności od potrzeb.",
                },
                {
                  question: "Czy można anulować zlecenie?",
                  answer:
                    "Tak, zlecenia można anulować bezpłatnie do 24h przed planowanym terminem realizacji.",
                },
              ].map((faq, i) => (
                <div key={i} className="space-y-2">
                  <h4 className="font-bold">{faq.question}</h4>
                  <p className="text-gray-600 text-sm">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
