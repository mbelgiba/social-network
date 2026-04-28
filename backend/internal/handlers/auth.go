package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"time"

	"social-network/backend/internal/models"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

type AuthHandler struct {
	DB *sql.DB
}

// Register — создание новой сущности в системе
func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req models.RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	userID := uuid.New().String()
	// По умолчанию создаем активного пользователя с ролью 'user'
	_, err = h.DB.Exec(`
		INSERT INTO users (id, email, password, first_name, last_name, date_of_birth, nickname, role, is_active) 
		VALUES (?, ?, ?, ?, ?, ?, ?, 'user', 1)`,
		userID, req.Email, string(hashedPassword), req.FirstName, req.LastName, req.DateOfBirth, req.Nickname)

	if err != nil {
		http.Error(w, "User already exists or database error", http.StatusConflict)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"message": "Identity created in Nexus"})
}

// Login — проверка прав на вход в сеть
func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req models.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid credentials format", http.StatusBadRequest)
		return
	}

	var user models.User
	err := h.DB.QueryRow("SELECT id, password, role, is_active FROM users WHERE email = ?", req.Email).
		Scan(&user.ID, &user.Password, &user.Role, &user.IsActive)

	if err != nil {
		http.Error(w, "Identity not found", http.StatusUnauthorized)
		return
	}

	// ПРОВЕРКА ВЛАСТИ: Если пользователь изгнан, вход запрещен
	if !user.IsActive {
		w.WriteHeader(http.StatusForbidden)
		json.NewEncoder(w).Encode(map[string]string{"error": "Your soul has been exiled from the Nexus by the Eye."})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		http.Error(w, "Invalid password", http.StatusUnauthorized)
		return
	}

	// Создание сессии
	sessionToken := uuid.New().String()
	expiresAt := time.Now().Add(24 * time.Hour)

	_, err = h.DB.Exec("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)",
		sessionToken, user.ID, expiresAt)
	if err != nil {
		http.Error(w, "Failed to create session", http.StatusInternalServerError)
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "session_token",
		Value:    sessionToken,
		Expires:  expiresAt,
		HttpOnly: true,
		Path:     "/",
		SameSite: http.SameSiteLaxMode,
	})

	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Access granted",
		"role":    user.Role,
	})
}

// Logout — разрыв связи
func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie("session_token")
	if err != nil {
		w.WriteHeader(http.StatusOK)
		return
	}

	h.DB.Exec("DELETE FROM sessions WHERE token = ?", cookie.Value)

	http.SetCookie(w, &http.Cookie{
		Name:     "session_token",
		Value:    "",
		Expires:  time.Now().Add(-1 * time.Hour),
		HttpOnly: true,
		Path:     "/",
	})
	w.WriteHeader(http.StatusOK)
}

// CheckAuth — проверка текущего статуса сессии
func (h *AuthHandler) CheckAuth(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie("session_token")
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var user models.User
	err = h.DB.QueryRow(`
		SELECT u.id, u.role, u.is_active 
		FROM users u 
		JOIN sessions s ON u.id = s.user_id 
		WHERE s.token = ? AND s.expires_at > ?`,
		cookie.Value, time.Now()).Scan(&user.ID, &user.Role, &user.IsActive)

	if err != nil || !user.IsActive {
		http.Error(w, "Session expired or user exiled", http.StatusUnauthorized)
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"authenticated": true,
		"role":          user.Role,
	})
}