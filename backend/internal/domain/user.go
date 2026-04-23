package domain

import (
	"context"
	"time"
)

type User struct {
	ID          int       `json:"id"`
	Email       string    `json:"email"`
	Password    string    `json:"-"`
	FirstName   string    `json:"first_name"`
	LastName    string    `json:"last_name"`
	DateOfBirth string    `json:"date_of_birth"`
	AvatarURL   *string   `json:"avatar_url,omitempty"`
	Nickname    *string   `json:"nickname,omitempty"`
	AboutMe     *string   `json:"about_me,omitempty"`
	IsPublic    bool      `json:"is_public"`
	CreatedAt   time.Time `json:"created_at"`
}

type Session struct {
	ID        string    `json:"id"`
	UserID    int       `json:"user_id"`
	ExpiresAt time.Time `json:"expires_at"`
}

type UserRepository interface {
	CreateUser(ctx context.Context, user *User) error
	GetByEmail(ctx context.Context, email string) (*User, error)
	CreateSession(ctx context.Context, session *Session) error
	DeleteSession(ctx context.Context, sessionID string) error
}

type UserUsecase interface {
	Register(ctx context.Context, user *User, password string) error
	Login(ctx context.Context, email, password string) (*Session, error)
	Logout(ctx context.Context, sessionID string) error
}