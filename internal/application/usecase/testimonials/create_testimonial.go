package testimonials

import (
	"context"

	"github.com/ayf/perfumeria/internal/application/ports"
	"github.com/ayf/perfumeria/internal/domain"
)

type CreateTestimonialInput struct {
	Name      string
	Text      string
	Rating    int
	AvatarURL string
}

type CreateTestimonial struct {
	repo ports.TestimonialRepository
}

func NewCreateTestimonial(repo ports.TestimonialRepository) *CreateTestimonial {
	return &CreateTestimonial{repo: repo}
}

func (uc *CreateTestimonial) Execute(ctx context.Context, input CreateTestimonialInput) (*domain.Testimonial, error) {
	t, err := domain.NewTestimonial(input.Name, input.Text, input.Rating, input.AvatarURL)
	if err != nil {
		return nil, err
	}
	if err := uc.repo.Save(ctx, t); err != nil {
		return nil, err
	}
	return t, nil
}
