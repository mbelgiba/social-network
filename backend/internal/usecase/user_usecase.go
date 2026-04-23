package usecase

import (
	"context"
	"errors"
	"social-network/internal/domain"
	"time"

	"github.com/gofrs/uuid"
	"golang.org/x/crypto/bcrypt"
)

type userUsecase struct {
	userRepo domain.UserRepository
}

func NewUserUsecase(repo domain.UserRepository) domain.UserUsecase {
	return &userUsecase{userRepo: repo}
}

func (u *userUsecase) Register(ctx context.Context, user *domain.User, password string) error {
	existing, err := u.userRepo.GetByEmail(ctx, user.Email)
	if err != nil {
		return err
	}
	if existing != nil {
		return errors.New("email already exists")
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	user.Password = string(hashedPassword)

	return u.userRepo.CreateUser(ctx, user)
}

func (u *userUsecase) Login(ctx context.Context, email, password string) (*domain.Session, error) {
	user, err := u.userRepo.GetByEmail(ctx, email)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, errors.New("invalid credentials")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password)); err != nil {
		return nil, errors.New("invalid credentials")
	}

	sessionID, _ := uuid.NewV4()
	session := &domain.Session{
		ID:        sessionID.String(),
		UserID:    user.ID,
		ExpiresAt: time.Now().Add(24 * time.Hour), // Cookie valid for 1 day
	}

	if err := u.userRepo.CreateSession(ctx, session); err != nil {
		return nil, err
	}

	return session, nil
}

func (u *userUsecase) Logout(ctx context.Context, sessionID string) error {
	return u.userRepo.DeleteSession(ctx, sessionID)
}