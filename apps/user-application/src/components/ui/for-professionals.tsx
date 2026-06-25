import {
  CheckCircle,
  Calendar,
  DollarSign,
  Star,
  Users,
  TrendingUp,
  Shield,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";
import Image from "next/image";

const benefits = [
  {
    icon: Calendar,
    title: "Elastyczny grafik",
    description:
      "Sam decydujesz kiedy i ile pracujesz. Dopasuj zlecenia do własnego harmonogramu.",
  },
  {
    icon: DollarSign,
    title: "Konkurencyjne stawki",
    description:
      "Zarabiaj więcej niż w tradycyjnych firmach. Wypłaty co tydzień bezpośrednio na Twoje konto.",
  },
  {
    icon: Star,
    title: "Buduj reputację",
    description:
      "Zbieraj pozytywne oceny i opinie, które zwiększą liczbę Twoich zleceń.",
  },
  {
    icon: Users,
    title: "Stała baza klientów",
    description:
      "Dostęp do rosnącej bazy klientów bez wydawania pieniędzy na marketing.",
  },
  {
    icon: TrendingUp,
    title: "Rozwój zawodowy",
    description:
      "Szkolenia i certyfikaty, które pomogą Ci podnosić kwalifikacje i zarabiać więcej.",
  },
  {
    icon: Shield,
    title: "Bezpieczeństwo",
    description:
      "Gwarancja płatności za wykonane usługi oraz bezpieczne transakcje online.",
  },
];

export function ForProfessionals() {
  return (
    <section
      className="py-16 md:py-24 bg-gradient-to-br from-primary/5 to-secondary/30"
      id="dla-fachowcow"
    >
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Dołącz do <span className="text-primary">DOMIDO</span> jako
            fachowiec
          </h2>
          <p className="text-lg text-gray-700">
            Zyskaj dostęp do nowych klientów, elastyczny grafik pracy i
            konkurencyjne stawki. Odkryj, dlaczego warto dołączyć do naszej
            platformy.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <Tabs defaultValue="zlecenia" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-8">
                <TabsTrigger value="zlecenia">Zlecenia</TabsTrigger>
                <TabsTrigger value="zarobki">Zarobki</TabsTrigger>
                <TabsTrigger value="wsparcie">Wsparcie</TabsTrigger>
              </TabsList>
              <TabsContent value="zlecenia" className="space-y-4">
                <h3 className="text-xl font-bold">
                  Więcej zleceń, mniej zmartwień
                </h3>
                <p className="text-gray-700">
                  Otrzymuj powiadomienia o nowych zleceniach w Twojej okolicy.
                  Sam decydujesz, które z nich przyjąć, bazując na swoich
                  umiejętnościach, lokalizacji i dostępności czasowej.
                </p>
                <ul className="space-y-2 mt-4">
                  {[
                    "Powiadomienia o zleceniach w czasie rzeczywistym",
                    "Możliwość filtrowania zleceń wg lokalizacji i typu",
                    "Pełna historia zleceń i zarobków w jednym miejscu",
                    "Elastyczny grafik - pracuj kiedy chcesz",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </TabsContent>
              <TabsContent value="zarobki" className="space-y-4">
                <h3 className="text-xl font-bold">
                  Zarabiaj więcej, na swoich zasadach
                </h3>
                <p className="text-gray-700">
                  W DOMIDO możesz liczyć na uczciwe i konkurencyjne stawki.
                  Wypłaty realizowane są co tydzień, a Ty masz pełny wgląd w
                  swoje zarobki.
                </p>
                <ul className="space-y-2 mt-4">
                  {[
                    "Konkurencyjne stawki - zarabiaj więcej niż w tradycyjnym modelu",
                    "Cotygodniowe wypłaty bezpośrednio na Twoje konto",
                    "Przejrzysty system rozliczeń i prowizji",
                    "Bonusy za wysokie oceny i regularne zlecenia",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </TabsContent>
              <TabsContent value="wsparcie" className="space-y-4">
                <h3 className="text-xl font-bold">
                  Pełne wsparcie na każdym kroku
                </h3>
                <p className="text-gray-700">
                  Zapewniamy wsparcie zarówno w kwestiach technicznych
                  związanych z aplikacją, jak i w rozwoju Twojej kariery
                  zawodowej.
                </p>
                <ul className="space-y-2 mt-4">
                  {[
                    "Dedykowany zespół wsparcia 7 dni w tygodniu",
                    "Szkolenia podnoszące kwalifikacje zawodowe",
                    "Materiały edukacyjne dostępne w aplikacji",
                    "Ubezpieczenie OC dla wykonawców usług",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </TabsContent>
            </Tabs>

            <div className="mt-8 inline-flex">
              <button className="bg-primary text-white rounded-xl py-4 px-8 font-medium hover:bg-primary/90 transition-colors">
                Dołącz jako fachowiec
              </button>
            </div>
          </div>

          <div className="relative rounded-2xl overflow-hidden shadow-xl border border-gray-100 bg-white h-[550px]">
            <div className="absolute -left-16 -bottom-16 h-64 w-64 rounded-full bg-primary/10 z-10"></div>
            <div className="absolute right-10 top-10 h-20 w-20 rounded-full bg-secondary z-10"></div>

            <div className="relative h-full w-full z-20">
              <Image
                src="/images/professional.png"
                alt="Profesjonalny fachowiec korzystający z aplikacji DOMIDO"
                fill
                className="object-cover"
                style={{ borderRadius: "1rem" }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:col-span-2">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-6 shadow-lg shadow-gray-100/80"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <benefit.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold mb-2">{benefit.title}</h3>
                <p className="text-gray-600 text-sm">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
