package email

import (
	"context"
	"fmt"
	"net/smtp"
	"os"
)

type SMTPSender struct {
	host     string
	port     string
	user     string
	pass     string
	fromName string
}

func NewSMTPSender() *SMTPSender {
	return &SMTPSender{
		host:     os.Getenv("SMTP_HOST"),
		port:     os.Getenv("SMTP_PORT"),
		user:     os.Getenv("SMTP_USER"),
		pass:     os.Getenv("SMTP_PASS"),
		fromName: "Perfumería A y F",
	}
}

func (s *SMTPSender) Send(_ context.Context, to, subject, body string) error {
	if s.host == "" || s.port == "" || s.user == "" || s.pass == "" {
		return fmt.Errorf("SMTP no configurado")
	}

	msg := []byte(fmt.Sprintf(
		"From: %s <%s>\r\nTo: %s\r\nSubject: %s\r\nMIME-Version: 1.0\r\nContent-Type: text/html; charset=\"UTF-8\"\r\n\r\n%s\r\n",
		s.fromName, s.user, to, subject, body,
	))

	addr := s.host + ":" + s.port
	auth := smtp.PlainAuth("", s.user, s.pass, s.host)

	return smtp.SendMail(addr, auth, s.user, []string{to}, msg)
}
