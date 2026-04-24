FROM golang:1.21-alpine AS builder

# Устанавливаем gcc и libc-dev для компиляции SQLite (CGO)
RUN apk add --no-cache gcc musl-dev

WORKDIR /app

# Копируем go.mod
COPY go.mod ./

# Копируем весь остальной код проекта
COPY . .

# ТЕПЕРЬ скачиваем зависимости и генерируем go.sum
RUN go mod tidy

# Компилируем с CGO_ENABLED=1 и специальным флагом совместимости для новой версии Alpine
RUN CGO_ENABLED=1 CGO_CFLAGS="-D_LARGEFILE64_SOURCE" GOOS=linux go build -o main ./cmd/server/main.go

FROM alpine:latest

WORKDIR /app

# Копируем бинарник и миграции
COPY --from=builder /app/main .
COPY --from=builder /app/pkg/db/migrations/sqlite ./pkg/db/migrations/sqlite

# Папка для базы данных
RUN mkdir -p /app/data

EXPOSE 8080

CMD ["./main"]