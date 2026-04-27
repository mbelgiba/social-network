package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"social-network/internal/middleware"
	"social-network/internal/models"
)

type ProfileHandler struct{ DB *sql.DB }

func (h *ProfileHandler) GetProfile(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(middleware.UserIDKey).(string)
	var user models.User
	h.DB.QueryRow("SELECT id, email, first_name, last_name, date_of_birth, IFNULL(avatar, ''), IFNULL(nickname, ''), IFNULL(about_me, ''), is_public, role FROM users WHERE id = ?", userID).Scan(&user.ID, &user.Email, &user.FirstName, &user.LastName, &user.DateOfBirth, &user.Avatar, &user.Nickname, &user.AboutMe, &user.IsPublic, &user.Role)
	json.NewEncoder(w).Encode(user)
}

func (h *ProfileHandler) UpdateProfile(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(middleware.UserIDKey).(string)
	var req models.User
	json.NewDecoder(r.Body).Decode(&req)
	h.DB.Exec("UPDATE users SET first_name = ?, last_name = ?, about_me = ?, avatar = ? WHERE id = ?", req.FirstName, req.LastName, req.AboutMe, req.Avatar, userID)
	w.WriteHeader(http.StatusOK)
}

func (h *ProfileHandler) TogglePrivacy(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(middleware.UserIDKey).(string)
	h.DB.Exec("UPDATE users SET is_public = NOT is_public WHERE id = ?", userID)
	w.WriteHeader(http.StatusOK)
}

func (h *ProfileHandler) GetUsers(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(middleware.UserIDKey).(string)
	rows, _ := h.DB.Query("SELECT id, email, first_name, last_name, IFNULL(avatar, ''), IFNULL(about_me, ''), EXISTS(SELECT 1 FROM followers WHERE follower_id = ? AND following_id = id) FROM users WHERE id != ?", userID, userID)
	defer rows.Close()
	var users []models.User
	for rows.Next() {
		var u models.User
		rows.Scan(&u.ID, &u.Email, &u.FirstName, &u.LastName, &u.Avatar, &u.AboutMe, &u.IsFollowing)
		users = append(users, u)
	}
	json.NewEncoder(w).Encode(users)
}
