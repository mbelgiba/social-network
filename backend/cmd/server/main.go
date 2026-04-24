package main

import (
	"log"
	"net/http"
	"os"

	"social-network/internal/handlers"
	"social-network/internal/middleware"
	"social-network/pkg/db/sqlite"
)

func enableCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
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
		dbPath = "social_network.db"
	}

	db, err := sqlite.InitDB(dbPath)
	if err != nil {
		log.Fatalf("Could not initialize database: %v", err)
	}
	defer db.Close()

	// Инициализируем обработчики
	authHandler := &handlers.AuthHandler{DB: db}
	profileHandler := &handlers.ProfileHandler{DB: db}

	// Инициализируем Middleware для защиты маршрутов
	authMiddleware := middleware.Auth(db)

	mux := http.NewServeMux()

	// Публичные маршруты
	mux.HandleFunc("/api/register", authHandler.Register)
	mux.HandleFunc("/api/login", authHandler.Login)
	mux.HandleFunc("/api/check-auth", authHandler.CheckAuth)
	mux.HandleFunc("/api/logout", authHandler.Logout)

	// Защищенные маршруты (оборачиваем их в authMiddleware)
	mux.Handle("/api/profile", authMiddleware(http.HandlerFunc(profileHandler.GetProfile)))
	mux.Handle("/api/profile/privacy", authMiddleware(http.HandlerFunc(profileHandler.TogglePrivacy)))

	handler := enableCORS(mux)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	if err := http.ListenAndServe(":"+port, handler); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}
