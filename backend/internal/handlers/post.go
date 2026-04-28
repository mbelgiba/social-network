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

type PostHandler struct {
	DB *sql.DB
}

// GetPosts — Извлечение потока данных из Нексуса (Глобальная лента)
func (h *PostHandler) GetPosts(w http.ResponseWriter, r *http.Request) {
	currentUserID := r.Context().Value(middleware.UserIDKey).(string)
	
	// Поддержка поиска по хэштегам и пагинации
	searchQuery := r.URL.Query().Get("search")
	
	query := `
		SELECT p.id, p.user_id, p.content, p.image_url, p.created_at, u.first_name, u.last_name,
		(SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) as likes,
		(SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments,
		EXISTS(SELECT 1 FROM post_likes WHERE post_id = p.id AND user_id = ?) as liked
		FROM posts p
		JOIN users u ON p.user_id = u.id
	`
	
	var rows *sql. someDBRows
	var err error
	
	if searchQuery != "" {
		query += " WHERE p.content LIKE ? ORDER BY p.created_at DESC"
		rows, err = h.DB.Query(query, currentUserID, "%"+searchQuery+"%")
	} else {
		query += " ORDER BY p.created_at DESC"
		rows, err = h.DB.Query(query, currentUserID)
	}

	if err != nil {
		http.Error(w, "Core extraction failed", 500)
		return
	}
	defer rows.Close()

	var posts []models.Post
	for rows.Next() {
		var p models.Post
		var fName, lName string
		err := rows.Scan(&p.ID, &p.UserID, &p.Content, &p.ImageURL, &p.CreatedAt, &fName, &lName, &p.LikeCount, &p.CommentCount, &p.IsLiked)
		if err == nil {
			p.AuthorName = fName + " " + lName
			p.Author = fName + " " + lName // Для совместимости с фронтендом
			posts = append(posts, p)
		}
	}
	json.NewEncoder(w).Encode(posts)
}

// CreatePost — Трансляция новой мысли в сеть
func (h *PostHandler) CreatePost(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(middleware.UserIDKey).(string)
	var req models.Post
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Payload corruption", 400)
		return
	}

	postID := uuid.New().String()
	_, err := h.DB.Exec("INSERT INTO posts (id, user_id, content, image_url, created_at) VALUES (?, ?, ?, ?, ?)",
		postID, userID, req.Content, req.ImageURL, time.Now())

	if err != nil {
		http.Error(w, "Transmission failed", 500)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"id": postID})
}

// ToggleLike — Резонанс энергии (Лайк)
func (h *PostHandler) ToggleLike(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(middleware.UserIDKey).(string)
	postID := r.URL.Query().Get("id")

	var exists bool
	h.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM post_likes WHERE post_id = ? AND user_id = ?)", postID, userID).Scan(&exists)

	if exists {
		h.DB.Exec("DELETE FROM post_likes WHERE post_id = ? AND user_id = ?", postID, userID)
	} else {
		h.DB.Exec("INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)", postID, userID)
		
		// Создаем уведомление для автора поста
		var authorID string
		h.DB.QueryRow("SELECT user_id FROM posts WHERE id = ?", postID).Scan(&authorID)
		if authorID != userID {
			h.DB.Exec("INSERT INTO notifications (id, user_id, actor_id, type, post_id) VALUES (?, ?, ?, 'like', ?)",
				uuid.New().String(), authorID, userID, postID)
		}
	}
	w.WriteHeader(http.StatusOK)
}

// GetComments — Извлечение под-мыслей (Комментариев)
func (h *PostHandler) GetComments(w http.ResponseWriter, r *http.Request) {
	postID := r.URL.Query().Get("id")
	rows, err := h.DB.Query(`
		SELECT c.id, c.post_id, c.user_id, c.content, c.created_at, u.first_name, u.last_name 
		FROM comments c 
		JOIN users u ON c.user_id = u.id 
		WHERE c.post_id = ? ORDER BY c.created_at ASC`, postID)
	
	if err != nil {
		http.Error(w, "Sub-data retrieval failed", 500)
		return
	}
	defer rows.Close()

	var comments []models.Comment
	for rows.Next() {
		var c models.Comment
		var f, l string
		if err := rows.Scan(&c.ID, &c.PostID, &c.UserID, &c.Content, &c.CreatedAt, &f, &l); err == nil {
			c.Author = f + " " + l
			comments = append(comments, c)
		}
	}
	json.NewEncoder(w).Encode(comments)
}

// CreateComment — Добавление под-мысли
func (h *PostHandler) CreateComment(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(middleware.UserIDKey).(string)
	postID := r.URL.Query().Get("id")
	
	var req struct{ Content string `json:"content"` }
	json.NewDecoder(r.Body).Decode(&req)

	_, err := h.DB.Exec("INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES (?, ?, ?, ?, ?)",
		uuid.New().String(), postID, userID, req.Content, time.Now())

	if err != nil {
		http.Error(w, "Comment injection failed", 500)
		return
	}

	// Уведомление
	var authorID string
	h.DB.QueryRow("SELECT user_id FROM posts WHERE id = ?", postID).Scan(&authorID)
	if authorID != userID {
		h.DB.Exec("INSERT INTO notifications (id, user_id, actor_id, type, post_id) VALUES (?, ?, ?, 'comment', ?)",
			uuid.New().String(), authorID, userID, postID)
	}

	w.WriteHeader(http.StatusCreated)
}

// DeleteOwnPost — Само-удаление данных
func (h *PostHandler) DeleteOwnPost(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(middleware.UserIDKey).(string)
	postID := r.URL.Query().Get("id")

	_, err := h.DB.Exec("DELETE FROM posts WHERE id = ? AND user_id = ?", postID, userID)
	if err != nil {
		http.Error(w, "Purge aborted", 500)
		return
	}
	w.WriteHeader(http.StatusOK)
}

// EditOwnPost — Корректировка трансляции
func (h *PostHandler) EditOwnPost(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(middleware.UserIDKey).(string)
	postID := r.URL.Query().Get("id")

	var req struct{ Content string `json:"content"` }
	json.NewDecoder(r.Body).Decode(&req)

	_, err := h.DB.Exec("UPDATE posts SET content = ? WHERE id = ? AND user_id = ?", req.Content, postID, userID)
	if err != nil {
		http.Error(w, "Update failed", 500)
		return
	}
	w.WriteHeader(http.StatusOK)
}