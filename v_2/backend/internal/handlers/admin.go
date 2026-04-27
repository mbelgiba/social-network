package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"social-network/internal/models"

	"github.com/google/uuid"
)

type AdminHandler struct{ DB *sql.DB }

func (h *AdminHandler) GetAds(w http.ResponseWriter, r *http.Request) {
	rows, _ := h.DB.Query("SELECT id, title, content, link FROM ads")
	defer rows.Close()
	var ads []models.Ad
	for rows.Next() {
		var a models.Ad
		rows.Scan(&a.ID, &a.Title, &a.Content, &a.Link)
		ads = append(ads, a)
	}
	json.NewEncoder(w).Encode(ads)
}

func (h *AdminHandler) CreateAd(w http.ResponseWriter, r *http.Request) {
	var req models.Ad
	json.NewDecoder(r.Body).Decode(&req)
	h.DB.Exec("INSERT INTO ads (id, title, content, link) VALUES (?, ?, ?, ?)", uuid.New().String(), req.Title, req.Content, req.Link)
	w.WriteHeader(http.StatusCreated)
}

func (h *AdminHandler) DeleteAd(w http.ResponseWriter, r *http.Request) {
	h.DB.Exec("DELETE FROM ads WHERE id = ?", r.URL.Query().Get("id"))
	w.WriteHeader(http.StatusOK)
}

func (h *AdminHandler) DeleteUser(w http.ResponseWriter, r *http.Request) {
	h.DB.Exec("DELETE FROM users WHERE id = ?", r.URL.Query().Get("id"))
	w.WriteHeader(http.StatusOK)
}

func (h *AdminHandler) DeletePost(w http.ResponseWriter, r *http.Request) {
	h.DB.Exec("DELETE FROM posts WHERE id = ?", r.URL.Query().Get("id"))
	w.WriteHeader(http.StatusOK)
}
