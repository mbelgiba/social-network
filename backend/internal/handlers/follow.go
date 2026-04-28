// backend/internal/handlers/follow.go

package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"time"

	"social-network/backend/internal/middleware"

	"github.com/google/uuid"
)

type FollowHandler struct {
	DB *sql.DB
}

// ToggleFollow — Установление или разрыв связи между узлами
func (h *FollowHandler) ToggleFollow(w http.ResponseWriter, r *http.Request) {
	// Получаем ID того, кто подписывается (из контекста авторизации)
	followerID := r.Context().Value(middleware.UserIDKey).(string)
	
	// Получаем ID цели (из параметров запроса)
	targetID := r.URL.Query().Get("id")

	if targetID == "" || targetID == followerID {
		http.Error(w, "Invalid target node", http.StatusBadRequest)
		return
	}

	// Проверяем, существует ли уже связь
	var exists bool
	err := h.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM followers WHERE follower_id = ? AND following_id = ?)", 
		followerID, targetID).Scan(&exists)

	if err != nil {
		http.Error(w, "Database search failure", http.StatusInternalServerError)
		return
	}

	if exists {
		// Если связь есть — разрываем (Unfollow)
		_, err = h.DB.Exec("DELETE FROM followers WHERE follower_id = ? AND following_id = ?", 
			followerID, targetID)
		if err != nil {
			http.Error(w, "Severing link failed", http.StatusInternalServerError)
			return
		}
	} else {
		// Если связи нет — устанавливаем (Follow)
		_, err = h.DB.Exec("INSERT INTO followers (follower_id, following_id, created_at) VALUES (?, ?, ?)", 
			followerID, targetID, time.Now())
		if err != nil {
			http.Error(w, "Establishing link failed", http.StatusInternalServerError)
			return
		}

		// Генерируем уведомление для цели: "Око заметило вашу активность" или просто "У вас новый подписчик"
		h.DB.Exec("INSERT INTO notifications (id, user_id, actor_id, type) VALUES (?, ?, ?, 'follow')",
			uuid.New().String(), targetID, followerID)
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]bool{"linked": !exists})
}

// GetFollowers — Получение списка всех узлов, подписанных на данный узел
func (h *FollowHandler) GetFollowers(w http.ResponseWriter, r *http.Request) {
	userID := r.URL.Query().Get("id")
	if userID == "" {
		userID = r.Context().Value(middleware.UserIDKey).(string)
	}

	rows, err := h.DB.Query(`
		SELECT u.id, u.first_name, u.last_name, u.avatar 
		FROM users u 
		JOIN followers f ON u.id = f.follower_id 
		WHERE f.following_id = ?`, userID)

	if err != nil {
		http.Error(w, "Followers retrieval failed", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var followers []map[string]string
	for rows.Next() {
		var id, fn, ln, av string
		if err := rows.Scan(&id, &fn, &ln, &av); err == nil {
			followers = append(followers, map[string]string{
				"id": id, "name": fn + " " + ln, "avatar": av,
			})
		}
	}

	json.NewEncoder(w).Encode(followers)
}