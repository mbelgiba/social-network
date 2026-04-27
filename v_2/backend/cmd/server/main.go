package main

import (
	"database/sql"
	"log"
	"net/http"
	"os"

	"social-network/internal/handlers"
	"social-network/internal/middleware"
	"social-network/pkg/db/sqlite"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
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

func ensureAdmin(db *sql.DB) {
	var exists bool
	db.QueryRow("SELECT EXISTS(SELECT 1 FROM users WHERE email = 'admin@01.net')").Scan(&exists)
	if !exists {
		hashed, _ := bcrypt.GenerateFromPassword([]byte("admin123"), bcrypt.DefaultCost)
		db.Exec("INSERT INTO users (id, email, password, first_name, last_name, role) VALUES (?, ?, ?, ?, ?, ?)",
			uuid.New().String(), "admin@01.net", string(hashed), "System", "Admin", "admin")
	}
}

func main() {
	dbPath := os.Getenv("DB_PATH")
	if dbPath == "" {
		dbPath = "social_network.db"
	}
	db, err := sqlite.InitDB(dbPath)
	if err != nil {
		log.Fatalf("Ошибка инициализации БД: %v", err)
	}
	defer db.Close()

	// Создание всех необходимых таблиц
	db.Exec(`
		CREATE TABLE IF NOT EXISTS users (
			id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, password TEXT NOT NULL,
			first_name TEXT, last_name TEXT, date_of_birth TEXT, avatar TEXT, nickname TEXT, about_me TEXT,
			is_public BOOLEAN DEFAULT TRUE, role TEXT DEFAULT 'user', created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		);
		CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, user_id TEXT NOT NULL, expires_at DATETIME NOT NULL, FOREIGN KEY (user_id) REFERENCES users(id));
		CREATE TABLE IF NOT EXISTS posts (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, content TEXT, image_url TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE);
		CREATE TABLE IF NOT EXISTS post_likes (post_id TEXT NOT NULL, user_id TEXT NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (post_id, user_id), FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE);
		CREATE TABLE IF NOT EXISTS comments (id TEXT PRIMARY KEY, post_id TEXT NOT NULL, user_id TEXT NOT NULL, content TEXT NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE);
		CREATE TABLE IF NOT EXISTS followers (follower_id TEXT NOT NULL, following_id TEXT NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (follower_id, following_id), FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE, FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE);
		CREATE TABLE IF NOT EXISTS messages (id TEXT PRIMARY KEY, sender_id TEXT NOT NULL, receiver_id TEXT NOT NULL, content TEXT NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE, FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE);
		CREATE TABLE IF NOT EXISTS notifications (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, actor_id TEXT NOT NULL, type TEXT NOT NULL, post_id TEXT, is_read BOOLEAN DEFAULT FALSE, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE CASCADE);
		CREATE TABLE IF NOT EXISTS ads (id TEXT PRIMARY KEY, title TEXT, content TEXT, link TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
		
		CREATE TABLE IF NOT EXISTS groups (id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT, creator_id TEXT NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE);
		CREATE TABLE IF NOT EXISTS group_members (group_id TEXT NOT NULL, user_id TEXT NOT NULL, role TEXT DEFAULT 'member', joined_at DATETIME DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (group_id, user_id), FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE);
		CREATE TABLE IF NOT EXISTS group_posts (id TEXT PRIMARY KEY, group_id TEXT NOT NULL, user_id TEXT NOT NULL, content TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE);
	`)

	ensureAdmin(db)

	authHandler := &handlers.AuthHandler{DB: db}
	profileHandler := &handlers.ProfileHandler{DB: db}
	postHandler := &handlers.PostHandler{DB: db}
	followHandler := &handlers.FollowHandler{DB: db}
	notifyHandler := &handlers.NotifyHandler{DB: db}
	adminHandler := &handlers.AdminHandler{DB: db}
	groupHandler := &handlers.GroupHandler{DB: db}
	wsManager := handlers.NewWsManager(db)

	authMiddleware := middleware.Auth(db)
	mux := http.NewServeMux()

	// Статические файлы (картинки)
	fs := http.FileServer(http.Dir("uploads"))
	mux.Handle("/uploads/", http.StripPrefix("/uploads/", fs))

	// Публичные маршруты
	mux.HandleFunc("/api/register", authHandler.Register)
	mux.HandleFunc("/api/login", authHandler.Login)
	mux.HandleFunc("/api/check-auth", authHandler.CheckAuth)
	mux.HandleFunc("/api/logout", authHandler.Logout)

	// Защищенные маршруты (через Middleware)
	mux.Handle("/api/profile", authMiddleware(http.HandlerFunc(profileHandler.GetProfile)))
	mux.Handle("/api/profile/update", authMiddleware(http.HandlerFunc(profileHandler.UpdateProfile)))
	mux.Handle("/api/profile/privacy", authMiddleware(http.HandlerFunc(profileHandler.TogglePrivacy)))
	mux.Handle("/api/users", authMiddleware(http.HandlerFunc(profileHandler.GetUsers)))
	mux.Handle("/api/users/follow", authMiddleware(http.HandlerFunc(followHandler.ToggleFollow)))

	mux.Handle("/api/posts", authMiddleware(http.HandlerFunc(postHandler.GetPosts)))
	mux.Handle("/api/posts/create", authMiddleware(http.HandlerFunc(postHandler.CreatePost)))
	mux.Handle("/api/posts/like", authMiddleware(http.HandlerFunc(postHandler.ToggleLike)))
	mux.Handle("/api/posts/delete-own", authMiddleware(http.HandlerFunc(postHandler.DeleteOwnPost)))
	mux.Handle("/api/posts/edit-own", authMiddleware(http.HandlerFunc(postHandler.EditOwnPost)))

	mux.Handle("/api/comments", authMiddleware(http.HandlerFunc(postHandler.GetComments)))
	mux.Handle("/api/comments/create", authMiddleware(http.HandlerFunc(postHandler.CreateComment)))
	mux.Handle("/api/upload", authMiddleware(http.HandlerFunc(handlers.UploadFile)))

	mux.Handle("/api/notifications", authMiddleware(http.HandlerFunc(notifyHandler.GetNotifications)))
	mux.Handle("/api/notifications/read", authMiddleware(http.HandlerFunc(notifyHandler.MarkRead)))

	mux.Handle("/api/users/online", authMiddleware(http.HandlerFunc(wsManager.GetOnlineUsers)))
	mux.Handle("/api/messages/history", authMiddleware(http.HandlerFunc(wsManager.GetHistory)))
	mux.Handle("/api/ws", authMiddleware(http.HandlerFunc(wsManager.HandleConnections)))

	mux.Handle("/api/groups", authMiddleware(http.HandlerFunc(groupHandler.GetGroups)))
	mux.Handle("/api/groups/create", authMiddleware(http.HandlerFunc(groupHandler.CreateGroup)))
	mux.Handle("/api/groups/join", authMiddleware(http.HandlerFunc(groupHandler.ToggleJoinGroup)))
	mux.Handle("/api/groups/posts", authMiddleware(http.HandlerFunc(groupHandler.GetGroupPosts)))
	mux.Handle("/api/groups/posts/create", authMiddleware(http.HandlerFunc(groupHandler.CreateGroupPost)))

	mux.Handle("/api/ads", authMiddleware(http.HandlerFunc(adminHandler.GetAds)))
	mux.Handle("/api/admin/ads", authMiddleware(http.HandlerFunc(adminHandler.CreateAd)))
	mux.Handle("/api/admin/ads/delete", authMiddleware(http.HandlerFunc(adminHandler.DeleteAd)))
	mux.Handle("/api/admin/users/delete", authMiddleware(http.HandlerFunc(adminHandler.DeleteUser)))
	mux.Handle("/api/admin/posts/delete", authMiddleware(http.HandlerFunc(adminHandler.DeletePost)))

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Printf("Сервер запущен на порту %s", port)
	http.ListenAndServe(":"+port, enableCORS(mux))
}
