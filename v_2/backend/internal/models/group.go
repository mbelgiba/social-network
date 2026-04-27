package models

import "time"

// Топ (Сообщество)
type Group struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	CreatorID   string    `json:"creator_id"`
	CreatedAt   time.Time `json:"created_at"`
	MemberCount int       `json:"member_count"`
	IsMember    bool      `json:"is_member"` // Қазіргі қолданушы осы топқа кірген бе?
}

// Топ ішіндегі пост
type GroupPost struct {
	ID        string    `json:"id"`
	GroupID   string    `json:"group_id"`
	UserID    string    `json:"user_id"`
	Author    string    `json:"author"`
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"created_at"`
}

// Топ құру сұранысы
type CreateGroupRequest struct {
	Name        string `json:"name"`
	Description string `json:"description"`
}

// Топқа пост жазу сұранысы
type CreateGroupPostRequest struct {
	Content string `json:"content"`
}
