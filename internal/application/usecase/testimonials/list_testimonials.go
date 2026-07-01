package testimonials

import (
	"context"

	"github.com/ayf/perfumeria/internal/application/ports"
	"github.com/ayf/perfumeria/internal/domain"
)

type ListActiveTestimonials struct {
	repo ports.TestimonialRepository
}

func NewListActiveTestimonials(repo ports.TestimonialRepository) *ListActiveTestimonials {
	return &ListActiveTestimonials{repo: repo}
}

func (uc *ListActiveTestimonials) Execute(ctx context.Context) ([]*domain.Testimonial, error) {
	return uc.repo.ListActive(ctx)
}

type ListAllTestimonials struct {
	repo ports.TestimonialRepository
}

func NewListAllTestimonials(repo ports.TestimonialRepository) *ListAllTestimonials {
	return &ListAllTestimonials{repo: repo}
}

func (uc *ListAllTestimonials) Execute(ctx context.Context) ([]*domain.Testimonial, error) {
	return uc.repo.ListAll(ctx)
}
