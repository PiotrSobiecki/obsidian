# Integracja z Google Maps Places API w projekcie DOMIDO

Ten dokument opisuje, jak została zaimplementowana integracja z Google Maps Places API w projekcie DOMIDO.

## Architektura integracji

Integracja została zaimplementowana w następujący sposób:

1. **Frontend (znajdz-fachowca/page.tsx)**:

   - Formularz wyszukiwania umożliwiający wybór województwa, miasta, dzielnicy i typu usługi
   - Wyświetlanie wyników w formie kart z danymi fachowców
   - Obsługa błędów API i wyświetlanie przykładowych danych w razie problemów

2. **Backend (api/znajdz-fachowca/route.ts)**:
   - Endpoint API w Next.js, który pośredniczy w komunikacji z Google Maps Places API
   - Zabezpieczenie klucza API przed ujawnieniem w kodzie frontendowym
   - Obsługa błędów i przekazywanie ich z powrotem do frontendu

## Konfiguracja Google Maps Places API

Aby skonfigurować Google Maps Places API:

1. Utwórz projekt w [Google Cloud Console](https://console.cloud.google.com/)
2. Włącz Places API dla swojego projektu:
   - Menu "APIs & Services" > "Library"
   - Wyszukaj "Places API" i włącz ją
3. Utwórz klucz API:
   - Menu "APIs & Services" > "Credentials"
   - Kliknij "Create credentials" > "API key"
4. Ogranicz klucz API dla bezpieczeństwa:
   - Ograniczenie do Places API
   - Ograniczenie według domeny (HTTP referrer)
   - Ewentualnie ograniczenie według adresu IP

## Zmienne środowiskowe

Klucz API powinien być przechowywany w zmiennych środowiskowych:

1. Utwórz plik `.env.local` w głównym katalogu projektu
2. Dodaj zmienną `GOOGLE_MAPS_API_KEY=twój_klucz_api`
3. W pliku `.gitignore` upewnij się, że plik `.env.local` jest ignorowany

## Endpoint API w Next.js

Plik `src/app/api/znajdz-fachowca/route.ts` implementuje endpoint, który:

1. Przyjmuje parametry wyszukiwania (location, radius, type, keyword)
2. Waliduje parametry
3. Wywołuje Google Maps Places API z kluczem przechowywanym po stronie serwera
4. Przekazuje wyniki z powrotem do klienta

Kod endpoint'u:

```typescript
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { location, radius, type, keyword } = body;

    // Sprawdzanie wymaganych parametrów
    if (!location || !radius || !type) {
      return NextResponse.json(
        { error: "Brakujące parametry: wymagane są location, radius i type" },
        { status: 400 }
      );
    }

    // Pobranie klucza API z zmiennych środowiskowych
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Brak skonfigurowanego klucza API" },
        { status: 500 }
      );
    }

    // Budowanie URL zapytania do Google Maps Places API
    let apiUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location}&radius=${radius}&type=${type}&key=${apiKey}`;

    // Dodanie keyword do zapytania, jeśli istnieje
    if (keyword) {
      apiUrl += `&keyword=${encodeURIComponent(keyword)}`;
    }

    // Wywołanie Google Maps Places API
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`Google API error! Status: ${response.status}`);
    }

    const data = await response.json();

    // Zwracanie wyników
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in API route:", error);

    return NextResponse.json(
      { error: "Wystąpił błąd podczas przetwarzania zapytania" },
      { status: 500 }
    );
  }
}
```

## Frontendowa obsługa API

Komponent `src/app/znajdz-fachowca/page.tsx` implementuje:

1. Formularz wyszukiwania
2. Wywołanie API przez endpoint Next.js
3. Mapowanie danych z API na strukturę danych aplikacji
4. Obsługę błędów i wyświetlanie danych zastępczych
5. Wyświetlanie listy fachowców z ocenami i możliwością kontaktu

## Obsługa błędów

Integracja została zaprojektowana z myślą o odporności na błędy:

1. Jeśli Google Maps API zwróci błąd, wyświetlamy komunikat o błędzie i przykładowe dane
2. Jeśli nie znaleziono wyników, wyświetlamy odpowiedni komunikat
3. W przypadku problemów z konfiguracją, aplikacja informuje o brakującym kluczu API

## Rozszerzenia i ulepszenia

Możliwe rozszerzenia integracji:

1. Dodanie obsługi stronicowania dla dużej liczby wyników
2. Implementacja pobierania szczegółowych danych o fachowcu (Places Details API)
3. Dodanie mapy pokazującej lokalizacje fachowców
4. Integracja z innymi API Google (Directions, Distance Matrix) do obliczania odległości i tras
