package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"time"

	"social-network/internal/models"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

type AuthHandler struct {
	DB *sql.DB
}

func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "", http.StatusMethodNotAllowed)
		return
	}

	var req models.RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "", http.StatusBadRequest)
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, "", http.StatusInternalServerError)
		return
	}

	userID := uuid.New().String()

	role := "user"
	if req.Email == "admin@01.net" {
		role = "admin"
	}

	_, err = h.DB.Exec(`
		INSERT INTO users (id, email, password, first_name, last_name, date_of_birth, avatar, nickname, about_me, role)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		userID, req.Email, string(hashedPassword), req.FirstName, req.LastName, req.DateOfBirth, req.Avatar, req.Nickname, req.AboutMe, role,
	)

	if err != nil {
		http.Error(w, "Email already exists", http.StatusConflict)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"message": "success"})
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "", http.StatusMethodNotAllowed)
		return
	}

	var req models.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "", http.StatusBadRequest)
		return
	}

	var userID, hashedPassword string
	err := h.DB.QueryRow("SELECT id, password FROM users WHERE email = ?", req.Email).Scan(&userID, &hashedPassword)
	if err != nil {
		http.Error(w, "User not found", http.StatusUnauthorized)
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(req.Password)); err != nil {
		http.Error(w, "Wrong password", http.StatusUnauthorized)
		return
	}

	sessionToken := uuid.New().String()
	expiresAt := time.Now().Add(24 * time.Hour)

	_, err = h.DB.Exec("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)", sessionToken, userID, expiresAt)
	if err != nil {
		http.Error(w, "", http.StatusInternalServerError)
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "session_token",
		Value:    sessionToken,
		Expires:  expiresAt,
		Path:     "/",
		HttpOnly: true,
		Secure:   false,
		SameSite: http.SameSiteLaxMode,
	})

	json.NewEncoder(w).Encode(map[string]string{"message": "success"})
}

func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie("session_token")
	if err != nil {
		http.Error(w, "", http.StatusUnauthorized)
		return
	}

	h.DB.Exec("DELETE FROM sessions WHERE token = ?", cookie.Value)

	http.SetCookie(w, &http.Cookie{
		Name:     "session_token",
		Value:    "",
		Expires:  time.Now().Add(-1 * time.Hour),
		Path:     "/",
		HttpOnly: true,
		Secure:   false,
	})

	w.WriteHeader(http.StatusOK)
}

func (h *AuthHandler) CheckAuth(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie("session_token")
	if err != nil {
		http.Error(w, "", http.StatusUnauthorized)
		return
	}

	var userID string
	err = h.DB.QueryRow("SELECT user_id FROM sessions WHERE token = ? AND expires_at > ?", cookie.Value, time.Now()).Scan(&userID)
	if err != nil {
		http.Error(w, "", http.StatusUnauthorized)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"user_id": userID})
}
