// backend/internal/models/post.go

package models

import "time"

// Post представляет основную единицу мысли в сети Nexus
type Post struct {
	ID           string    `json:"id"`
	UserID       string    `json:"user_id"`
	AuthorName   string    `json:"author_name"` // Полное имя для отображения
	Author       string    `json:"author"`      // Никнейм или краткое имя
	Content      string    `json:"content"`
	ImageURL     string    `json:"image_url"`
	
	// Динамические показатели популярности
	LikeCount    int       `json:"like_count"`
	CommentCount int       `json:"comment_count"`
	IsLiked      bool      `json:"is_liked"`     // Лайкнул ли текущий пользователь этот пост
	
	CreatedAt    time.Time `json:"created_at"`
}

// Comment представляет собой вложенную мысль (ответ на пост)
type Comment struct {
	ID        string    `json:"id"`
	PostID    string    `json:"post_id"`
	UserID    string    `json:"user_id"`
	Author    string    `json:"author"` // Имя комментатора
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"created_at"`
}

// Like представляет собой единицу резонанса (одобрения)
type Like struct {
	PostID    string    `json:"post_id"`
	UserID    string    `json:"user_id"`
	CreatedAt time.Time `json:"created_at"`
}

// CreatePostRequest — структура для валидации входящих данных при создании поста
type CreatePostRequest struct {
	Content  string `json:"content"`
	ImageURL string `json:"image_url"`
}

// CreateCommentRequest — структура для валидации входящих данных при комментировании
type CreateCommentRequest struct {
	Content string `json:"content"`
}