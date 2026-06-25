import { Star } from "lucide-react";
import Image from "next/image";

const userReviews = [
  {
    name: "Anna K.",
    avatar: "/images/user1.png",
    rating: 5,
    date: "2 dni temu",
    service: "Sprzątanie mieszkania",
    review:
      "Pani Kasia wykonała świetną pracę przy sprzątaniu mojego mieszkania. Wszystko lśni, a ja mogłam odpocząć. Na pewno skorzystam ponownie!",
  },
  {
    name: "Tomasz W.",
    avatar: "/images/user2.png",
    rating: 5,
    date: "tydzień temu",
    service: "Naprawa cieknącego kranu",
    review:
      "Pan Marek bardzo szybko naprawił cieknący kran. Profesjonalne podejście, punktualność i świetna cena. Polecam!",
  },
  {
    name: "Marcin Z.",
    avatar: "/images/user3.png",
    rating: 4,
    date: "2 tygodnie temu",
    service: "Montaż mebli",
    review:
      "Fachowiec przyszedł na czas i sprawnie złożył moje meble. Jedyne zastrzeżenie mam do sprzątania po montażu, ale ogólnie jestem zadowolony.",
  },
];

export function UserReviews() {
  return (
    <section className="py-16 md:py-24 bg-white" id="opinie">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Co mówią nasi klienci
          </h2>
          <p className="text-lg text-gray-700">
            Zaufało nam już ponad 10 000 zadowolonych klientów. Przekonaj się,
            jak DOMIDO pomaga w codziennych wyzwaniach.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {userReviews.map((review, index) => (
            <div
              key={index}
              className="bg-gray-50 rounded-xl p-6 shadow-sm relative"
            >
              <div className="flex items-start">
                <div className="relative w-12 h-12 mr-4 rounded-full overflow-hidden border-2 border-white shadow">
                  <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-500 text-sm font-medium">
                      {review.name.charAt(0)}
                    </span>
                  </div>
                  <Image
                    src={review.avatar}
                    alt={review.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <h4 className="font-bold">{review.name}</h4>
                  <div className="flex text-yellow-400 mt-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < review.rating ? "fill-current" : "text-gray-300"
                        }`}
                      />
                    ))}
                    <span className="text-gray-500 text-xs ml-2">
                      {review.date}
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <div className="text-xs text-primary font-medium mb-2">
                  {review.service}
                </div>
                <p className="text-gray-700">{review.review}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <button className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors">
            Zobacz więcej opinii
          </button>
        </div>
      </div>
    </section>
  );
}
