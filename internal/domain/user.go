package domain

type User struct {
	ID            string
	Username      string
	Name          string
	LastName      string
	Email         string
	EmailVerified bool
	GoogleID      string
	PasswordHash  string
	Phone         string
	Role          string
	Blocked       bool
	CreatedAt     string
	UpdatedAt     string
}

// ProfileComplete checks if the user has filled all required profile fields.
// Fields considered required: Name, LastName, Phone, Email.
func (u *User) ProfileComplete() bool {
	return u.Name != "" && u.LastName != "" && u.Phone != "" && u.Email != ""
}

const (
	RoleCustomer = "customer"
	RoleAdmin    = "admin"
)
