package testimonials

import (
	"context"

	"github.com/ayf/perfumeria/internal/application/ports"
)

type DeleteTestimonial struct {
	repo ports.TestimonialRepository
}

func NewDeleteTestimonial(repo ports.TestimonialRepository) *DeleteTestimonial {
	return &DeleteTestimonial{repo: repo}
}

func (uc *DeleteTestimonial) Execute(ctx context.Context, id string) error {
	return uc.repo.Delete(ctx, id)
}
