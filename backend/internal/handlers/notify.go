package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"social-network/backend/internal/middleware"
	"social-network/backend/internal/models"
)

type NotifyHandler struct {
	DB *sql.DB
}

// GetNotifications — Сбор всех сигналов, направленных текущему субъекту
func (h *NotifyHandler) GetNotifications(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(middleware.UserIDKey).(string)

	rows, err := h.DB.Query(`
		SELECT n.id, n.type, n.post_id, n.is_read, n.created_at, u.first_name, u.last_name 
		FROM notifications n
		JOIN users u ON n.actor_id = u.id
		WHERE n.user_id = ?
		ORDER BY n.created_at DESC`, userID)

	if err != nil {
		http.Error(w, "Signal retrieval failed", 500)
		return
	}
	defer rows.Close()

	var notifications []models.Notification
	for rows.Next() {
		var n models.Notification
		var f, l string
		if err := rows.Scan(&n.ID, &n.Type, &n.PostID, &n.IsRead, &n.CreatedAt, &f, &l); err == nil {
			n.ActorName = f + " " + l
			notifications = append(notifications, n)
		}
	}

	json.NewEncoder(w).Encode(notifications)
}

// MarkRead — Подтверждение получения сигнала (установка статуса "Прочитано")
func (h *NotifyHandler) MarkRead(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(middleware.UserIDKey).(string)
	notifyID := r.URL.Query().Get("id")

	if notifyID != "" {
		h.DB.Exec("UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?", notifyID, userID)
	} else {
		// Если ID не указан, помечаем все как прочитанные
		h.DB.Exec("UPDATE notifications SET is_read = 1 WHERE user_id = ?", userID)
	}

	w.WriteHeader(http.StatusOK)
}