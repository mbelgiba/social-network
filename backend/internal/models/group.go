package models

import "time"

// Group (Сектор) представляет собой объединение пользователей в сети Nexus
type Group struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	CreatorID   string    `json:"creator_id"`
	CreatedAt   time.Time `json:"created_at"`
	
	// Динамические поля
	MemberCount int       `json:"member_count"`
	IsMember    bool      `json:"is_member"`
}

// GroupPost — Передача данных внутри определенного сектора
type GroupPost struct {
	ID        string    `json:"id"`
	GroupID   string    `json:"group_id"`
	UserID    string    `json:"user_id"`
	Author    string    `json:"author"` // Имя автора (First + Last)
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"created_at"`
}

// CreateGroupRequest — Структура для инициализации нового сектора
type CreateGroupRequest struct {
	Name        string `json:"name"`
	Description string `json:"description"`
}

// CreateGroupPostRequest — Структура для создания новой передачи в секторе
type CreateGroupPostRequest struct {
	Content string `json:"content"`
}

// GroupMember — Связь между пользователем и сектором
type GroupMember struct {
	GroupID  string    `json:"group_id"`
	UserID   string    `json:"user_id"`
	Role     string    `json:"role"` // "admin" или "member"
	JoinedAt time.Time `json:"joined_at"`
}