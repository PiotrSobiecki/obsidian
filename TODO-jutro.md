# TODO — na jutro (zostawione 2026-06-27)

Stan: wdrożone na prod, **niezacommitowane**. Backfill przeszedł, baza ~20 → setki koncertów na 3+ mies. SOAD/Judas/Manson/Voivod wchodzą z Ticketmastera poprawnie (deterministyczny parser).

## Do zrobienia

### 1. Duplikaty tego samego koncertu (priorytet)
Ten sam koncert wpada z kilku nakładających się źródeł (TM national listing + strony `ticketmaster.pl/artist/*` i `/venue/*` + eBilet), każde z innym tytułem → inny `fingerprint` → brak dedup. Przykłady: Voivod 28.07 ×4, Slaughter To Prevail ×3 (warszawa).
- **Opcja A:** cross-source dedup po `dacie + sala + fuzzy-tytuł` (np. normalizacja tytułu, usunięcie „| Support: …", porównanie podobieństwa).
- **Opcja B:** dezaktywować strony `ticketmaster.pl/artist/*` i `/venue/*` jako źródła (dublują national listing). Szybsze, mniej kodu.

### 2. Brak linku do biletów dla eventów z national listingu TM
`findTicketUrlNearTitle` nie trafia w href `/event/...` przy ekstrakcji z TM. Dorobić wyciąganie `ticket_url` w `extract-ticketmaster-events.ts` (parsować href `/event/{slug}` z surowego HTML obok tytułu) albo poprawić `attachTicketUrls`.

### 3. Śmieciowe reaktywowane źródła → DLQ
Część z 569 reaktywowanych to news/portale (naszemiasto.pl, interia, metalnews) → 403/404 → trafiają do `obsidian-collect-dlq`. Przejrzeć DLQ, zawęzić reaktywację/klasyfikację Discovery, ewentualnie dezaktywować te URL-e.

### 4. Leak gatunkowy
Opera „Festiwal Ogrody Muzyczne / Artur Ruciński" jest w warszawa (pop/klasyka przeszła filtr). Sprawdzić źródło i dociągnąć `genre-policy`.

### 5. Commit
Zacommitować dzisiejsze zmiany (parser chunking, Collector przez Queues, fix footgun reseedu, reaktywacja, deterministyczny parser TM, isJunkTitle + cleanup, urlLike).

## Przydatne komendy
```bash
# tylko Ticketmaster, bez drenażu całości:
curl -X POST -H "x-api-key: $API_KEY" \
  "$BASE/admin/collect/enqueue?force=1&urlLike=ticketmaster"

# pełny backfill:
curl -X POST -H "x-api-key: $API_KEY" "$BASE/admin/collect/enqueue?force=1"

# reaktywacja źródeł:
curl -X POST -H "x-api-key: $API_KEY" "$BASE/admin/sources/reactivate"
```
(`BASE=https://obsidian-data-service.piotr-sobiecki.workers.dev`, `API_KEY` z `apps/data-service/.production.vars`)
