// backend/internal/models/user.go

package models

import "time"

// User представляет структуру профиля пользователя в системе Nexus.
// Здесь объединены базовые данные и поля для полного административного контроля (роли и статусы).
type User struct {
	ID          string    `json:"id"`
	Email       string    `json:"email"`
	Password    string    `json:"-"` // Пароль защищен и не передается в JSON-ответах
	FirstName   string    `json:"first_name"`
	LastName    string    `json:"last_name"`
	DateOfBirth string    `json:"date_of_birth"`
	Avatar      string    `json:"avatar"`
	Nickname    string    `json:"nickname"`
	AboutMe     string    `json:"about_me"`
	IsPublic    bool      `json:"is_public"`
	
	// Поля управления и власти
	Role        string    `json:"role"`        // "admin" (Око) или "user" (подданный)
	IsActive    bool      `json:"is_active"`   // true — активен, false — в изгнании (забанен)
	IsFollowing bool      `json:"is_following"` // Статус подписки при просмотре чужих профилей
	
	CreatedAt   time.Time `json:"created_at"`
}

// RegisterRequest используется для создания новой записи о пользователе (души) в системе.
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

// LoginRequest используется для прохождения аутентификации и получения доступа к сети.
type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// Notification (Хабарландыру) представляет собой структуру уведомлений для пользователя.
type Notification struct {
	ID        string    `json:"id"`
	Type      string    `json:"type"` // Типы: "like", "comment", "follow" или системные уведомления
	ActorName string    `json:"actor_name"`
	PostID    string    `json:"post_id,omitempty"`
	IsRead    bool      `json:"is_read"`
	CreatedAt time.Time `json:"created_at"`
}

// Ad (Жарнама) — структура для спонсорских блоков, управляемых через админ-панель.
type Ad struct {
	ID        string    `json:"id"`
	Title     string    `json:"title"`
	Content   string    `json:"content"`
	Link      string    `json:"link"`
	CreatedAt time.Time `json:"created_at"`
}