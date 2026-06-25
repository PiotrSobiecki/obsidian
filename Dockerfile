# Użyj obrazu Node.js 20 jako bazowego
FROM node:20-alpine AS base

# Etap instalacji zależności
FROM base AS deps
WORKDIR /app

# Kopiuj pliki potrzebne do instalacji zależności
COPY package.json package-lock.json* ./

# Instaluj wszystkie zależności, w tym deweloperskie
RUN npm ci

# Etap budowania
FROM base AS builder
WORKDIR /app

# Kopiuj zależności z poprzedniego etapu
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Budowanie aplikacji
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Etap produkcyjny
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED 1

# Tworzenie użytkownika o ograniczonych uprawnieniach
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Kopiuj niezbędne pliki z etapu budowania
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Ustaw odpowiednie uprawnienia
RUN chown -R nextjs:nodejs /app

# Przełącz na użytkownika bez uprawnień roota
USER nextjs

# Ekspozycja portu
EXPOSE 3000

# Ustaw zmienną środowiskową dla hosta
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Uruchom aplikację
CMD ["node", "server.js"] 