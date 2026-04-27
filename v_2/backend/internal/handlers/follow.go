package handlers

import (
	"database/sql"
	"net/http"
	"social-network/internal/middleware"

	"github.com/google/uuid"
)

type FollowHandler struct{ DB *sql.DB }

func (h *FollowHandler) ToggleFollow(w http.ResponseWriter, r *http.Request) {
	followerID := r.Context().Value(middleware.UserIDKey).(string)
	followingID := r.URL.Query().Get("id")

	var exists bool
	h.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM followers WHERE follower_id = ? AND following_id = ?)", followerID, followingID).Scan(&exists)

	if exists {
		h.DB.Exec("DELETE FROM followers WHERE follower_id = ? AND following_id = ?", followerID, followingID)
	} else {
		h.DB.Exec("INSERT INTO followers (follower_id, following_id) VALUES (?, ?)", followerID, followingID)
		h.DB.Exec("INSERT INTO notifications (id, user_id, actor_id, type) VALUES (?, ?, ?, 'follow')", uuid.New().String(), followingID, followerID)
	}
	w.WriteHeader(http.StatusOK)
}
