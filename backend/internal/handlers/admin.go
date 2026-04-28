package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"social-network/backend/internal/models"
)

type AdminHandler struct {
	DB *sql.DB
}

func NewAdminHandler(db *sql.DB) *AdminHandler {
	return &AdminHandler{DB: db}
}

// GetUsers возвращает список всех сущностей в сети
func (h *AdminHandler) GetUsers(w http.ResponseWriter, r *http.Request) {
	rows, err := h.DB.Query("SELECT id, email, first_name, last_name, role, is_active FROM users")
	if err != nil {
		http.Error(w, "Database failure", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var users []models.User
	for rows.Next() {
		var u models.User
		if err := rows.Scan(&u.ID, &u.Email, &u.FirstName, &u.LastName, &u.Role, &u.IsActive); err != nil {
			continue
		}
		users = append(users, u)
	}
	json.NewEncoder(w).Encode(users)
}

// ExileUser (Ban) - Отправляет пользователя в небытие
func (h *AdminHandler) ExileUser(w http.ResponseWriter, r *http.Request) {
	userID := r.URL.Query().Get("id")
	if userID == "" {
		http.Error(w, "Target ID required", http.StatusBadRequest)
		return
	}

	_, err := h.DB.Exec("UPDATE users SET is_active = 0 WHERE id = ?", userID)
	if err != nil {
		http.Error(w, "Exile failed", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}

// ElevateUser - Дарует пользователю статус Администратора (Око)
func (h *AdminHandler) ElevateUser(w http.ResponseWriter, r *http.Request) {
	userID := r.URL.Query().Get("id")
	_, err := h.DB.Exec("UPDATE users SET role = 'admin' WHERE id = ?", userID)
	if err != nil {
		http.Error(w, "Elevation failed", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}

// IncineratePost - Мгновенно уничтожает пост
func (h *AdminHandler) IncineratePost(w http.ResponseWriter, r *http.Request) {
	postID := r.URL.Query().Get("id")
	_, err := h.DB.Exec("DELETE FROM posts WHERE id = ?", postID)
	if err != nil {
		http.Error(w, "Incineration failed", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}

// GetAds - Получение спонсорских блоков
func (h *AdminHandler) GetAds(w http.ResponseWriter, r *http.Request) {
	rows, err := h.DB.Query("SELECT id, title, content, link FROM ads")
	if err != nil {
		http.Error(w, "Ads retrieval failed", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var ads []map[string]interface{}
	for rows.Next() {
		var id, title, content, link string
		rows.Scan(&id, &title, &content, &link)
		ads = append(ads, map[string]interface{}{"id": id, "title": title, "content": content, "link": link})
	}
	json.NewEncoder(w).Encode(ads)
}

// CreateAd - Инъекция новой рекламы
func (h *AdminHandler) CreateAd(w http.ResponseWriter, r *http.Request) {
	var ad struct {
		Title   string `json:"title"`
		Content string `json:"content"`
		Link    string `json:"link"`
	}
	if err := json.NewDecoder(r.Body).Decode(&ad); err != nil {
		http.Error(w, "Payload corruption", http.StatusBadRequest)
		return
	}

	_, err := h.DB.Exec("INSERT INTO ads (title, content, link) VALUES (?, ?, ?)", ad.Title, ad.Content, ad.Link)
	if err != nil {
		http.Error(w, "Injection failed", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusCreated)
}