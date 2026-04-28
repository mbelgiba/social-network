# 1-кезең: Тәуелділіктерді орнату және Жобаны жинау (Builder)
FROM node:18-alpine AS builder

WORKDIR /app

# package.json файлдарын көшіреміз
COPY package.json package-lock.json* ./

# ИСПОЛЬЗУЕМ npm install ВМЕСТО npm ci
RUN npm install

# Қалған барлық кодты көшіреміз
COPY . .

# Next.js жобасын құрастырамыз (Production Build)
RUN npm run build

# 2-кезең: Іске қосу (Runner) - Жеңіл контейнер
FROM node:18-alpine AS runner

WORKDIR /app

ENV NODE_ENV production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

CMD ["npm", "start"]