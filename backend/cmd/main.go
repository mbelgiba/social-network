package main

import (
	"log"
	"net/http"
	"os"

	"social-network/internal/delivery/http"
	"social-network/internal/repository/sqlite"
	"social-network/internal/usecase"
	db "social-network/pkg/db/sqlite"
)

// Простая middleware для CORS (разрешаем запросы с фронтенда Next.js)
func enableCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		w.Header().Set("Access-Control-Allow-Credentials", "true")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func main() {
	dbPath := os.Getenv("DB_PATH")
	if dbPath == "" {
		dbPath = "./data/social_network.db"
	}

	database, err := db.NewDB(dbPath)
	if err != nil {
		log.Fatalf("Failed to initialize DB: %v", err)
	}
	defer database.Close()

	// Инициализация слоев Clean Architecture
	userRepo := sqlite.NewUserRepository(database)
	userUsecase := usecase.NewUserUsecase(userRepo)

	mux := http.NewServeMux()
	http.NewUserHandler(mux, userUsecase)

	// Запуск сервера
	port := ":8080"
	log.Printf("Starting backend server on port %s", port)
	if err := http.ListenAndServe(port, enableCORS(mux)); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}