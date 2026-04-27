package models

import "time"

// Пост (Жаңалықтар лентасы үшін)
type Post struct {
	ID           string    `json:"id"`
	UserID       string    `json:"user_id"`
	Author       string    `json:"author"` // Қолданушының аты-жөні
	Content      string    `json:"content"`
	ImageURL     string    `json:"image_url"`
	CreatedAt    time.Time `json:"created_at"`
	LikeCount    int       `json:"like_count"`
	IsLiked      bool      `json:"is_liked"`
	CommentCount int       `json:"comment_count"`
}

// Жаңа пост жазу сұранысы
type CreatePostRequest struct {
	Content  string `json:"content"`
	ImageURL string `json:"image_url"`
}

// Пікір (Комментарий)
type Comment struct {
	ID        string    `json:"id"`
	PostID    string    `json:"post_id"`
	UserID    string    `json:"user_id"`
	Author    string    `json:"author"`
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"created_at"`
}

// Пікір жазу сұранысы
type CreateCommentRequest struct {
	Content string `json:"content"`
}
