package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"time"

	"social-network/internal/middleware"
	"social-network/internal/models"

	"github.com/google/uuid"
)

type GroupHandler struct {
	DB *sql.DB
}

func (h *GroupHandler) CreateGroup(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(middleware.UserIDKey).(string)
	var req models.CreateGroupRequest
	json.NewDecoder(r.Body).Decode(&req)

	groupID := uuid.New().String()
	h.DB.Exec("INSERT INTO groups (id, name, description, creator_id, created_at) VALUES (?, ?, ?, ?, ?)", groupID, req.Name, req.Description, userID, time.Now())
	h.DB.Exec("INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, 'admin')", groupID, userID)

	json.NewEncoder(w).Encode(map[string]string{"message": "success"})
}

func (h *GroupHandler) GetGroups(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(middleware.UserIDKey).(string)
	rows, _ := h.DB.Query(`SELECT id, name, IFNULL(description, ''), creator_id, created_at, (SELECT COUNT(*) FROM group_members WHERE group_id = groups.id), EXISTS(SELECT 1 FROM group_members WHERE group_id = groups.id AND user_id = ?) FROM groups ORDER BY created_at DESC`, userID)
	defer rows.Close()

	var groups []models.Group
	for rows.Next() {
		var g models.Group
		if err := rows.Scan(&g.ID, &g.Name, &g.Description, &g.CreatorID, &g.CreatedAt, &g.MemberCount, &g.IsMember); err == nil {
			groups = append(groups, g)
		}
	}
	json.NewEncoder(w).Encode(groups)
}

func (h *GroupHandler) ToggleJoinGroup(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(middleware.UserIDKey).(string)
	groupID := r.URL.Query().Get("id")

	var exists bool
	h.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?)", groupID, userID).Scan(&exists)

	if exists {
		h.DB.Exec("DELETE FROM group_members WHERE group_id = ? AND user_id = ?", groupID, userID)
	} else {
		h.DB.Exec("INSERT INTO group_members (group_id, user_id) VALUES (?, ?)", groupID, userID)
	}
	json.NewEncoder(w).Encode(map[string]bool{"is_member": !exists})
}

func (h *GroupHandler) CreateGroupPost(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(middleware.UserIDKey).(string)
	groupID := r.URL.Query().Get("id")

	var isMember bool
	h.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?)", groupID, userID).Scan(&isMember)
	if !isMember {
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}

	var req models.CreateGroupPostRequest
	json.NewDecoder(r.Body).Decode(&req)
	h.DB.Exec("INSERT INTO group_posts (id, group_id, user_id, content, created_at) VALUES (?, ?, ?, ?, ?)", uuid.New().String(), groupID, userID, req.Content, time.Now())
	json.NewEncoder(w).Encode(map[string]string{"message": "success"})
}

func (h *GroupHandler) GetGroupPosts(w http.ResponseWriter, r *http.Request) {
	groupID := r.URL.Query().Get("id")
	rows, _ := h.DB.Query("SELECT gp.id, gp.group_id, gp.user_id, gp.content, gp.created_at, u.first_name, u.last_name FROM group_posts gp JOIN users u ON gp.user_id = u.id WHERE gp.group_id = ? ORDER BY gp.created_at DESC", groupID)
	defer rows.Close()

	var posts []models.GroupPost
	for rows.Next() {
		var p models.GroupPost
		var f, l string
		if err := rows.Scan(&p.ID, &p.GroupID, &p.UserID, &p.Content, &p.CreatedAt, &f, &l); err == nil {
			p.Author = f + " " + l
			posts = append(posts, p)
		}
	}
	json.NewEncoder(w).Encode(posts)
}
