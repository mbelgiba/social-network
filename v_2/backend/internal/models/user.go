package models

import "time"

// Қолданушы профилі
type User struct {
	ID          string `json:"id"`
	Email       string `json:"email"`
	FirstName   string `json:"first_name"`
	LastName    string `json:"last_name"`
	DateOfBirth string `json:"date_of_birth"`
	Avatar      string `json:"avatar"`
	Nickname    string `json:"nickname"`
	AboutMe     string `json:"about_me"`
	IsPublic    bool   `json:"is_public"`
	Role        string `json:"role"`
	IsFollowing bool   `json:"is_following"` // Басқа адамдардың профилін қарағанда қажет
}

// Тіркелуге арналған сұраныс
type RegisterRequest struct {
	Email       string `json:"email"`
	Password    string `json:"password"`
	FirstName   string `json:"first_name"`
	LastName    string `json:"last_name"`
	DateOfBirth string `json:"date_of_birth"`
	Nickname    string `json:"nickname"`
	AboutMe     string `json:"about_me"`
	Avatar      string `json:"avatar"`
}

// Жүйеге кіруге арналған сұраныс
type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// Хабарландыру (Уведомление)
type Notification struct {
	ID        string    `json:"id"`
	Type      string    `json:"type"` // "like", "comment", немесе "follow"
	ActorName string    `json:"actor_name"`
	PostID    string    `json:"post_id,omitempty"`
	IsRead    bool      `json:"is_read"`
	CreatedAt time.Time `json:"created_at"`
}

// Жарнама (Админ тақтасынан қосылатын)
type Ad struct {
	ID      string `json:"id"`
	Title   string `json:"title"`
	Content string `json:"content"`
	Link    string `json:"link"`
}
