import {
  Trophy,
  Rocket,
  LightbulbIcon,
  Smartphone,
  MapPin,
  Globe,
} from "lucide-react";

const roadmapItems = [
  {
    icon: LightbulbIcon,
    date: "IV kw. 2023",
    title: "Start DOMIDO",
    description:
      "Oficjalny launch platformy w Warszawie i Krakowie z podstawowymi funkcjonalnościami i pierwszymi 100 zaufanymi fachowcami.",
    completed: true,
  },
  {
    icon: Smartphone,
    date: "I kw. 2024",
    title: "Aplikacja mobilna",
    description:
      "Wydanie aplikacji na iOS i Android z możliwością śledzenia fachowca w czasie rzeczywistym i systemem ocen.",
    completed: true,
  },
  {
    icon: MapPin,
    date: "II kw. 2024",
    title: "Ekspansja na nowe miasta",
    description:
      "Rozszerzenie zasięgu DOMIDO na 10 największych miast Polski, pozyskanie 1000+ fachowców.",
    completed: true,
  },
  {
    icon: Trophy,
    date: "III kw. 2024",
    title: "Nowe kategorie usług",
    description:
      "Wprowadzenie dodatkowych kategorii usług: ogrodnicy, montaż klimatyzacji, sprzątanie specjalistyczne, usługi kurierskie.",
    completed: false,
  },
  {
    icon: Rocket,
    date: "IV kw. 2024",
    title: "Program lojalnościowy",
    description:
      "Uruchomienie programu lojalnościowego dla klientów oraz systemu poleceń z atrakcyjnymi nagrodami.",
    completed: false,
  },
  {
    icon: Globe,
    date: "2025",
    title: "Ekspansja międzynarodowa",
    description:
      "Start platformy w krajach Europy Środkowo-Wschodniej: Czechy, Słowacja, Węgry i kraje bałtyckie.",
    completed: false,
  },
];

export function Roadmap() {
  return (
    <section className="py-16 md:py-24 bg-secondary/30" id="plan-rozwoju">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Plan rozwoju DOMIDO
          </h2>
          <p className="text-lg text-gray-700">
            Nasza misja to ciągłe doskonalenie platformy i rozszerzanie zasięgu.
            Zobacz, co już osiągnęliśmy i co planujemy w przyszłości.
          </p>
        </div>

        <div className="max-w-4xl mx-auto relative">
          {/* Linia pionowa */}
          <div className="absolute left-12 md:left-1/2 top-0 bottom-0 w-0.5 bg-gray-200 -ml-0.5 md:-translate-x-0.5"></div>

          <div className="space-y-12">
            {roadmapItems.map((item, index) => (
              <div
                key={index}
                className={`relative flex flex-col md:flex-row gap-8 md:gap-0 ${
                  index % 2 === 0 ? "md:flex-row-reverse" : ""
                }`}
              >
                {/* Kropka na linii */}
                <div className="absolute left-12 md:left-1/2 w-6 h-6 rounded-full bg-white border-2 border-primary -ml-3 md:-translate-x-3 flex items-center justify-center">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      item.completed ? "bg-primary" : "bg-gray-300"
                    }`}
                  ></div>
                </div>

                <div className="md:w-1/2 md:px-8">
                  {/* Pusty div dla strony przeciwnej w układzie desktopowym */}
                </div>

                <div
                  className={`pl-20 md:pl-0 md:w-1/2 md:px-8 ${
                    index % 2 === 0 ? "md:text-right" : ""
                  }`}
                >
                  <div
                    className={`inline-flex items-center p-2 rounded-lg bg-primary/10 text-primary mb-3 ${
                      index % 2 === 0 ? "md:flex-row-reverse" : ""
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    <span
                      className={`text-sm font-medium ${
                        index % 2 === 0 ? "mr-2" : "ml-2"
                      }`}
                    >
                      {item.date}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                  <p className="text-gray-700">{item.description}</p>

                  <div
                    className={`mt-3 inline-flex items-center ${
                      index % 2 === 0 ? "md:flex-row-reverse" : ""
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${
                        item.completed ? "bg-green-500" : "bg-amber-500"
                      }`}
                    ></span>
                    <span
                      className={`text-sm font-medium ${
                        item.completed ? "text-green-600" : "text-amber-600"
                      } ${index % 2 === 0 ? "mr-2" : "ml-2"}`}
                    >
                      {item.completed ? "Zrealizowano" : "W planach"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
