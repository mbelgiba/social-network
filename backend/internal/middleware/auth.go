package middleware

import (
	"context"
	"database/sql"
	"net/http"
	"time"
)

type contextKey string

const UserIDKey contextKey = "user_id"
const UserRoleKey contextKey = "user_role"

func Auth(db *sql.DB) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			cookie, err := r.Cookie("session_token")
			if err != nil {
				http.Error(w, "Unauthorized: No session", http.StatusUnauthorized)
				return
			}

			var userID string
			var userRole string
			var isActive bool

			// Проверяем сессию и статус пользователя одним запросом
			err = db.QueryRow(`
				SELECT u.id, u.role, u.is_active 
				FROM users u 
				JOIN sessions s ON u.id = s.user_id 
				WHERE s.token = ? AND s.expires_at > ?`,
				cookie.Value, time.Now()).Scan(&userID, &userRole, &isActive)

			if err != nil {
				if err == sql.ErrNoRows {
					http.Error(w, "Unauthorized: Invalid session", http.StatusUnauthorized)
				} else {
					http.Error(w, "Database error", http.StatusInternalServerError)
				}
				return
			}

			// ПРОВЕРКА ВЛАСТИ: Если админ изгнал пользователя, прерываем запрос немедленно
			if !isActive {
				http.Error(w, "Your soul has been exiled from the Nexus.", http.StatusForbidden)
				return
			}

			// Передаем ID и Роль дальше в контекст для использования в хендлерах
			ctx := context.WithValue(r.Context(), UserIDKey, userID)
			ctx = context.WithValue(ctx, UserRoleKey, userRole)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}