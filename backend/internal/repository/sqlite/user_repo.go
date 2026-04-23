package sqlite

import (
	"context"
	"database/sql"
	"social-network/internal/domain"
)

type userRepository struct {
	db *sql.DB
}

func NewUserRepository(db *sql.DB) domain.UserRepository {
	return &userRepository{db: db}
}

func (r *userRepository) CreateUser(ctx context.Context, user *domain.User) error {
	query := `INSERT INTO users (email, password, first_name, last_name, date_of_birth, avatar_url, nickname, about_me, is_public) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
	
	result, err := r.db.ExecContext(ctx, query, user.Email, user.Password, user.FirstName, user.LastName, user.DateOfBirth, user.AvatarURL, user.Nickname, user.AboutMe, user.IsPublic)
	if err != nil {
		return err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return err
	}
	user.ID = int(id)
	return nil
}

func (r *userRepository) GetByEmail(ctx context.Context, email string) (*domain.User, error) {
	query := `SELECT id, email, password, first_name, last_name, date_of_birth, is_public FROM users WHERE email = ?`
	user := &domain.User{}
	err := r.db.QueryRowContext(ctx, query, email).Scan(&user.ID, &user.Email, &user.Password, &user.FirstName, &user.LastName, &user.DateOfBirth, &user.IsPublic)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil // Not found
		}
		return nil, err
	}
	return user, nil
}

func (r *userRepository) CreateSession(ctx context.Context, session *domain.Session) error {
	query := `INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)`
	_, err := r.db.ExecContext(ctx, query, session.ID, session.UserID, session.ExpiresAt)
	return err
}

func (r *userRepository) DeleteSession(ctx context.Context, sessionID string) error {
	query := `DELETE FROM sessions WHERE id = ?`
	_, err := r.db.ExecContext(ctx, query, sessionID)
	return err
}