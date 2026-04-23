FROM golang:1.21-alpine AS builder

WORKDIR /app

# Устанавливаем зависимости для cgo (нужно для go-sqlite3)
RUN apk add --no-cache gcc musl-dev

COPY go.mod go.sum ./
RUN go mod download

COPY . .

# Собираем приложение
RUN CGO_ENABLED=1 GOOS=linux go build -o /app/server ./cmd/main.go

FROM alpine:latest

WORKDIR /app

# Копируем бинарник и миграции
COPY --from=builder /app/server .
COPY --from=builder /app/pkg/db/migrations ./pkg/db/migrations

EXPOSE 8080

CMD ["./server"]