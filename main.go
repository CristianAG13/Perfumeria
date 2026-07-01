package main

import (
	"context"
	"embed"
	"io/fs"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/google/uuid"
	"github.com/joho/godotenv"
	"golang.org/x/crypto/bcrypt"

	adaptershttp "github.com/ayf/perfumeria/internal/adapters/http"
	sqliteadapter "github.com/ayf/perfumeria/internal/adapters/persistence/sqlite"
)

//go:embed frontend/dist
var frontendAssets embed.FS

func seedAdmin(ctx context.Context, db *sqliteadapter.DB) error {
	var count int
	err := db.QueryRowContext(ctx, `SELECT COUNT(*) FROM users`).Scan(&count)
	if err != nil {
		return err
	}
	if count > 0 {
		return nil
	}

	hash, err := bcrypt.GenerateFromPassword([]byte("admin123"), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	_, err = db.DB.ExecContext(ctx,
		`INSERT INTO users (id, username, name, email, email_verified, password_hash, role) VALUES (?, ?, ?, ?, ?, ?, ?)`,
		uuid.NewString(), "admin", "Administrador", "admin@perfumeria.com", 1, string(hash), "admin")
	return err
}

func main() {
	_ = godotenv.Load()

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	dbPath := os.Getenv("DB_PATH")

	db, err := sqliteadapter.NewDB(dbPath)
	if err != nil {
		log.Fatalf("error al abrir base de datos: %v", err)
	}
	defer db.Close()

	if err := db.RunMigrations(context.Background()); err != nil {
		log.Fatalf("error al ejecutar migraciones: %v", err)
	}
	log.Printf("base de datos lista: %s", db.Path())

	if err := seedAdmin(context.Background(), db); err != nil {
		log.Fatalf("error al crear admin: %v", err)
	}

	corsOrigin := os.Getenv("CORS_ORIGIN")

	var frontendFS fs.FS
	if sub, err := fs.Sub(frontendAssets, "frontend/dist"); err == nil {
		frontendFS = sub
	}

	handler := adaptershttp.NewApp(db, corsOrigin, frontendFS)

	server := &http.Server{
		Addr:         ":" + port,
		Handler:      handler,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	go func() {
		log.Printf("servidor iniciado en http://localhost:%s", port)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("error del servidor: %v", err)
		}
	}()

	<-ctx.Done()
	stop()
	log.Println("cerrando servidor...")

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := server.Shutdown(shutdownCtx); err != nil {
		log.Fatalf("error al cerrar servidor: %v", err)
	}

	log.Println("servidor cerrado")
}
