package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"social-network/internal/middleware"
	"social-network/internal/models"
)

type NotifyHandler struct{ DB *sql.DB }

func (h *NotifyHandler) GetNotifications(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(middleware.UserIDKey).(string)
	rows, _ := h.DB.Query("SELECT n.id, n.type, u.first_name, n.post_id, n.is_read, n.created_at FROM notifications n JOIN users u ON n.actor_id = u.id WHERE n.user_id = ? ORDER BY n.created_at DESC", userID)
	defer rows.Close()
	var notifs []models.Notification
	for rows.Next() {
		var n models.Notification
		var pID sql.NullString
		rows.Scan(&n.ID, &n.Type, &n.ActorName, &pID, &n.IsRead, &n.CreatedAt)
		n.PostID = pID.String
		notifs = append(notifs, n)
	}
	json.NewEncoder(w).Encode(notifs)
}

func (h *NotifyHandler) MarkRead(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(middleware.UserIDKey).(string)
	h.DB.Exec("UPDATE notifications SET is_read = TRUE WHERE user_id = ?", userID)
	w.WriteHeader(http.StatusOK)
}
