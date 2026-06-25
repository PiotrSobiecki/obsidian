import {
  Clock,
  Search,
  ShieldAlert,
  User,
  BadgeCheck,
  Clock4,
} from "lucide-react";

const problems = [
  {
    icon: Search,
    title: "Trudności ze znalezieniem zaufanego fachowca",
    description:
      "Szukanie sprawdzonego fachowca przez znajomych lub internet jest czasochłonne i niepewne.",
  },
  {
    icon: Clock,
    title: "Oczekiwanie na realizację zlecenia",
    description:
      "Tradycyjne firmy mają długie terminy oczekiwania, co jest problematyczne w nagłych przypadkach.",
  },
  {
    icon: ShieldAlert,
    title: "Brak gwarancji jakości usług",
    description:
      "Bez systemu weryfikacji trudno ocenić umiejętności i rzetelność fachowca przed realizacją zlecenia.",
  },
];

const solutions = [
  {
    icon: BadgeCheck,
    title: "Zweryfikowani fachowcy",
    description:
      "Wszyscy fachowcy w DOMIDO przechodzą dokładny proces weryfikacji oraz zbierają oceny od klientów.",
  },
  {
    icon: Clock4,
    title: "Szybki czas realizacji",
    description:
      "Możesz zamówić usługę nawet na ten sam dzień. Aplikacja pokazuje dostępnych fachowców w czasie rzeczywistym.",
  },
  {
    icon: User,
    title: "Pełna kontrola nad zleceniem",
    description:
      "Wybierasz fachowca, termin i cenę. Pełna przejrzystość procesu i płatności bez ukrytych kosztów.",
  },
];

export function ProblemSolution() {
  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-gray-100 rounded-t-2xl px-6 py-8">
            <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">
              Problemy, które rozwiązujemy
            </h2>

            <div className="space-y-6">
              {problems.map((problem, index) => (
                <div key={index} className="flex gap-4 items-start">
                  <div className="w-12 h-12 rounded-xl bg-white text-red-500 flex items-center justify-center shrink-0">
                    <problem.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold mb-1">{problem.title}</h3>
                    <p className="text-gray-700">{problem.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute left-0 right-0 h-8 bg-gradient-to-b from-gray-100 to-transparent -top-8"></div>
          </div>

          <div className="bg-primary text-white rounded-b-2xl px-6 py-8">
            <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">
              DOMIDO - kompleksowe rozwiązanie
            </h2>

            <div className="space-y-6">
              {solutions.map((solution, index) => (
                <div key={index} className="flex gap-4 items-start">
                  <div className="w-12 h-12 rounded-xl bg-white/10 text-white flex items-center justify-center shrink-0">
                    <solution.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold mb-1">{solution.title}</h3>
                    <p className="text-white/90">{solution.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 text-center">
              <button className="bg-white text-primary font-medium py-3 px-6 rounded-xl hover:bg-white/90 transition-colors">
                Wypróbuj DOMIDO już teraz
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
