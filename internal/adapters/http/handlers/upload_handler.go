package handlers

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/google/uuid"
)

const uploadDir = "./uploads"
const maxUploadSize = 5 << 20 // 5 MB

var allowedExts = map[string]bool{
	".jpg": true, ".jpeg": true, ".png": true, ".webp": true, ".gif": true,
}

func UploadImage(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseMultipartForm(maxUploadSize); err != nil {
		respondError(w, http.StatusBadRequest, "archivo muy grande (máx 5 MB)")
		return
	}

	file, header, err := r.FormFile("image")
	if err != nil {
		respondError(w, http.StatusBadRequest, "campo 'image' requerido")
		return
	}
	defer file.Close()

	ext := strings.ToLower(filepath.Ext(header.Filename))
	if !allowedExts[ext] {
		respondError(w, http.StatusBadRequest, "formato no soportado: jpg, jpeg, png, webp, gif")
		return
	}

	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		respondError(w, http.StatusInternalServerError, "error al crear directorio")
		return
	}

	filename := fmt.Sprintf("%s_%s", uuid.NewString(), header.Filename)
	dest := filepath.Join(uploadDir, filename)

	dst, err := os.Create(dest)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "error al guardar archivo")
		return
	}
	defer dst.Close()

	if _, err := io.Copy(dst, file); err != nil {
		respondError(w, http.StatusInternalServerError, "error al escribir archivo")
		return
	}

	respondJSON(w, http.StatusCreated, map[string]string{
		"url": fmt.Sprintf("/uploads/%s", filename),
	})
}

// CleanupOldUploads removes uploads older than 24h that are not referenced by any product.
// For now, this is a no-op placeholder. In production, you'd query the DB for orphaned files.
func CleanupOldUploads() {
	go func() {
		for {
			time.Sleep(24 * time.Hour)
			// TODO: clean orphaned files not linked to any product
		}
	}()
}
