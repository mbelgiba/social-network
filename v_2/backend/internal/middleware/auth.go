package middleware

import (
	"context"
	"database/sql"
	"net/http"
	"time"
)

type contextKey string

const UserIDKey contextKey = "userID"

func Auth(db *sql.DB) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Читаем куку сессии
			cookie, err := r.Cookie("session_token")
			if err != nil {
				http.Error(w, "Unauthorized", http.StatusUnauthorized)
				return
			}

			var userID string
			// Проверяем, существует ли токен и не истек ли он
			err = db.QueryRow("SELECT user_id FROM sessions WHERE token = ? AND expires_at > ?", cookie.Value, time.Now()).Scan(&userID)
			if err != nil {
				http.Error(w, "Unauthorized", http.StatusUnauthorized)
				return
			}

			// Добавляем ID пользователя в контекст запроса для использования в хэндлерах
			ctx := context.WithValue(r.Context(), UserIDKey, userID)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}
