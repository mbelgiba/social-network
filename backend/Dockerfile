# 1-кезең: Құрастыру (Builder)
FROM golang:1.22-alpine AS builder

# Жұмыс папкасын орнатамыз
WORKDIR /app

# SQLite (cgo) жұмыс істеуі үшін қажетті C-кітапханаларын орнатамыз
RUN apk add --no-cache gcc musl-dev

# Тәуелділіктер файлдарын көшіреміз
COPY go.mod go.sum ./

# Кітапханаларды жүктейміз
RUN go mod download

# Жобаның барлық кодын көшіреміз
COPY . .

# CGO_ENABLED=1 міндетті түрде қажет! Жобаны компиляция жасаймыз
RUN CGO_ENABLED=1 GOOS=linux go build -o main ./cmd/server/main.go

# 2-кезең: Іске қосу (Runner) - Жеңіл әрі таза контейнер
FROM alpine:latest

WORKDIR /app

# Компиляцияланған файлды бірінші кезеңнен көшіріп аламыз
COPY --from=builder /app/main .

# Дерекқор мен суреттер сақталатын папкаларды құрамыз
RUN mkdir -p uploads data

# Портты ашамыз
EXPOSE 8080

# Серверді іске қосамыз
CMD ["./main"]