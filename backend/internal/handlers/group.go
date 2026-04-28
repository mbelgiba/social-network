package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"time"

	"social-network/backend/internal/middleware"
	"social-network/backend/internal/models"

	"github.com/google/uuid"
)

type GroupHandler struct {
	DB *sql.DB
}

// CreateGroup — Инициализация нового сектора
func (h *GroupHandler) CreateGroup(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(middleware.UserIDKey).(string)
	var req struct {
		Name        string `json:"name"`
		Description string `json:"description"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Bad request", 400)
		return
	}

	groupID := uuid.New().String()
	_, err := h.DB.Exec("INSERT INTO groups (id, name, description, creator_id, created_at) VALUES (?, ?, ?, ?, ?)", 
		groupID, req.Name, req.Description, userID, time.Now())
	
	if err != nil {
		http.Error(w, "Failed to create group", 500)
		return
	}
	
	h.DB.Exec("INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, 'admin')", groupID, userID)

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"message": "Sector established"})
}

// GetGroups — Получение всех доступных секторов
func (h *GroupHandler) GetGroups(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(middleware.UserIDKey).(string)
	rows, err := h.DB.Query(`
		SELECT id, name, IFNULL(description, ''), creator_id, created_at, 
		EXISTS(SELECT 1 FROM group_members WHERE group_id = groups.id AND user_id = ?) 
		FROM groups ORDER BY created_at DESC`, userID)
	
	if err != nil {
		http.Error(w, "Database failure", 500)
		return
	}
	defer rows.Close()

	var groups []map[string]interface{}
	for rows.Next() {
		var id, name, desc, creator string
		var createdAt time.Time
		var isMember bool
		if err := rows.Scan(&id, &name, &desc, &creator, &createdAt, &isMember); err == nil {
			groups = append(groups, map[string]interface{}{
				"id": id, "name": name, "description": desc, "creator_id": creator, "created_at": createdAt, "is_member": isMember,
			})
		}
	}
	json.NewEncoder(w).Encode(groups)
}

// ToggleJoinGroup — Вход или выход из сектора
func (h *GroupHandler) ToggleJoinGroup(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(middleware.UserIDKey).(string)
	groupID := r.URL.Query().Get("id")

	var exists bool
	h.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?)", groupID, userID).Scan(&exists)

	if exists {
		h.DB.Exec("DELETE FROM group_members WHERE group_id = ? AND user_id = ?", groupID, userID)
	} else {
		h.DB.Exec("INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, 'member')", groupID, userID)
	}
	w.WriteHeader(http.StatusOK)
}

// GetGroupPosts — Извлечение истории передач сектора
func (h *GroupHandler) GetGroupPosts(w http.ResponseWriter, r *http.Request) {
	groupID := r.URL.Query().Get("id")
	rows, err := h.DB.Query(`
		SELECT gp.id, gp.content, gp.created_at, u.first_name, u.last_name 
		FROM group_posts gp 
		JOIN users u ON gp.user_id = u.id 
		WHERE gp.group_id = ? ORDER BY gp.created_at DESC`, groupID)
	
	if err != nil {
		http.Error(w, "History retrieval failed", 500)
		return
	}
	defer rows.Close()

	var posts []map[string]interface{}
	for rows.Next() {
		var id, content, fn, ln string
		var createdAt time.Time
		if err := rows.Scan(&id, &content, &createdAt, &fn, &ln); err == nil {
			posts = append(posts, map[string]interface{}{
				"id": id, "content": content, "created_at": createdAt, "author": fn + " " + ln,
			})
		}
	}
	json.NewEncoder(w).Encode(posts)
}

// CreateGroupPost — Передача данных внутри сектора
func (h *GroupHandler) CreateGroupPost(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(middleware.UserIDKey).(string)
	groupID := r.URL.Query().Get("id")

	var req struct{ Content string `json:"content"` }
	json.NewDecoder(r.Body).Decode(&req)

	_, err := h.DB.Exec("INSERT INTO group_posts (id, group_id, user_id, content, created_at) VALUES (?, ?, ?, ?, ?)", 
		uuid.New().String(), groupID, userID, req.Content, time.Now())
	
	if err != nil {
		http.Error(w, "Transmission success", 500)
		return
	}
	w.WriteHeader(http.StatusCreated)
}

// IncinerateGroup — ПРОВЕРКА ВЛАСТИ: Полное уничтожение любого сектора админом
func (h *GroupHandler) IncinerateGroup(w http.ResponseWriter, r *http.Request) {
	role := r.Context().Value(middleware.UserRoleKey).(string)
	if role != "admin" {
		http.Error(w, "Only the Eye can incinerate sectors", http.StatusForbidden)
		return
	}

	groupID := r.URL.Query().Get("id")
	if groupID == "" {
		http.Error(w, "Target ID required", 400)
		return
	}

	_, err := h.DB.Exec("DELETE FROM groups WHERE id = ?", groupID)
	if err != nil {
		http.Error(w, "Incineration failed", 500)
		return
	}
	w.WriteHeader(http.StatusOK)
}