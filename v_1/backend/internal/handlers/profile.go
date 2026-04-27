package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"

	"social-network/internal/middleware"
	"social-network/internal/models"
)

type ProfileHandler struct {
	DB *sql.DB
}

func (h *ProfileHandler) GetProfile(w http.ResponseWriter, r *http.Request) {
	// Достаем ID пользователя из контекста (положили его туда в middleware)
	userID := r.Context().Value(middleware.UserIDKey).(string)

	var user models.User
	// Достаем все поля, кроме пароля (он нам не нужен на фронтенде)
	err := h.DB.QueryRow(`
		SELECT id, email, first_name, last_name, date_of_birth, avatar, nickname, about_me, is_public, created_at 
		FROM users WHERE id = ?`, userID).
		Scan(&user.ID, &user.Email, &user.FirstName, &user.LastName, &user.DateOfBirth, &user.Avatar, &user.Nickname, &user.AboutMe, &user.IsPublic, &user.CreatedAt)

	if err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}

func (h *ProfileHandler) TogglePrivacy(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userID := r.Context().Value(middleware.UserIDKey).(string)

	// Меняем is_public на противоположное значение
	_, err := h.DB.Exec("UPDATE users SET is_public = NOT is_public WHERE id = ?", userID)
	if err != nil {
		http.Error(w, "Error updating privacy", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Privacy setting updated"})
}
