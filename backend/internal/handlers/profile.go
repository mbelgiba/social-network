package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"social-network/backend/internal/middleware"
	"social-network/backend/internal/models"
)

type ProfileHandler struct {
	DB *sql.DB
}

func (h *ProfileHandler) GetProfile(w http.ResponseWriter, r *http.Request) {
	currentUserID := r.Context().Value(middleware.UserIDKey).(string)
	targetID := r.URL.Query().Get("id")
	if targetID == "" {
		targetID = currentUserID
	}

	// Расширенный запрос для получения счетчиков
	var u struct {
		models.User
		FollowersCount int `json:"followers_count"`
		FollowingCount int `json:"following_count"`
	}

	err := h.DB.QueryRow(`
		SELECT id, email, first_name, last_name, IFNULL(date_of_birth, ''), 
		       IFNULL(avatar, ''), IFNULL(nickname, ''), IFNULL(about_me, ''), 
		       is_public, role, is_active, created_at,
		       (SELECT COUNT(*) FROM followers WHERE following_id = users.id) as f_count,
		       (SELECT COUNT(*) FROM followers WHERE follower_id = users.id) as fl_count
		FROM users WHERE id = ?`, targetID).Scan(
		&u.ID, &u.Email, &u.FirstName, &u.LastName, &u.DateOfBirth, 
		&u.Avatar, &u.Nickname, &u.AboutMe, &u.IsPublic, &u.Role, &u.IsActive, &u.CreatedAt,
		&u.FollowersCount, &u.FollowingCount,
	)

	if err != nil {
		http.Error(w, "Subject missing", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(u)
}

func (h *ProfileHandler) UpdateProfile(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(middleware.UserIDKey).(string)
	var req models.User
	json.NewDecoder(r.Body).Decode(&req)

	_, err := h.DB.Exec("UPDATE users SET first_name = ?, last_name = ?, about_me = ?, avatar = ? WHERE id = ?", 
		req.FirstName, req.LastName, req.AboutMe, req.Avatar, userID)

	if err != nil {
		http.Error(w, "Update failed", 500)
		return
	}
	w.WriteHeader(http.StatusOK)
}

func (h *ProfileHandler) TogglePrivacy(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(middleware.UserIDKey).(string)
	h.DB.Exec("UPDATE users SET is_public = NOT is_public WHERE id = ?", userID)
	w.WriteHeader(http.StatusOK)
}

func (h *ProfileHandler) GetUsers(w http.ResponseWriter, r *http.Request) {
	currentUserID := r.Context().Value(middleware.UserIDKey).(string)
	rows, err := h.DB.Query("SELECT id, first_name, last_name, avatar, nickname, role, is_active FROM users WHERE id != ?", currentUserID)
	if err != nil {
		http.Error(w, "Query error", 500)
		return
	}
	defer rows.Close()

	var users []models.User
	for rows.Next() {
		var u models.User
		rows.Scan(&u.ID, &u.FirstName, &u.LastName, &u.Avatar, &u.Nickname, &u.Role, &u.IsActive)
		users = append(users, u)
	}
	json.NewEncoder(w).Encode(users)
}