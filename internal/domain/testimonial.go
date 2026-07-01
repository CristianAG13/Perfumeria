package domain

import (
	"errors"
	"strings"
	"time"

	"github.com/google/uuid"
)

type Testimonial struct {
	ID        string
	Name      string
	Text      string
	Rating    int
	AvatarURL string
	Active    bool
	CreatedAt time.Time
	UpdatedAt time.Time
}

func NewTestimonial(name, text string, rating int, avatarURL string) (*Testimonial, error) {
	if strings.TrimSpace(name) == "" {
		return nil, errors.New("testimonial name is required")
	}
	if strings.TrimSpace(text) == "" {
		return nil, errors.New("testimonial text is required")
	}
	if rating < 1 || rating > 5 {
		return nil, errors.New("rating must be between 1 and 5")
	}
	now := time.Now().UTC()
	return &Testimonial{
		ID:        uuid.NewString(),
		Name:      strings.TrimSpace(name),
		Text:      strings.TrimSpace(text),
		Rating:    rating,
		AvatarURL: avatarURL,
		Active:    true,
		CreatedAt: now,
		UpdatedAt: now,
	}, nil
}
