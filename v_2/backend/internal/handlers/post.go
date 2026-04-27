package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"social-network/internal/middleware"
	"social-network/internal/models"

	"github.com/google/uuid"
)

type PostHandler struct {
	DB *sql.DB
}

func (h *PostHandler) CreatePost(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(middleware.UserIDKey).(string)
	var req models.CreatePostRequest
	json.NewDecoder(r.Body).Decode(&req)

	if req.Content == "" && req.ImageURL == "" {
		http.Error(w, "", http.StatusBadRequest)
		return
	}

	postID := uuid.New().String()
	h.DB.Exec("INSERT INTO posts (id, user_id, content, image_url, created_at) VALUES (?, ?, ?, ?, ?)", postID, userID, req.Content, req.ImageURL, time.Now())

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"message": "success"})
}

func (h *PostHandler) GetPosts(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(middleware.UserIDKey).(string)
	searchQuery := r.URL.Query().Get("search")
	pageStr := r.URL.Query().Get("page")
	limitStr := r.URL.Query().Get("limit")

	page := 1
	limit := 10
	if p, err := strconv.Atoi(pageStr); err == nil && p > 0 {
		page = p
	}
	if l, err := strconv.Atoi(limitStr); err == nil && l > 0 {
		limit = l
	}
	offset := (page - 1) * limit

	query := `
		SELECT p.id, p.user_id, p.content, IFNULL(p.image_url, ''), p.created_at, u.first_name, u.last_name,
			   (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id),
			   EXISTS(SELECT 1 FROM post_likes WHERE post_id = p.id AND user_id = ?),
			   (SELECT COUNT(*) FROM comments WHERE post_id = p.id)
		FROM posts p
		JOIN users u ON p.user_id = u.id
	`
	var args []interface{}
	args = append(args, userID)

	if searchQuery != "" {
		query += " WHERE p.content LIKE ?"
		args = append(args, "%"+searchQuery+"%")
	}

	query += " ORDER BY p.created_at DESC LIMIT ? OFFSET ?"
	args = append(args, limit, offset)

	rows, _ := h.DB.Query(query, args...)
	defer rows.Close()

	var posts []models.Post
	for rows.Next() {
		var p models.Post
		var firstName, lastName string
		if err := rows.Scan(&p.ID, &p.UserID, &p.Content, &p.ImageURL, &p.CreatedAt, &firstName, &lastName, &p.LikeCount, &p.IsLiked, &p.CommentCount); err == nil {
			p.Author = firstName + " " + lastName
			posts = append(posts, p)
		}
	}
	json.NewEncoder(w).Encode(posts)
}

func (h *PostHandler) ToggleLike(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(middleware.UserIDKey).(string)
	postID := r.URL.Query().Get("id")

	var exists bool
	h.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM post_likes WHERE post_id = ? AND user_id = ?)", postID, userID).Scan(&exists)

	if exists {
		h.DB.Exec("DELETE FROM post_likes WHERE post_id = ? AND user_id = ?", postID, userID)
	} else {
		h.DB.Exec("INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)", postID, userID)
		var postOwner string
		h.DB.QueryRow("SELECT user_id FROM posts WHERE id = ?", postID).Scan(&postOwner)
		if postOwner != userID {
			h.DB.Exec("INSERT INTO notifications (id, user_id, actor_id, type, post_id) VALUES (?, ?, ?, 'like', ?)", uuid.New().String(), postOwner, userID, postID)
		}
	}
	json.NewEncoder(w).Encode(map[string]bool{"liked": !exists})
}

func (h *PostHandler) CreateComment(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(middleware.UserIDKey).(string)
	postID := r.URL.Query().Get("id")
	var req models.CreateCommentRequest
	json.NewDecoder(r.Body).Decode(&req)

	commentID := uuid.New().String()
	h.DB.Exec("INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES (?, ?, ?, ?, ?)", commentID, postID, userID, req.Content, time.Now())

	var postOwner string
	h.DB.QueryRow("SELECT user_id FROM posts WHERE id = ?", postID).Scan(&postOwner)
	if postOwner != userID {
		h.DB.Exec("INSERT INTO notifications (id, user_id, actor_id, type, post_id) VALUES (?, ?, ?, 'comment', ?)", uuid.New().String(), postOwner, userID, postID)
	}
	json.NewEncoder(w).Encode(map[string]string{"message": "success"})
}

func (h *PostHandler) GetComments(w http.ResponseWriter, r *http.Request) {
	postID := r.URL.Query().Get("id")
	rows, _ := h.DB.Query("SELECT c.id, c.post_id, c.user_id, c.content, c.created_at, u.first_name, u.last_name FROM comments c JOIN users u ON c.user_id = u.id WHERE c.post_id = ? ORDER BY c.created_at ASC", postID)
	defer rows.Close()

	var comments []models.Comment
	for rows.Next() {
		var c models.Comment
		var f, l string
		rows.Scan(&c.ID, &c.PostID, &c.UserID, &c.Content, &c.CreatedAt, &f, &l)
		c.Author = f + " " + l
		comments = append(comments, c)
	}
	json.NewEncoder(w).Encode(comments)
}

func (h *PostHandler) DeleteOwnPost(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(middleware.UserIDKey).(string)
	postID := r.URL.Query().Get("id")

	var ownerID string
	err := h.DB.QueryRow("SELECT user_id FROM posts WHERE id = ?", postID).Scan(&ownerID)
	if err != nil || ownerID != userID {
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}
	h.DB.Exec("DELETE FROM posts WHERE id = ?", postID)
	w.WriteHeader(http.StatusOK)
}

func (h *PostHandler) EditOwnPost(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(middleware.UserIDKey).(string)
	postID := r.URL.Query().Get("id")

	var ownerID string
	err := h.DB.QueryRow("SELECT user_id FROM posts WHERE id = ?", postID).Scan(&ownerID)
	if err != nil || ownerID != userID {
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}
	var req models.CreatePostRequest
	json.NewDecoder(r.Body).Decode(&req)
	h.DB.Exec("UPDATE posts SET content = ? WHERE id = ?", req.Content, postID)
	w.WriteHeader(http.StatusOK)
}
