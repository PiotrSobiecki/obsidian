import { Brush, Wrench, Cable, Truck, Paintbrush, PenTool } from "lucide-react";
import Link from "next/link";

const popularServices = [
  {
    icon: Brush,
    name: "Sprzątanie",
    description: "Regularne sprzątanie, mycie okien, pranie tapicerki",
    link: "#",
  },
  {
    icon: Wrench,
    name: "Hydraulika",
    description: "Naprawa cieknących kranów, instalacja urządzeń",
    link: "#",
  },
  {
    icon: Cable,
    name: "Elektryka",
    description: "Montaż gniazdek, naprawa instalacji, bezpieczniki",
    link: "#",
  },
  {
    icon: Truck,
    name: "Przeprowadzki",
    description: "Transport mebli, pakowanie, montaż i demontaż",
    link: "#",
  },
  {
    icon: Paintbrush,
    name: "Remonty",
    description: "Malowanie, tapetowanie, drobne naprawy",
    link: "#",
  },
  {
    icon: PenTool,
    name: "Montaż mebli",
    description: "Składanie mebli, wieszanie półek i obrazów",
    link: "#",
  },
];

export function PopularServices() {
  return (
    <section className="py-16 md:py-24 bg-gray-50" id="popularne-uslugi">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Najpopularniejsze usługi
          </h2>
          <p className="text-lg text-gray-700">
            Nasi fachowcy są gotowi pomóc Ci z każdym zadaniem. Oto usługi,
            które cieszą się największą popularnością wśród naszych klientów.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {popularServices.map((service, index) => (
            <Link
              href={service.link}
              key={index}
              className="bg-white rounded-xl p-6 shadow-lg shadow-gray-100/80 transition-all hover:shadow-xl hover:-translate-y-1 group"
            >
              <div className="w-14 h-14 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-colors">
                <service.icon className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold mb-2">{service.name}</h3>
              <p className="text-gray-600">{service.description}</p>
              <div className="mt-4 text-primary font-medium">Zamów usługę</div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
