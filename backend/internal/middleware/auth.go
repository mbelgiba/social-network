package middleware

import (
	"context"
	"database/sql"
	"net/http"
	"time"
)

type ContextKey string

const UserIDKey ContextKey = "user_id"

func Auth(db *sql.DB) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Пытаемся получить куки с токеном сессии
			cookie, err := r.Cookie("session_token")
			if err != nil {
				http.Error(w, "Unauthorized", http.StatusUnauthorized)
				return
			}

			var userID string
			var expiresAt time.Time

			// Проверяем токен в базе данных
			err = db.QueryRow("SELECT user_id, expires_at FROM sessions WHERE session_token = ?", cookie.Value).Scan(&userID, &expiresAt)
			if err != nil {
				http.Error(w, "Unauthorized", http.StatusUnauthorized)
				return
			}

			// Проверяем, не истекла ли сессия
			if time.Now().After(expiresAt) {
				// Удаляем просроченную сессию
				db.Exec("DELETE FROM sessions WHERE session_token = ?", cookie.Value)
				http.Error(w, "Session expired", http.StatusUnauthorized)
				return
			}

			// Если всё отлично, кладем ID пользователя в контекст запроса
			ctx := context.WithValue(r.Context(), UserIDKey, userID)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}
