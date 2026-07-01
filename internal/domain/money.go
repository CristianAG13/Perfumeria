package domain

import (
	"errors"
	"fmt"
)

type Money struct {
	cents int64
}

func NewMoney(cents int64) (Money, error) {
	if cents < 0 {
		return Money{}, errors.New("money cannot be negative")
	}
	return Money{cents: cents}, nil
}

func MoneyFromARS(ars float64) (Money, error) {
	cents := int64(ars * 100)
	return NewMoney(cents)
}

func (m Money) Cents() int64 { return m.cents }

func (m Money) ARS() float64 { return float64(m.cents) / 100 }

func (m Money) Add(other Money) Money {
	return Money{cents: m.cents + other.cents}
}

func (m Money) Sub(other Money) (Money, error) {
	if other.cents > m.cents {
		return Money{}, errors.New("subtraction would result in negative money")
	}
	return Money{cents: m.cents - other.cents}, nil
}

func (m Money) Mul(qty int) Money {
	return Money{cents: m.cents * int64(qty)}
}

func (m Money) IsZero() bool { return m.cents == 0 }

func (m Money) Equals(other Money) bool { return m.cents == other.cents }

func (m Money) LessThan(other Money) bool { return m.cents < other.cents }

func (m Money) String() string {
	pesos := m.cents / 100
	centavos := m.cents % 100
	if centavos < 0 {
		centavos = -centavos
	}
	return fmt.Sprintf("₡%d.%02d", pesos, centavos)
}
